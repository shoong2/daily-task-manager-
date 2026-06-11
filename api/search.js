export default async function handler(req, res) {
  try {
    const q = req.query?.q?.trim()
    if (!q) return res.status(400).json({ error: '검색어가 없어요' })

    const [googleResult, naverResult] = await Promise.allSettled([
      fetchGoogle(q),
      fetchNaver(q),
    ])

    res.setHeader('Cache-Control', 'no-store')
    res.json({
      google: googleResult.status === 'fulfilled'
        ? { results: googleResult.value, error: null }
        : { results: null, error: '구글 결과를 불러오지 못했어요' },
      naver: naverResult.status === 'fulfilled'
        ? { results: naverResult.value, error: null }
        : { results: null, error: '네이버 결과를 불러오지 못했어요' },
    })
  } catch {
    res.status(500).json({ error: '검색 중 오류가 발생했어요' })
  }
}

async function fetchGoogle(q) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID
  if (!apiKey || !engineId) throw new Error('Google API not configured')

  const url = 'https://www.googleapis.com/customsearch/v1?' + new URLSearchParams({
    key: apiKey,
    cx: engineId,
    q,
    num: '10',
  })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Google API ${res.status}`)
  const data = await res.json()
  return (data.items ?? []).map(item => ({
    title: item.title ?? '',
    url: item.link,
    snippet: item.snippet ?? '',
  }))
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
