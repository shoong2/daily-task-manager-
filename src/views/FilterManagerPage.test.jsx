import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import FilterManagerPage from './FilterManagerPage'

beforeEach(() => localStorage.clear())

function renderPage() {
  return render(
    <MemoryRouter>
      <FilterManagerPage />
    </MemoryRouter>
  )
}

it('필터 관리 제목이 표시된다', () => {
  renderPage()
  expect(screen.getByText('필터 관리')).toBeInTheDocument()
})

it('차단된 도메인 섹션이 표시된다', () => {
  renderPage()
  expect(screen.getByText('차단된 도메인')).toBeInTheDocument()
})

it('차단된 키워드 섹션에 기본 키워드가 표시된다', () => {
  renderPage()
  expect(screen.getByText('협찬')).toBeInTheDocument()
})

it('도메인 직접 추가가 동작한다', async () => {
  renderPage()
  const input = screen.getAllByPlaceholderText('직접 추가...')[0]
  await userEvent.type(input, 'badsite.com{Enter}')
  expect(screen.getByText('badsite.com')).toBeInTheDocument()
})

it('키워드 직접 추가가 동작한다', async () => {
  renderPage()
  const inputs = screen.getAllByPlaceholderText('직접 추가...')
  await userEvent.type(inputs[1], '광고글{Enter}')
  expect(screen.getByText('광고글')).toBeInTheDocument()
})

it('도메인 삭제 버튼이 동작한다', async () => {
  renderPage()
  const input = screen.getAllByPlaceholderText('직접 추가...')[0]
  await userEvent.type(input, 'deleteme.com{Enter}')
  expect(screen.getByText('deleteme.com')).toBeInTheDocument()
  const deleteButtons = screen.getAllByRole('button', { name: '삭제' })
  await userEvent.click(deleteButtons[0])
  expect(screen.queryByText('deleteme.com')).not.toBeInTheDocument()
})

it('임계값 변경이 반영된다', async () => {
  renderPage()
  const thresholdInput = screen.getByDisplayValue('3')
  await userEvent.clear(thresholdInput)
  await userEvent.type(thresholdInput, '5')
  expect(thresholdInput.value).toBe('5')
})
