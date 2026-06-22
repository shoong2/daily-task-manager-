import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import handler from './jobs'

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) { this.statusCode = code; return this },
    json(data) { this.body = data; return this },
    setHeader(key, value) { this.headers[key] = value },
  }
  return res
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  process.env.GG_DATA_KEY = 'test-key'
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.GG_DATA_KEY
})

const sampleRow = (override = {}) => ({
  ENTRPRS_NM: '회사A',
  PBANC_CONT: '백엔드 개발자 모집',
  PBANC_FORM_DIV: '정규직',
  WORK_REGION_CONT: '용인시',
  RECRUT_FIELD_NM: 'IT개발',
  RCPT_END_DE: '20260630',
  URL: 'https://jobaba.example/1',
  ...override,
})

const wrapResponse = (rows) => ({
  GGJOBABARECRUSTM: [
    { head: [{ list_total_count: rows.length }, { RESULT: { CODE: 'INFO-000', MESSAGE: 'OK' } }] },
    { row: rows },
  ],
})

it('User-Agent 헤더를 포함해 호출한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => wrapResponse([sampleRow()]) })
  const res = mockRes()
  await handler({ query: {} }, res)
  const opts = fetch.mock.calls[0][1]
  expect(opts.headers['User-Agent']).toMatch(/Mozilla/)
})

it('필드를 정규화해서 반환한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => wrapResponse([sampleRow()]) })
  const res = mockRes()
  await handler({ query: {} }, res)
  const item = res.body.items[0]
  expect(item.title).toBe('백엔드 개발자 모집')
  expect(item.organization).toBe('회사A')
  expect(item.employmentType).toBe('정규직')
  expect(item.region).toBe('용인시')
  expect(item.deadline).toBe('2026-06-30')
  expect(item.url).toBe('https://jobaba.example/1')
})

it('키워드 없을 때 pSize=30로 호출한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => wrapResponse([sampleRow()]) })
  const res = mockRes()
  await handler({ query: {} }, res)
  expect(fetch.mock.calls[0][0]).toContain('pSize=30')
})

it('키워드 있을 때 pSize=200로 호출한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => wrapResponse([sampleRow()]) })
  const res = mockRes()
  await handler({ query: { keyword: 'React' } }, res)
  expect(fetch.mock.calls[0][0]).toContain('pSize=200')
})

it('키워드 매칭은 PBANC_CONT를 검사한다', async () => {
  const rows = [
    sampleRow({ URL: 'a', PBANC_CONT: 'React 개발자' }),
    sampleRow({ URL: 'b', PBANC_CONT: '회계 담당자', RECRUT_FIELD_NM: '회계' }),
  ]
  fetch.mockResolvedValue({ ok: true, json: async () => wrapResponse(rows) })
  const res = mockRes()
  await handler({ query: { keyword: 'React' } }, res)
  expect(res.body.items).toHaveLength(1)
  expect(res.body.items[0].url).toBe('a')
})

it('키워드 매칭은 ENTRPRS_NM도 검사한다', async () => {
  const rows = [
    sampleRow({ URL: 'a', ENTRPRS_NM: 'Unity Korea', PBANC_CONT: '직원 모집' }),
    sampleRow({ URL: 'b', ENTRPRS_NM: '한국에듀', PBANC_CONT: '직원 모집' }),
  ]
  fetch.mockResolvedValue({ ok: true, json: async () => wrapResponse(rows) })
  const res = mockRes()
  await handler({ query: { keyword: 'Unity' } }, res)
  expect(res.body.items).toHaveLength(1)
  expect(res.body.items[0].url).toBe('a')
})

it('키워드 매칭은 RECRUT_FIELD_NM도 검사한다', async () => {
  const rows = [
    sampleRow({ URL: 'a', RECRUT_FIELD_NM: 'IT개발' }),
    sampleRow({ URL: 'b', RECRUT_FIELD_NM: '판매' }),
  ]
  fetch.mockResolvedValue({ ok: true, json: async () => wrapResponse(rows) })
  const res = mockRes()
  await handler({ query: { keyword: 'IT' } }, res)
  expect(res.body.items.map(i => i.url)).toEqual(['a'])
})

it('키워드 매칭은 대소문자를 무시한다', async () => {
  const rows = [sampleRow({ URL: 'a', PBANC_CONT: 'react developer' })]
  fetch.mockResolvedValue({ ok: true, json: async () => wrapResponse(rows) })
  const res = mockRes()
  await handler({ query: { keyword: 'React' } }, res)
  expect(res.body.items).toHaveLength(1)
})

it('매칭 결과는 최대 30건', async () => {
  const rows = Array.from({ length: 50 }, (_, i) => sampleRow({ URL: `u${i}`, PBANC_CONT: 'React 매칭' }))
  fetch.mockResolvedValue({ ok: true, json: async () => wrapResponse(rows) })
  const res = mockRes()
  await handler({ query: { keyword: 'React' } }, res)
  expect(res.body.items).toHaveLength(30)
})

it('키 미설정 시 명확한 에러 반환', async () => {
  delete process.env.GG_DATA_KEY
  const res = mockRes()
  await handler({ query: {} }, res)
  expect(res.body.error).toBe('API key missing')
  expect(res.body.items).toEqual([])
})

it('RESULT.CODE !== INFO-000 이면 에러로 처리한다', async () => {
  const bad = {
    GGJOBABARECRUSTM: [
      { head: [{ list_total_count: 0 }, { RESULT: { CODE: 'ERROR-300', MESSAGE: '인증오류' } }] },
    ],
  }
  fetch.mockResolvedValue({ ok: true, json: async () => bad })
  const res = mockRes()
  await handler({ query: {} }, res)
  expect(res.body.error).toContain('ERROR-300')
  expect(res.body.items).toEqual([])
})

it('fetch 실패 시 에러 반환', async () => {
  fetch.mockRejectedValue(new Error('network'))
  const res = mockRes()
  await handler({ query: {} }, res)
  expect(res.body.error).toBeTruthy()
  expect(res.body.items).toEqual([])
})
