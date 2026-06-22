import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JobsWidget from './JobsWidget'

const allSample = {
  items: [
    { id: 'a1', title: '백엔드 개발자', organization: '회사A', employmentType: '정규직', region: '용인시', deadline: '2026-07-01', url: 'https://a/1' },
    { id: 'a2', title: '프론트엔드 개발자', organization: '회사B', employmentType: '계약직', region: '수원시', deadline: '2026-07-05', url: 'https://a/2' },
  ],
  error: null,
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

it('초기 마운트 시 /api/jobs를 호출한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => allSample })
  render(<JobsWidget />)
  await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/jobs'))
})

it('전체 탭이 기본으로 활성화된다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => allSample })
  render(<JobsWidget />)
  await waitFor(() => screen.getByText('백엔드 개발자'))
  const tab = screen.getByRole('button', { name: '전체' })
  expect(tab).toHaveAttribute('aria-selected', 'true')
})

it('항목은 회사·지역·고용형태·마감일을 표시한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => allSample })
  render(<JobsWidget />)
  await waitFor(() => expect(screen.getByText(/회사A.*용인시.*정규직.*2026-07-01/)).toBeInTheDocument())
})

it('에러 응답 시 메시지를 표시한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ items: [], error: '서버 오류' }) })
  render(<JobsWidget />)
  await waitFor(() => expect(screen.getByText(/불러올 수 없습니다/)).toBeInTheDocument())
})

it('빈 결과면 안내 메시지를 표시한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ items: [], error: null }) })
  render(<JobsWidget />)
  await waitFor(() => expect(screen.getByText('공고가 없습니다')).toBeInTheDocument())
})

const keywordSampleA = {
  items: [
    { id: 'r1', title: 'React 백엔드', organization: 'A', employmentType: '정규직', region: '수원시', deadline: '2026-07-01', url: 'https://x/r1' },
  ],
  error: null,
}
const keywordSampleB = {
  items: [
    { id: 'u1', title: 'Unity 클라이언트', organization: 'B', employmentType: '정규직', region: '성남시', deadline: '2026-07-05', url: 'https://x/u1' },
    { id: 'r1', title: 'React 백엔드', organization: 'A', employmentType: '정규직', region: '수원시', deadline: '2026-07-01', url: 'https://x/r1' },
  ],
  error: null,
}

it('키워드 탭 클릭만으로는 fetch 안 함 (키워드 0개)', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => allSample })
  render(<JobsWidget />)
  await waitFor(() => screen.getByText('백엔드 개발자'))
  fetch.mockClear()
  await userEvent.click(screen.getByRole('button', { name: '키워드 검색' }))
  expect(fetch).not.toHaveBeenCalled()
})

it('키워드 0개이면 안내 메시지를 표시한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => allSample })
  render(<JobsWidget />)
  await waitFor(() => screen.getByText('백엔드 개발자'))
  await userEvent.click(screen.getByRole('button', { name: '키워드 검색' }))
  expect(screen.getByText(/키워드를 추가/)).toBeInTheDocument()
})

it('키워드 추가 시 해당 키워드로 /api/jobs 호출', async () => {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => allSample })
  render(<JobsWidget />)
  await waitFor(() => screen.getByText('백엔드 개발자'))
  await userEvent.click(screen.getByRole('button', { name: '키워드 검색' }))
  fetch.mockResolvedValueOnce({ ok: true, json: async () => keywordSampleA })
  const input = screen.getByPlaceholderText('키워드 추가')
  await userEvent.type(input, 'React{Enter}')
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith('/api/jobs?keyword=React')
  })
})

it('여러 키워드 결과를 합쳐 URL 기준으로 dedupe한다', async () => {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => allSample })
  render(<JobsWidget />)
  await waitFor(() => screen.getByText('백엔드 개발자'))
  await userEvent.click(screen.getByRole('button', { name: '키워드 검색' }))

  fetch.mockResolvedValueOnce({ ok: true, json: async () => keywordSampleA })
  await userEvent.type(screen.getByPlaceholderText('키워드 추가'), 'React{Enter}')
  await waitFor(() => screen.getByText('React 백엔드'))

  fetch.mockResolvedValueOnce({ ok: true, json: async () => keywordSampleA })
  fetch.mockResolvedValueOnce({ ok: true, json: async () => keywordSampleB })
  await userEvent.type(screen.getByPlaceholderText('키워드 추가'), 'Unity{Enter}')
  await waitFor(() => screen.getByText('Unity 클라이언트'))
  expect(screen.getAllByText('React 백엔드')).toHaveLength(1)
})

it('키워드 칩 × 클릭 시 키워드를 제거한다', async () => {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => allSample })
  render(<JobsWidget />)
  await waitFor(() => screen.getByText('백엔드 개발자'))
  await userEvent.click(screen.getByRole('button', { name: '키워드 검색' }))
  fetch.mockResolvedValueOnce({ ok: true, json: async () => keywordSampleA })
  await userEvent.type(screen.getByPlaceholderText('키워드 추가'), 'React{Enter}')
  await waitFor(() => screen.getByText('React'))
  await userEvent.click(screen.getByLabelText('React 키워드 삭제'))
  expect(screen.queryByText('React 백엔드')).not.toBeInTheDocument()
})
