type InvalidateListener = () => void

const listeners = new Set<InvalidateListener>()
let debounceTimer: ReturnType<typeof setTimeout> | null = null

/** Subscribe to server-driven call lifecycle events (SignalR) that should refresh REST history. */
export function subscribeCallHistoryInvalidate(listener: InvalidateListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function flushInvalidate() {
  debounceTimer = null
  listeners.forEach((fn) => {
    try {
      fn()
    } catch {
      // ignore listener errors
    }
  })
}

/** Coalesce bursts (e.g. accept + joined + signaling) into a single refetch. */
export function invalidateCallHistory() {
  if (debounceTimer) window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(flushInvalidate, 200)
}
