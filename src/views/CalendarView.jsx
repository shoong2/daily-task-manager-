import { useState } from 'react'
import { today, getMonthGrid, isToday } from '../utils/dateUtils'
import DayPanel from '../components/DayPanel'

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

export default function CalendarView({ allTasks, routines, ensureDate, toggleTask, addTask, removeTask, addRoutine, addRoutineToToday }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(today())

  const grid = getMonthGrid(year, month)
  const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function hasAnyDone(dateKey) {
    return (allTasks[dateKey] ?? []).some(t => t.done)
  }

  return (
    <div className="flex flex-1">
      <div className="w-72 border-r border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="text-gray-400 hover:text-gray-700 text-lg px-1">‹</button>
          <p className="text-sm font-semibold text-gray-700">
            {year}년 {month + 1}월
          </p>
          <button onClick={nextMonth} className="text-gray-400 hover:text-gray-700 text-lg px-1">›</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-300 mb-2">
          {DAY_LABELS.map(d => <span key={d}>{d}</span>)}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {grid.map(dateKey => {
            const [, , day] = dateKey.split('-')
            const inMonth = dateKey.startsWith(currentMonthPrefix)
            const selected = dateKey === selectedDate
            const todayDate = isToday(dateKey)
            const done = hasAnyDone(dateKey)

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                className={`py-1.5 text-sm rounded-md relative transition-colors ${
                  !inMonth ? 'text-gray-200' :
                  selected ? 'bg-gray-900 text-white' :
                  todayDate ? 'ring-1 ring-gray-400 text-gray-700' :
                  'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {Number(day)}
                {done && inMonth && !selected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gray-400" />
                )}
              </button>
            )
          })}
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
