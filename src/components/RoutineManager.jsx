import { useState } from 'react'

export default function RoutineManager({ routines, onAdd, onRemove, onClose }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg text-gray-900">루틴 관리</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <ul className="mb-5 space-y-2">
          {routines.length === 0 && (
            <li className="text-gray-300 text-sm text-center py-4">루틴이 없습니다</li>
          )}
          {routines.map(r => (
            <li key={r.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-base text-gray-800">{r.name}</span>
              <button
                onClick={() => onRemove(r.id)}
                className="text-gray-300 hover:text-red-400 text-lg leading-none transition-colors"
                aria-label={`${r.name} 삭제`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="새 루틴 이름..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-gray-500"
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-30"
          >
            추가
          </button>
        </form>
      </div>
    </div>
  )
}
