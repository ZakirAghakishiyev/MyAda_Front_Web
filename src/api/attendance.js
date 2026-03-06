/**
 * Attendance API – teacher-side QR attendance.
 * STATIC MODE: no backend calls; all data is local. Replace with real API when backend is ready.
 */

/** Default session state (static). */
export function getStaticSessionState() {
  return {
    valid: true,
    closed: false,
    canActivate: true,
    currentRound: 0,
    round1Completed: false,
    round2Completed: false,
    registeredCount: 0,
    totalCount: 45,
    sessionId: 'static-session',
    attendanceSessionId: 'static-attendance',
  }
}

/**
 * Get current session state. Static: returns local state without fetching.
 */
export async function getSessionState() {
  return Promise.resolve(getStaticSessionState())
}

/**
 * Start an attendance round. Static: no request, resolves immediately.
 */
export async function startRound() {
  return new Promise((resolve) => setTimeout(resolve, 200))
}

/**
 * End the current round. Static: no request, resolves immediately.
 */
export async function endRound() {
  return new Promise((resolve) => setTimeout(resolve, 200))
}

/**
 * Get a new QR payload for the active round. Static: returns a mock token (no request).
 */
export async function getQRPayload() {
  const token = `ADA_${Math.random().toString(36).slice(2, 6)}`
  return new Promise((resolve) =>
    setTimeout(() => resolve({ payload: token, token }), 150)
  )
}
