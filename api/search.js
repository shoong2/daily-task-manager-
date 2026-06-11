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

  const url = 'https://openapi.naver.com/v1/search/webkr.json?' + new URLSearchParams({
    query: q,
    display: '10',
  })
  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
    },
  })
  if (!res.ok) throw new Error(`Naver API ${res.status}`)
  const data = await res.json()
  return (data.items ?? []).map(item => ({
    title: (item.title ?? '').replace(/<[^>]+>/g, ''),
    url: item.link || null,
    snippet: (item.description ?? '').replace(/<[^>]+>/g, ''),
  }))
}
