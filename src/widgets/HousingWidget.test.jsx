import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HousingWidget from './HousingWidget'

const sample = {
  items: [
    { id: '1', title: '파주 영구임대 모집', type: '공공임대', deadline: '2026-07-06', status: '공고중', url: 'https://a/1' },
    { id: '2', title: '수원 매입임대 모집', type: '매입임대', deadline: '2026-07-10', status: '공고중', url: 'https://a/2' },
    { id: '3', title: '화성 행복주택 1', type: '행복주택', deadline: '2026-07-12', status: '공고중', url: 'https://a/3' },
    { id: '4', title: '화성 행복주택 2', type: '행복주택', deadline: '2026-07-15', status: '공고중', url: 'https://a/4' },
    { id: '5', title: '화성 행복주택 3', type: '행복주택', deadline: '2026-07-18', status: '공고중', url: 'https://a/5' },
    { id: '6', title: '화성 행복주택 4', type: '행복주택', deadline: '2026-07-20', status: '공고중', url: 'https://a/6' },
  ],
  error: null,
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

it('로딩 중이면 skeleton을 표시한다', () => {
  fetch.mockReturnValue(new Promise(() => {}))
  const { container } = render(<HousingWidget />)
  expect(container.querySelector('.animate-pulse')).toBeTruthy()
})

it('데이터를 받아 리스트를 그린다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => sample })
  render(<HousingWidget />)
  await waitFor(() => expect(screen.getByText('파주 영구임대 모집')).toBeInTheDocument())
})

it('각 항목은 type · 접수 ~deadline 부제목을 가진다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => sample })
  render(<HousingWidget />)
  await waitFor(() => expect(screen.getByText(/공공임대.*2026-07-06/)).toBeInTheDocument())
})

it('카테고리 칩 클릭 시 해당 type만 표시한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => sample })
  render(<HousingWidget />)
  await waitFor(() => screen.getByText('파주 영구임대 모집'))
  await userEvent.click(screen.getByRole('button', { name: '매입임대' }))
  expect(screen.queryByText('파주 영구임대 모집')).not.toBeInTheDocument()
  expect(screen.getByText('수원 매입임대 모집')).toBeInTheDocument()
})

it('카테고리 변경 시 page가 0으로 리셋된다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => sample })
  render(<HousingWidget />)
  await waitFor(() => screen.getByText('파주 영구임대 모집'))
  await userEvent.click(screen.getByLabelText('다음 페이지'))
  expect(screen.getByText('2 / 2')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: '행복주택' }))
  expect(screen.queryByText('2 / 2')).not.toBeInTheDocument()
})

it('5건 초과면 페이지네이션이 보인다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => sample })
  render(<HousingWidget />)
  await waitFor(() => expect(screen.getByText('1 / 2')).toBeInTheDocument())
})

it('에러 발생 시 메시지를 표시한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ items: [], error: '서버 오류' }) })
  render(<HousingWidget />)
  await waitFor(() => expect(screen.getByText(/불러올 수 없습니다/)).toBeInTheDocument())
})

it('빈 결과면 안내 메시지를 표시한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ items: [], error: null }) })
  render(<HousingWidget />)
  await waitFor(() => expect(screen.getByText('공고가 없습니다')).toBeInTheDocument())
})
