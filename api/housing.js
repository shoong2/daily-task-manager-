const ENDPOINT = 'https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1'

function mapType(name) {
  if (!name) return '기타'
  if (name.includes('매입임대')) return '매입임대'
  if (name.includes('행복주택')) return '행복주택'
  if (name.includes('영구임대') || name.includes('국민임대') || name.includes('공공임대')) return '공공임대'
  return '기타'
}

function formatDeadline(dotted) {
  if (!dotted || typeof dotted !== 'string') return ''
  return dotted.replace(/\./g, '-')
}

export default async function handler(req, res) {
  const apiKey = process.env.DATA_GO_KR_KEY
  if (!apiKey) {
    return res.status(200).json({ items: [], error: 'API key missing' })
  }

  try {
    const url = ENDPOINT + '?' + new URLSearchParams({
      serviceKey: apiKey,
      CNP_CD: '41',
      PG_SZ: '50',
      PAGE: '1',
    })

    const response = await fetch(url)
    if (!response.ok) {
      return res.status(200).json({ items: [], error: `LH API ${response.status}` })
    }

    const data = await response.json()
    if (!Array.isArray(data)) {
      return res.status(200).json({ items: [], error: 'unexpected response shape' })
    }

    const merged = data.reduce((acc, o) => (o ? { ...acc, ...o } : acc), {})

    const ssCode = merged.resHeader?.[0]?.SS_CODE
    if (ssCode !== 'Y') {
      return res.status(200).json({ items: [], error: `LH SS_CODE=${ssCode}` })
    }

    const items = (merged.dsList ?? [])
      .filter(row => row.UPP_AIS_TP_NM === '임대주택')
      .map(row => ({
        id: row.PAN_ID,
        title: row.PAN_NM,
        type: mapType(row.AIS_TP_CD_NM),
        deadline: formatDeadline(row.CLSG_DT),
        status: row.PAN_SS,
        url: row.DTL_URL,
      }))

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')
    res.status(200).json({ items, error: null })
  } catch (e) {
    res.status(200).json({ items: [], error: e?.message ?? 'unknown error' })
  }
}
