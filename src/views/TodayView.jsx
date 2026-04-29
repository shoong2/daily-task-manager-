import { today } from '../utils/dateUtils'
import DayPanel from '../components/DayPanel'

export default function TodayView({ allTasks, routines, ensureDate, toggleTask, addTask, removeTask, addRoutine, addRoutineToToday }) {
  return (
    <DayPanel
      dateKey={today()}
      allTasks={allTasks}
      routines={routines}
      ensureDate={ensureDate}
      toggleTask={toggleTask}
      addTask={addTask}
      removeTask={removeTask}
      addRoutine={addRoutine}
      addRoutineToToday={addRoutineToToday}
    />
  )
}
