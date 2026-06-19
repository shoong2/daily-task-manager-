import { describe, it, expect } from 'vitest'
import { extractDomain, extractKeywords, scoreResult } from './filterEngine'

describe('extractDomain', () => {
  it('https URL에서 도메인을 추출한다', () => {
    expect(extractDomain('https://www.tistory.com/entry/123')).toBe('tistory.com')
  })

  it('www 없는 URL도 처리한다', () => {
    expect(extractDomain('https://example.com/page/1')).toBe('example.com')
  })

  it('잘못된 URL이면 원문 그대로 반환한다', () => {
    expect(extractDomain('not-a-url')).toBe('not-a-url')
  })

  it('네이버 블로그는 블로거 ID 단위로 추출한다', () => {
    expect(extractDomain('https://blog.naver.com/user123/222000')).toBe('blog.naver.com/user123')
  })

  it('네이버 모바일 블로그는 데스크탑 도메인으로 정규화한다', () => {
    expect(extractDomain('https://m.blog.naver.com/user123/222000')).toBe('blog.naver.com/user123')
  })

  it('네이버 PostView 레거시 URL은 blogId 쿼리에서 추출한다', () => {
    expect(extractDomain('https://blog.naver.com/PostView.naver?blogId=user123&logNo=1')).toBe('blog.naver.com/user123')
  })

  it('브런치는 @작가 단위로 추출한다', () => {
    expect(extractDomain('https://brunch.co.kr/@writer/42')).toBe('brunch.co.kr/@writer')
  })

  it('벨로그는 @사용자 단위로 추출한다', () => {
    expect(extractDomain('https://velog.io/@user/post-slug')).toBe('velog.io/@user')
  })

  it('블로그 홈(경로 없음)은 호스트만 반환한다', () => {
    expect(extractDomain('https://blog.naver.com/')).toBe('blog.naver.com')
  })
})

describe('extractKeywords', () => {
  it('공백으로 분리된 단어를 반환한다', () => {
    const kws = extractKeywords('협찬 받은 제품 리뷰')
    expect(kws).toContain('협찬')
    expect(kws).toContain('리뷰')
  })

  it('2글자 미만 단어는 제외한다', () => {
    const kws = extractKeywords('이 제품 좋아요')
    expect(kws).not.toContain('이')
  })

  it('괄호·특수문자는 구분자로 처리한다', () => {
    const kws = extractKeywords('[협찬]최신 게임 리뷰(2026)')
    expect(kws).toContain('협찬')
    expect(kws).toContain('리뷰')
  })

  it('title이 null이면 빈 배열을 반환한다', () => {
    expect(extractKeywords(null)).toEqual([])
  })
})

describe('scoreResult', () => {
  const baseFilters = { domains: {}, keywords: {}, threshold: 3 }

  it('아무 규칙도 없으면 점수 0, filtered false', () => {
    const result = scoreResult({ title: '일반 기사 제목', url: 'https://news.com/1' }, baseFilters)
    expect(result.score).toBe(0)
    expect(result.filtered).toBe(false)
  })

  it('차단된 도메인이면 +100, filtered true', () => {
    const filters = { ...baseFilters, domains: { 'spam.com': { count: 5, blocked: true, manual: false } } }
    const result = scoreResult({ title: '제목', url: 'https://spam.com/post' }, filters)
    expect(result.score).toBe(100)
    expect(result.filtered).toBe(true)
    expect(result.reasons).toContain('차단된 도메인: spam.com')
  })

  it('차단된 키워드가 제목에 있으면 +40', () => {
    const filters = { ...baseFilters, keywords: { '협찬': { count: 3, blocked: true, manual: false } } }
    const result = scoreResult({ title: '협찬 제품 사용 후기', url: 'https://normal.com/1' }, filters)
    expect(result.score).toBe(40)
    expect(result.filtered).toBe(false)
    expect(result.reasons).toContain('차단된 키워드: 협찬')
  })

  it('차단된 키워드 2개면 +80, filtered true', () => {
    const filters = {
      ...baseFilters,
      keywords: {
        '협찬': { count: 3, blocked: true, manual: false },
        '리뷰노트': { count: 3, blocked: true, manual: false },
      }
    }
    const result = scoreResult({ title: '협찬 리뷰노트 게시글', url: 'https://normal.com/1' }, filters)
    expect(result.score).toBe(80)
    expect(result.filtered).toBe(true)
  })

  it('학습 중인 키워드(blocked:false)가 있으면 +10', () => {
    const filters = { ...baseFilters, keywords: { '협찬': { count: 1, blocked: false, manual: false } } }
    const result = scoreResult({ title: '협찬 제품 후기', url: 'https://normal.com/1' }, filters)
    expect(result.score).toBe(10)
  })

  it('점수 60 이상이면 filtered true', () => {
    const filters = {
      ...baseFilters,
      keywords: {
        '협찬': { count: 3, blocked: true, manual: false },
        '리뷰': { count: 3, blocked: true, manual: false },
      }
    }
    const result = scoreResult({ title: '협찬 리뷰 후기', url: 'https://normal.com/1' }, filters)
    expect(result.filtered).toBe(true)
  })
})
