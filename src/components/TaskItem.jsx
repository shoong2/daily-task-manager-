export default function TaskItem({ task, onToggle, onRemove }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 group">
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
          task.done
            ? 'bg-gray-900 border-gray-900'
            : 'border-gray-300 hover:border-gray-500'
        }`}
      >
        {task.done && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <span className={`flex-1 text-base ${task.done ? 'line-through text-gray-300' : 'text-gray-800'}`}>
        {task.name}
      </span>

      {task.type === 'routine' && (
        <span className="text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
          루틴
        </span>
      )}

      <button
        onClick={onRemove}
        className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
        aria-label="삭제"
      >
        ×
      </button>
    </div>
  )
}
