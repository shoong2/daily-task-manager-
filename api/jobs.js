const ENDPOINT = 'https://openapi.gg.go.kr/GGJOBABARECRUSTM'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
const MAX_RESULTS = 30

function formatDeadline(raw) {
  if (!raw || typeof raw !== 'string' || raw.length !== 8) return raw ?? ''
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
}

function matchesKeyword(row, keyword) {
  const needle = keyword.toLowerCase()
  const fields = [row.PBANC_CONT, row.ENTRPRS_NM, row.RECRUT_FIELD_NM]
  return fields.some(f => typeof f === 'string' && f.toLowerCase().includes(needle))
}

function normalize(row) {
  return {
    id: row.URL,
    title: row.PBANC_CONT,
    organization: row.ENTRPRS_NM,
    employmentType: row.PBANC_FORM_DIV,
    region: row.WORK_REGION_CONT ?? null,
    deadline: formatDeadline(row.RCPT_END_DE),
    url: row.URL,
  }
}

export default async function handler(req, res) {
  const apiKey = process.env.GG_DATA_KEY
  if (!apiKey) {
    return res.status(200).json({ items: [], error: 'API key missing' })
  }

  const keyword = req.query?.keyword?.trim()
  const pSize = keyword ? '200' : '30'

  try {
    const url = ENDPOINT + '?' + new URLSearchParams({
      KEY: apiKey,
      Type: 'json',
      pIndex: '1',
      pSize,
    })

    const response = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!response.ok) {
      return res.status(200).json({ items: [], error: `Jobaba API ${response.status}` })
    }

    const data = await response.json()
    const root = data?.GGJOBABARECRUSTM
    if (!Array.isArray(root)) {
      return res.status(200).json({ items: [], error: 'unexpected response shape' })
    }

    const code = root[0]?.head?.find(h => h.RESULT)?.RESULT?.CODE
    if (code && code !== 'INFO-000') {
      const message = root[0].head.find(h => h.RESULT)?.RESULT?.MESSAGE ?? code
      return res.status(200).json({ items: [], error: `${code}: ${message}` })
    }

    const rows = root[1]?.row ?? []
    const matched = keyword ? rows.filter(r => matchesKeyword(r, keyword)) : rows
    const items = matched.slice(0, MAX_RESULTS).map(normalize)

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')
    res.status(200).json({ items, error: null })
  } catch (e) {
    res.status(200).json({ items: [], error: e?.message ?? 'unknown error' })
  }
}
