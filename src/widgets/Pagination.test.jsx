import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Pagination from './Pagination'

describe('Pagination', () => {
  it('totalPages가 1 이하면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<Pagination page={0} totalPages={1} onChange={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('현재 페이지와 전체 페이지를 표시한다', () => {
    render(<Pagination page={2} totalPages={5} onChange={() => {}} />)
    expect(screen.getByText('3 / 5')).toBeInTheDocument()
  })

  it('다음 버튼 클릭 시 onChange(page+1)을 호출한다', async () => {
    const onChange = vi.fn()
    render(<Pagination page={0} totalPages={3} onChange={onChange} />)
    await userEvent.click(screen.getByLabelText('다음 페이지'))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('이전 버튼 클릭 시 onChange(page-1)을 호출한다', async () => {
    const onChange = vi.fn()
    render(<Pagination page={2} totalPages={3} onChange={onChange} />)
    await userEvent.click(screen.getByLabelText('이전 페이지'))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('첫 페이지에서 이전 버튼은 disabled이다', () => {
    render(<Pagination page={0} totalPages={3} onChange={() => {}} />)
    expect(screen.getByLabelText('이전 페이지')).toBeDisabled()
  })

  it('마지막 페이지에서 다음 버튼은 disabled이다', () => {
    render(<Pagination page={2} totalPages={3} onChange={() => {}} />)
    expect(screen.getByLabelText('다음 페이지')).toBeDisabled()
  })
})
