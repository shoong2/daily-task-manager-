import { useState } from 'react'
import TaskItem from './TaskItem'

export default function SomedayPanel({ tasks, onAdd, onToggle, onRemove }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
  }

  return (
    <div className="w-72 border-l border-gray-100 p-5 flex flex-col">
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">언젠가 할 일</p>

      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 && (
          <p className="text-gray-300 text-sm mt-2">아직 없습니다.</p>
        )}
        {tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={() => onToggle(task.id)}
            onRemove={() => onRemove(task.id)}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-3 mt-2 border-t border-gray-100">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="언젠가 할 일 추가..."
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
    </div>
  )
}
