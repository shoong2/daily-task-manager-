import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import handler from './housing'

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
  process.env.DATA_GO_KR_KEY = 'test-key'
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.DATA_GO_KR_KEY
})

const sampleResponse = [{
  dsSch: [{ PG_SZ: '50', PAGE: '1', CNP_CD: '41' }],
  dsList: [
    {
      PAN_ID: '111',
      PAN_NM: '파주운정3 영구임대주택 모집',
      AIS_TP_CD_NM: '영구임대',
      UPP_AIS_TP_NM: '임대주택',
      CLSG_DT: '2026.07.06',
      PAN_SS: '공고중',
      DTL_URL: 'https://example.com/111',
    },
    {
      PAN_ID: '222',
      PAN_NM: '화성동탄2 토지 공급',
      AIS_TP_CD_NM: '토지',
      UPP_AIS_TP_NM: '토지',
      CLSG_DT: '2026.07.07',
      PAN_SS: '공고중',
      DTL_URL: 'https://example.com/222',
    },
    {
      PAN_ID: '333',
      PAN_NM: '수원 매입임대 모집',
      AIS_TP_CD_NM: '매입임대',
      UPP_AIS_TP_NM: '임대주택',
      CLSG_DT: '2026.07.10',
      PAN_SS: '공고중',
      DTL_URL: 'https://example.com/333',
    },
  ],
  resHeader: [{ RS_DTTM: '20260622073125', SS_CODE: 'Y' }],
}]

it('임대주택이 아닌 항목은 필터링한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => sampleResponse })
  const res = mockRes()
  await handler({ query: {} }, res)
  expect(res.body.items).toHaveLength(2)
  expect(res.body.items.find(i => i.id === '222')).toBeUndefined()
})

it('영구임대를 공공임대 type으로 매핑한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => sampleResponse })
  const res = mockRes()
  await handler({ query: {} }, res)
  const item = res.body.items.find(i => i.id === '111')
  expect(item.type).toBe('공공임대')
  expect(item.title).toBe('파주운정3 영구임대주택 모집')
  expect(item.deadline).toBe('2026-07-06')
  expect(item.url).toBe('https://example.com/111')
})

it('매입임대를 매입임대 type으로 매핑한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => sampleResponse })
  const res = mockRes()
  await handler({ query: {} }, res)
  expect(res.body.items.find(i => i.id === '333').type).toBe('매입임대')
})

it('키 미설정 시 명확한 에러 반환', async () => {
  delete process.env.DATA_GO_KR_KEY
  const res = mockRes()
  await handler({ query: {} }, res)
  expect(res.body.error).toBe('API key missing')
  expect(res.body.items).toEqual([])
})

it('SS_CODE !== Y면 에러로 처리한다', async () => {
  const bad = [{ ...sampleResponse[0], resHeader: [{ SS_CODE: 'N' }] }]
  fetch.mockResolvedValue({ ok: true, json: async () => bad })
  const res = mockRes()
  await handler({ query: {} }, res)
  expect(res.body.error).toContain('SS_CODE')
  expect(res.body.items).toEqual([])
})

it('fetch 실패 시 에러 반환', async () => {
  fetch.mockRejectedValue(new Error('network'))
  const res = mockRes()
  await handler({ query: {} }, res)
  expect(res.body.error).toBeTruthy()
  expect(res.body.items).toEqual([])
})

it('CNP_CD=41 파라미터로 호출한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => sampleResponse })
  const res = mockRes()
  await handler({ query: {} }, res)
  const url = fetch.mock.calls[0][0]
  expect(url).toContain('CNP_CD=41')
  expect(url).toContain('serviceKey=test-key')
})
