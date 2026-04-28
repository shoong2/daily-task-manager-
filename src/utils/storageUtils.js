export function getRoutines() {
  try {
    return JSON.parse(localStorage.getItem('routines')) ?? []
  } catch {
    return []
  }
}

export function setRoutines(routines) {
  try {
    localStorage.setItem('routines', JSON.stringify(routines))
  } catch {
    // QuotaExceededError — storage full, ignore silently
  }
}

export function getAllTasks() {
  try {
    return JSON.parse(localStorage.getItem('tasks')) ?? {}
  } catch {
    return {}
  }
}

export function setAllTasks(tasks) {
  try {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  } catch {
    // QuotaExceededError — storage full, ignore silently
  }
}
