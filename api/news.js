export default async function handler(req, res) {
  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'NEWS_API_KEY not configured' })
  }

  try {
    const url = 'https://newsapi.org/v2/everything?' + new URLSearchParams({
      q: 'game development OR video games OR indie game',
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: '5',
    })

    const response = await fetch(url, {
      headers: { 'X-Api-Key': apiKey },
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: 'NewsAPI error' })
    }

    const data = await response.json()

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
    res.json({ articles: data.articles ?? [] })
  } catch {
    res.status(500).json({ error: '뉴스를 불러오지 못했습니다' })
  }
}
