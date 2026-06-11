const STOPWORDS = new Set([
  '이', '가', '은', '는', '을', '를', '의', '에', '도', '로', '와', '과',
  '한', '하는', '있는', '없는', '위한', '대한', '에서', '부터', '까지',
  '이다', '있다', '없다', '하다', '된다', '됩니다', '합니다', '입니다',
  '것은', '것을', '그리고', '그러나', '하지만', '또한', '그래서', '더',
  '및', '등', '후', '전', '중', '위', '아래',
])

export function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function extractKeywords(title) {
  return title
    .split(/[\s\[\]().,!?·|:;'"\/\\+\-=@#$%^&*~`<>{}]+/)
    .map(w => w.trim())
    .filter(w => w.length >= 2 && !STOPWORDS.has(w))
}

export function scoreResult(result, filters) {
  const { domains, keywords } = filters
  const domain = extractDomain(result.url)
  let score = 0
  const reasons = []

  const domainRule = domains[domain]
  if (domainRule?.blocked) {
    score += 100
    reasons.push(`차단된 도메인: ${domain}`)
  }

  const titleKeywords = extractKeywords(result.title)
  for (const kw of titleKeywords) {
    const kwRule = keywords[kw]
    if (kwRule?.blocked) {
      score += 40
      reasons.push(`차단된 키워드: ${kw}`)
    } else if (kwRule) {
      score += 10
    }
  }

  return { score, filtered: score >= 60, reasons }
}
