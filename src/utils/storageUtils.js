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

export function getSomedayTasks() {
  try {
    return JSON.parse(localStorage.getItem('someday-tasks')) ?? []
  } catch {
    return []
  }
}

export function setSomedayTasks(tasks) {
  try {
    localStorage.setItem('someday-tasks', JSON.stringify(tasks))
  } catch {}
}

export function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem('bookmarks')) ?? []
  } catch {
    return []
  }
}

export function setBookmarks(bookmarks) {
  try {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks))
  } catch {}
}
