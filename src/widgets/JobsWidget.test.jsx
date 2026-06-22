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
