const VIEWS = [
  { id: 'today', label: '오늘' },
  { id: 'week', label: '주간' },
  { id: 'calendar', label: '달력' },
]

export default function Sidebar({ currentView, onViewChange, onRoutineManager }) {
  return (
    <aside className="w-28 bg-gray-50 border-r border-gray-200 flex flex-col gap-1 p-4 min-h-screen">
      <span className="font-black text-lg text-gray-900 mb-5 px-1">Daily</span>

      {VIEWS.map(v => (
        <button
          key={v.id}
          onClick={() => onViewChange(v.id)}
          className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentView === v.id
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          {v.label}
        </button>
      ))}

      <div className="flex-1" />

      <button
        onClick={onRoutineManager}
        className="text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-gray-200 transition-colors"
      >
        루틴 관리
      </button>
    </aside>
  )
}
