const KEY = 'scheduling_instructor_user_id'

export function getSchedulingUserId() {
  try {
    const v = sessionStorage.getItem(KEY)
    return v === null || v === '' ? '' : v
  } catch {
    return ''
  }
}

export function setSchedulingUserId(value) {
  try {
    if (value === '' || value == null) {
      sessionStorage.removeItem(KEY)
    } else {
      sessionStorage.setItem(KEY, String(value))
    }
  } catch {
    /* ignore */
  }
}
