import { useState } from 'react'
import Sidebar from './components/Sidebar'
import RoutineManager from './components/RoutineManager'
import TodayView from './views/TodayView'
import WeekView from './views/WeekView'
import CalendarView from './views/CalendarView'
import StreakWidget from './widgets/StreakWidget'
import WeatherWidget from './widgets/WeatherWidget'
import NewsWidget from './widgets/NewsWidget'
import { useRoutines } from './hooks/useRoutines'
import { useTasks } from './hooks/useTasks'

export default function App() {
  const [currentView, setCurrentView] = useState('today')
  const [showRoutineManager, setShowRoutineManager] = useState(false)

  const { routines, addRoutine, removeRoutine } = useRoutines()
  const { allTasks, ensureDate, toggleTask, addTask, removeTask, addRoutineToToday } = useTasks(routines)

  const taskProps = { allTasks, routines, ensureDate, toggleTask, addTask, removeTask, addRoutine, addRoutineToToday }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onRoutineManager={() => setShowRoutineManager(true)}
      />

      <div className="flex-1 flex flex-col p-6 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 flex overflow-hidden">
          {currentView === 'today' && <TodayView {...taskProps} />}
          {currentView === 'week' && <WeekView {...taskProps} />}
          {currentView === 'calendar' && <CalendarView {...taskProps} />}
        </div>

        <div className="grid grid-cols-[1fr_1fr_2fr] gap-5">
          <StreakWidget allTasks={allTasks} />
          <WeatherWidget />
          <NewsWidget />
        </div>
      </div>

      {showRoutineManager && (
        <RoutineManager
          routines={routines}
          onAdd={(name) => {
            const routine = addRoutine(name)
            addRoutineToToday(routine)
          }}
          onRemove={removeRoutine}
          onClose={() => setShowRoutineManager(false)}
        />
      )}
    </div>
  )
}
