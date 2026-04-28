export function getRoutines() {
  try {
    return JSON.parse(localStorage.getItem('routines')) ?? []
  } catch {
    return []
  }
}

export function setRoutines(routines) {
  localStorage.setItem('routines', JSON.stringify(routines))
}

export function getAllTasks() {
  try {
    return JSON.parse(localStorage.getItem('tasks')) ?? {}
  } catch {
    return {}
  }
}

export function setAllTasks(tasks) {
  localStorage.setItem('tasks', JSON.stringify(tasks))
}
