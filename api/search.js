export default async function handler(req, res) {
  try {
    const q = req.query?.q?.trim()
    if (!q) return res.status(400).json({ error: '검색어가 없어요' })

    const naverResult = await fetchNaver(q).then(
      results => ({ results, error: null }),
      () => ({ results: null, error: '네이버 결과를 불러오지 못했어요' }),
    )

    res.setHeader('Cache-Control', 'no-store')
    res.json({ naver: naverResult })
  } catch {
    res.status(500).json({ error: '검색 중 오류가 발생했어요' })
  }
}

async function fetchNaver(q) {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Naver API not configured')

  const headers = {
    'X-Naver-Client-Id': clientId,
    'X-Naver-Client-Secret': clientSecret,
  }

  const settled = await Promise.allSettled([
    fetchNaverEndpoint('blog', q, headers),
    fetchNaverEndpoint('webkr', q, headers),
  ])

  if (settled.every(r => r.status === 'rejected')) {
    throw new Error('All Naver endpoints failed')
  }

  const seen = new Set()
  const merged = []
  for (const r of settled) {
    if (r.status !== 'fulfilled') continue
    for (const item of r.value) {
      if (!item.url || seen.has(item.url)) continue
      seen.add(item.url)
      merged.push(item)
    }
  }
  return merged
}

async function fetchNaverEndpoint(type, q, headers) {
  const url = `https://openapi.naver.com/v1/search/${type}.json?` + new URLSearchParams({
    query: q,
    display: '30',
  })
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`Naver ${type} ${res.status}`)
  const data = await res.json()
  return (data.items ?? []).map(item => ({
    title: (item.title ?? '').replace(/<[^>]+>/g, ''),
    url: item.link || null,
    snippet: (item.description ?? '').replace(/<[^>]+>/g, ''),
  }))
}
