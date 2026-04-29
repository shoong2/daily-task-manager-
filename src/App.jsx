import { useState } from 'react'
import Sidebar from './components/Sidebar'
import RoutineManager from './components/RoutineManager'
import SomedayPanel from './components/SomedayPanel'
import TodayView from './views/TodayView'
import WeekView from './views/WeekView'
import CalendarView from './views/CalendarView'
import StreakWidget from './widgets/StreakWidget'
import WeatherWidget from './widgets/WeatherWidget'
import NewsWidget from './widgets/NewsWidget'
import BookmarksWidget from './widgets/BookmarksWidget'
import { useRoutines } from './hooks/useRoutines'
import { useTasks } from './hooks/useTasks'
import { useSomedayTasks } from './hooks/useSomedayTasks'
import { useBookmarks } from './hooks/useBookmarks'

export default function App() {
  const [currentView, setCurrentView] = useState('today')
  const [showRoutineManager, setShowRoutineManager] = useState(false)

  const { routines, addRoutine, removeRoutine } = useRoutines()
  const { allTasks, ensureDate, toggleTask, addTask, removeTask, addRoutineToToday } = useTasks(routines)
  const { tasks: somedayTasks, addTask: addSomedayTask, toggleTask: toggleSomedayTask, removeTask: removeSomedayTask } = useSomedayTasks()
  const { bookmarks, addBookmark, removeBookmark } = useBookmarks()

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
          <div className="flex-1 flex overflow-hidden min-w-0">
            {currentView === 'today' && <TodayView {...taskProps} />}
            {currentView === 'week' && <WeekView {...taskProps} />}
            {currentView === 'calendar' && <CalendarView {...taskProps} />}
          </div>
          <SomedayPanel
            tasks={somedayTasks}
            onAdd={addSomedayTask}
            onToggle={toggleSomedayTask}
            onRemove={removeSomedayTask}
          />
        </div>

        <div className="grid grid-cols-[1fr_1fr_2fr] gap-5">
          <StreakWidget allTasks={allTasks} />
          <WeatherWidget />
          <NewsWidget />
        </div>

        <BookmarksWidget
          bookmarks={bookmarks}
          onAdd={addBookmark}
          onRemove={removeBookmark}
        />
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
