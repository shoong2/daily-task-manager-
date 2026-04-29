import { useState } from 'react'
import { today, getWeekDates, isToday } from '../utils/dateUtils'
import DayPanel from '../components/DayPanel'

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

export default function WeekView({ allTasks, routines, ensureDate, toggleTask, addTask, removeTask, addRoutine, addRoutineToToday }) {
  const [selectedDate, setSelectedDate] = useState(today())
  const weekDates = getWeekDates(today())

  function completionRate(dateKey) {
    const tasks = allTasks[dateKey] ?? []
    const routineTasks = tasks.filter(t => t.type === 'routine')
    if (routineTasks.length === 0) return null
    const done = routineTasks.filter(t => t.done).length
    return Math.round((done / routineTasks.length) * 100)
  }

  return (
    <div className="flex flex-1">
      <div className="w-52 border-r border-gray-100 p-4">
        <p className="text-xs text-gray-400 mb-3">
          {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
        </p>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-300 mb-2">
          {DAY_LABELS.map(d => <span key={d}>{d}</span>)}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDates.map((dateKey) => {
            const [, , day] = dateKey.split('-')
            const selected = dateKey === selectedDate
            const todayDate = isToday(dateKey)
            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                className={`py-1.5 text-sm rounded-md font-medium transition-colors ${
                  selected
                    ? 'bg-gray-900 text-white'
                    : todayDate
                    ? 'ring-1 ring-gray-400 text-gray-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {Number(day)}
              </button>
            )
          })}
        </div>

        <div className="mt-4">
          <p className="text-xs text-gray-400 mb-2">이번 주 완료율</p>
          <div className="flex gap-1">
            {weekDates.map(dateKey => {
              const rate = completionRate(dateKey)
              return (
                <div
                  key={dateKey}
                  className={`flex-1 h-1.5 rounded-full ${
                    rate === null ? 'bg-gray-100' : rate === 100 ? 'bg-gray-900' : rate > 0 ? 'bg-gray-400' : 'bg-gray-100'
                  }`}
                />
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {weekDates.filter(d => completionRate(d) === 100).length}/{weekDates.length} 완료
          </p>
        </div>
      </div>

      <DayPanel
        dateKey={selectedDate}
        allTasks={allTasks}
        routines={routines}
        ensureDate={ensureDate}
        toggleTask={toggleTask}
        addTask={addTask}
        removeTask={removeTask}
        addRoutine={addRoutine}
        addRoutineToToday={addRoutineToToday}
      />
    </div>
  )
}
