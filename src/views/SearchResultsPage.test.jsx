import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SearchResultsPage from './SearchResultsPage'

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('open', vi.fn())
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderWithQuery(q) {
  return render(
    <MemoryRouter initialEntries={[`/search?q=${encodeURIComponent(q)}`]}>
      <Routes>
        <Route path="/search" element={<SearchResultsPage />} />
      </Routes>
    </MemoryRouter>
  )
}

const mockResponse = {
  google: {
    results: [
      { title: '리액트 공식 문서', url: 'https://react.dev', snippet: '리액트 공식 사이트' },
    ],
    error: null,
  },
  naver: {
    results: [
      { title: '네이버 리액트 블로그', url: 'https://d2.naver.com/1', snippet: '네이버 기술 블로그' },
    ],
    error: null,
  },
}

it('로딩 상태를 표시한다', () => {
  fetch.mockReturnValue(new Promise(() => {}))
  renderWithQuery('리액트')
  expect(screen.getByText('검색 중...')).toBeInTheDocument()
})

it('Google과 Naver 결과를 각각 표시한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => mockResponse })
  renderWithQuery('리액트')
  await waitFor(() => {
    expect(screen.getByText('리액트 공식 문서')).toBeInTheDocument()
    expect(screen.getByText('네이버 리액트 블로그')).toBeInTheDocument()
  })
})

it('Google 열과 Naver 열 헤더가 표시된다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => mockResponse })
  renderWithQuery('리액트')
  await waitFor(() => {
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.getByText('Naver')).toBeInTheDocument()
  })
})

it('각 결과에 광고/정상 버튼이 있다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => mockResponse })
  renderWithQuery('리액트')
  await waitFor(() => {
    expect(screen.getAllByRole('button', { name: '광고' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: '정상' })).toHaveLength(2)
  })
})

it('광고 버튼 클릭 시 해당 결과가 숨겨진다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => mockResponse })
  renderWithQuery('리액트')
  await waitFor(() => screen.getByText('리액트 공식 문서'))
  await userEvent.click(screen.getAllByRole('button', { name: '광고' })[0])
  expect(screen.queryByText('리액트 공식 문서')).not.toBeInTheDocument()
})

it('fetch 실패 시 에러 메시지를 표시한다', async () => {
  fetch.mockRejectedValue(new Error('network error'))
  renderWithQuery('리액트')
  await waitFor(() => {
    expect(screen.getByText('검색 결과를 불러오지 못했어요')).toBeInTheDocument()
  })
})

it('HTTP 500 응답 시 에러 메시지를 표시한다', async () => {
  fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
  renderWithQuery('리액트')
  await waitFor(() => {
    expect(screen.getByText('검색 결과를 불러오지 못했어요')).toBeInTheDocument()
  })
})

it('필터에 걸린 결과는 숨겨진 결과 섹션에 표시된다', async () => {
  localStorage.setItem('search-filters', JSON.stringify({
    domains: { 'spam.com': { count: 5, blocked: true, manual: true } },
    keywords: {},
    threshold: 3,
  }))
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      google: { results: [{ title: '스팸 사이트 글', url: 'https://spam.com/1', snippet: '설명' }], error: null },
      naver: { results: [], error: null },
    }),
  })
  renderWithQuery('테스트')
  await waitFor(() => {
    expect(screen.getByText(/숨겨진 결과/)).toBeInTheDocument()
  })
})
