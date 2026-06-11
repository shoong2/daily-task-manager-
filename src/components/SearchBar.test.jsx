import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchBar from './SearchBar'

beforeEach(() => {
  vi.stubGlobal('open', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SearchBar', () => {
  it('검색 입력창과 버튼이 렌더된다', () => {
    render(<SearchBar />)
    expect(screen.getByPlaceholderText('검색...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '검색' })).toBeInTheDocument()
  })

  it('검색어 입력 후 Enter 키로 새 탭이 열린다', async () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('검색...')
    await userEvent.type(input, '리액트 튜토리얼{Enter}')
    expect(window.open).toHaveBeenCalledWith(
      '/search?q=%EB%A6%AC%EC%95%A1%ED%8A%B8%20%ED%8A%9C%ED%86%A0%EB%A6%AC%EC%96%BC',
      '_blank',
      'noopener,noreferrer'
    )
  })

  it('검색 버튼 클릭으로 새 탭이 열린다', async () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('검색...')
    await userEvent.type(input, '게임 뉴스')
    await userEvent.click(screen.getByRole('button', { name: '검색' }))
    expect(window.open).toHaveBeenCalledWith(
      '/search?q=%EA%B2%8C%EC%9E%84%20%EB%89%B4%EC%8A%A4',
      '_blank',
      'noopener,noreferrer'
    )
  })

  it('빈 검색어로는 새 탭이 열리지 않는다', async () => {
    render(<SearchBar />)
    await userEvent.click(screen.getByRole('button', { name: '검색' }))
    expect(window.open).not.toHaveBeenCalled()
  })

  it('공백만 있는 검색어로는 새 탭이 열리지 않는다', async () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('검색...')
    await userEvent.type(input, '   {Enter}')
    expect(window.open).not.toHaveBeenCalled()
  })
})
