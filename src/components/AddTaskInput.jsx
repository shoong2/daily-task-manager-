import { useState } from 'react'

export default function AddTaskInput({ onAdd }) {
  const [value, setValue] = useState('')
  const [isRoutine, setIsRoutine] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed, isRoutine)
    setValue('')
    setIsRoutine(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2">
      <button
        type="button"
        onClick={() => setIsRoutine(r => !r)}
        className={`text-sm px-2 py-1 rounded transition-colors flex-shrink-0 ${
          isRoutine
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
        }`}
        title="루틴으로 설정"
      >
        {isRoutine ? '루틴 ✓' : '루틴'}
      </button>

      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="할 일 추가..."
        className="flex-1 text-base text-gray-700 placeholder-gray-300 border-b border-gray-200 focus:border-gray-500 outline-none py-1 bg-transparent"
      />

      <button
        type="submit"
        disabled={!value.trim()}
        className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xl leading-none"
      >
        +
      </button>
    </form>
  )
}
