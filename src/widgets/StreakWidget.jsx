import { useStreak } from '../hooks/useStreak'
import { today, toDateKey } from '../utils/dateUtils'

export default function StreakWidget({ allTasks }) {
  const todayKey = today()
  const streak = useStreak(allTasks, todayKey)

  const recentDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateKey = toDateKey(d)
    const tasks = allTasks[dateKey] ?? []
    const routineTasks = tasks.filter(t => t.type === 'routine')
    const done = routineTasks.length > 0 && routineTasks.some(t => t.done)
    return { dateKey, done }
  })

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">연속 달성 🔥</p>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-4xl font-black text-gray-900">{streak}</span>
        <span className="text-sm text-gray-500">일 연속</span>
      </div>
      <div className="flex gap-1.5">
        {recentDays.map(({ dateKey, done }) => (
          <div
            key={dateKey}
            className={`flex-1 h-5 rounded ${done ? 'bg-gray-900' : 'bg-gray-100'}`}
            title={dateKey}
          />
        ))}
      </div>
    </div>
  )
}
