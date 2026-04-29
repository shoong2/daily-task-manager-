import { useEffect } from 'react'
import { formatDisplay } from '../utils/dateUtils'
import TaskItem from './TaskItem'
import AddTaskInput from './AddTaskInput'

export default function DayPanel({ dateKey, allTasks, routines, ensureDate, toggleTask, addTask, removeTask, addRoutine, addRoutineToToday }) {
  useEffect(() => {
    ensureDate(dateKey, routines)
  }, [dateKey, ensureDate, routines])

  const tasks = allTasks[dateKey] ?? []
  const routineTasks = tasks.filter(t => t.type === 'routine')
  const oneTimeTasks = tasks.filter(t => t.type === 'one-time')

  function handleAdd(name, isRoutine) {
    if (isRoutine) {
      const routine = addRoutine(name)
      addRoutineToToday(routine)
    } else {
      addTask(dateKey, name)
    }
  }

  return (
    <div className="flex-1 p-5">
      <div className="mb-5">
        <p className="font-bold text-lg text-gray-900">{formatDisplay(dateKey)}</p>
      </div>

      {routineTasks.length > 0 && (
        <section className="mb-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">루틴</p>
          {routineTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => toggleTask(dateKey, task.id)}
              onRemove={() => removeTask(dateKey, task.id)}
            />
          ))}
        </section>
      )}

      {oneTimeTasks.length > 0 && (
        <section className="mb-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">오늘만</p>
          {oneTimeTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => toggleTask(dateKey, task.id)}
              onRemove={() => removeTask(dateKey, task.id)}
            />
          ))}
        </section>
      )}

      {routineTasks.length === 0 && oneTimeTasks.length === 0 && (
        <p className="text-gray-300 text-sm mt-4">할 일이 없습니다.</p>
      )}

      <AddTaskInput onAdd={handleAdd} />
    </div>
  )
}
