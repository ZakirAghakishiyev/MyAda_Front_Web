/**
 * Shared static attendance data for CRN sessions and students.
 * Replace with API calls when backend is ready.
 */

const ATTENDANCE_STATUS_OVERRIDES_KEY = 'attendance_status_overrides'
const ATTENDED_STATUSES = new Set(['present', 'late'])

function readStatusOverrides() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(ATTENDANCE_STATUS_OVERRIDES_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStatusOverrides(overrides) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ATTENDANCE_STATUS_OVERRIDES_KEY, JSON.stringify(overrides))
}

function getOverrideKey(sessionId, studentId) {
  return `${sessionId}::${studentId}`
}

function getResolvedStatus(sessionId, studentId, fallbackStatus) {
  const overrides = readStatusOverrides()
  return overrides[getOverrideKey(sessionId, studentId)] || fallbackStatus
}

export function saveManualAttendanceStatus({ sessionId, studentId, status }) {
  const overrides = readStatusOverrides()
  overrides[getOverrideKey(sessionId, studentId)] = status
  writeStatusOverrides(overrides)
  return { sessionId, studentId, status, savedAt: new Date().toISOString() }
}
export const PAST_SESSIONS_BY_CRN = {
  '10101': [
    { id: 's1', date: '2024-03-01', startTime: '09:00', endTime: '10:30' },
    { id: 's2', date: '2024-02-28', startTime: '09:00', endTime: '10:30' },
    { id: 's3', date: '2024-02-26', startTime: '14:00', endTime: '15:30' },
    { id: 's4', date: '2024-02-23', startTime: '09:00', endTime: '10:30' },
  ],
  '10102': [
    { id: 's5', date: '2024-03-02', startTime: '11:00', endTime: '12:30' },
    { id: 's6', date: '2024-02-29', startTime: '11:00', endTime: '12:30' },
  ],
  '18101': [
    { id: 's7', date: '2024-03-01', startTime: '13:00', endTime: '14:30' },
  ],
  '20101': [
    { id: 's8', date: '2024-02-27', startTime: '10:00', endTime: '11:30' },
  ],
}

export const STUDENTS_BY_SESSION = {
  s1: [
    { id: '1', name: 'Ali Ahmadov', studentId: '12345', status: 'present' },
    { id: '2', name: 'Aysu Mammadova', studentId: '12346', status: 'present' },
    { id: '3', name: 'Elvin Huseynov', studentId: '12347', status: 'late' },
    { id: '4', name: 'Fatima Karimova', studentId: '12348', status: 'absent' },
    { id: '5', name: 'Kamran Ismayilov', studentId: '12349', status: 'present' },
    { id: '6', name: 'Leyla Rzayeva', studentId: '12350', status: 'present' },
    { id: '7', name: 'Nigar Aliyeva', studentId: '12351', status: 'late' },
    { id: '8', name: 'Rashad Guliyev', studentId: '12352', status: 'absent' },
  ],
  s2: [
    { id: '1', name: 'Ali Ahmadov', studentId: '12345', status: 'present' },
    { id: '2', name: 'Aysu Mammadova', studentId: '12346', status: 'present' },
    { id: '3', name: 'Elvin Huseynov', studentId: '12347', status: 'present' },
    { id: '4', name: 'Fatima Karimova', studentId: '12348', status: 'absent' },
    { id: '5', name: 'Kamran Ismayilov', studentId: '12349', status: 'present' },
    { id: '6', name: 'Leyla Rzayeva', studentId: '12350', status: 'late' },
    { id: '7', name: 'Nigar Aliyeva', studentId: '12351', status: 'present' },
    { id: '8', name: 'Rashad Guliyev', studentId: '12352', status: 'absent' },
  ],
  s3: [
    { id: '1', name: 'Ali Ahmadov', studentId: '12345', status: 'present' },
    { id: '2', name: 'Aysu Mammadova', studentId: '12346', status: 'present' },
    { id: '3', name: 'Elvin Huseynov', studentId: '12347', status: 'absent' },
    { id: '4', name: 'Fatima Karimova', studentId: '12348', status: 'present' },
    { id: '5', name: 'Kamran Ismayilov', studentId: '12349', status: 'late' },
    { id: '6', name: 'Leyla Rzayeva', studentId: '12350', status: 'present' },
    { id: '7', name: 'Nigar Aliyeva', studentId: '12351', status: 'present' },
    { id: '8', name: 'Rashad Guliyev', studentId: '12352', status: 'absent' },
  ],
  s4: [
    { id: '1', name: 'Ali Ahmadov', studentId: '12345', status: 'present' },
    { id: '2', name: 'Aysu Mammadova', studentId: '12346', status: 'present' },
    { id: '3', name: 'Elvin Huseynov', studentId: '12347', status: 'present' },
    { id: '4', name: 'Fatima Karimova', studentId: '12348', status: 'late' },
    { id: '5', name: 'Kamran Ismayilov', studentId: '12349', status: 'present' },
    { id: '6', name: 'Leyla Rzayeva', studentId: '12350', status: 'present' },
    { id: '7', name: 'Nigar Aliyeva', studentId: '12351', status: 'present' },
    { id: '8', name: 'Rashad Guliyev', studentId: '12352', status: 'absent' },
  ],
  s5: [
    { id: '9', name: 'Sara Hasanova', studentId: '12353', status: 'present' },
    { id: '10', name: 'Tural Mammadov', studentId: '12354', status: 'present' },
    { id: '11', name: 'Zehra Quliyeva', studentId: '12355', status: 'late' },
  ],
  s6: [
    { id: '9', name: 'Sara Hasanova', studentId: '12353', status: 'present' },
    { id: '10', name: 'Tural Mammadov', studentId: '12354', status: 'absent' },
    { id: '11', name: 'Zehra Quliyeva', studentId: '12355', status: 'present' },
  ],
  s7: [
    { id: '12', name: 'Amir Jafarov', studentId: '12356', status: 'present' },
    { id: '13', name: 'Diana Sadigova', studentId: '12357', status: 'present' },
    { id: '14', name: 'Orkhan Valiyev', studentId: '12358', status: 'late' },
  ],
  s8: [
    { id: '15', name: 'Gunay Mammadli', studentId: '12359', status: 'present' },
    { id: '16', name: 'Roya Haciyeva', studentId: '12360', status: 'absent' },
  ],
}

export const STUDENTS_BY_CRN = {
  '10101': [
    { id: '1', name: 'Ali Ahmadov', studentId: '12345', email: 'a.ahmadov@ada.edu.az' },
    { id: '2', name: 'Aysu Mammadova', studentId: '12346', email: 'a.mammadova@ada.edu.az' },
    { id: '3', name: 'Elvin Huseynov', studentId: '12347', email: 'e.huseynov@ada.edu.az' },
    { id: '4', name: 'Fatima Karimova', studentId: '12348', email: 'f.karimova@ada.edu.az' },
    { id: '5', name: 'Kamran Ismayilov', studentId: '12349', email: 'k.ismayilov@ada.edu.az' },
    { id: '6', name: 'Leyla Rzayeva', studentId: '12350', email: 'l.rzayeva@ada.edu.az' },
    { id: '7', name: 'Nigar Aliyeva', studentId: '12351', email: 'n.aliyeva@ada.edu.az' },
    { id: '8', name: 'Rashad Guliyev', studentId: '12352', email: 'r.guliyev@ada.edu.az' },
  ],
  '10102': [
    { id: '9', name: 'Sara Hasanova', studentId: '12353', email: 's.hasanova@ada.edu.az' },
    { id: '10', name: 'Tural Mammadov', studentId: '12354', email: 't.mammadov@ada.edu.az' },
    { id: '11', name: 'Zehra Quliyeva', studentId: '12355', email: 'z.quliyeva@ada.edu.az' },
  ],
  '18101': [
    { id: '12', name: 'Amir Jafarov', studentId: '12356', email: 'a.jafarov@ada.edu.az' },
    { id: '13', name: 'Diana Sadigova', studentId: '12357', email: 'd.sadigova@ada.edu.az' },
    { id: '14', name: 'Orkhan Valiyev', studentId: '12358', email: 'o.valiyev@ada.edu.az' },
  ],
  '20101': [
    { id: '15', name: 'Gunay Mammadli', studentId: '12359', email: 'g.mammadli@ada.edu.az' },
    { id: '16', name: 'Roya Haciyeva', studentId: '12360', email: 'r.haciyeva@ada.edu.az' },
  ],
}

const defaultSessions = [
  { id: 's0', date: '2024-03-01', startTime: '09:00', endTime: '10:30' },
  { id: 's0b', date: '2024-02-28', startTime: '09:00', endTime: '10:30' },
]

const defaultSessionStudents = [
  { id: '1', name: 'Ali Ahmadov', studentId: '12345', status: 'present' },
  { id: '2', name: 'Aysu Mammadova', studentId: '12346', status: 'late' },
  { id: '3', name: 'Elvin Huseynov', studentId: '12347', status: 'absent' },
]

const defaultRoster = [
  { id: '1', name: 'Ali Ahmadov', studentId: '12345', email: 'a.ahmadov@ada.edu.az' },
  { id: '2', name: 'Aysu Mammadova', studentId: '12346', email: 'a.mammadova@ada.edu.az' },
  { id: '3', name: 'Elvin Huseynov', studentId: '12347', email: 'e.huseynov@ada.edu.az' },
]

export function getSessionsForCrn(lessonId) {
  return PAST_SESSIONS_BY_CRN[lessonId] || defaultSessions
}

export function getStudentsForSession(sessionId) {
  const source = STUDENTS_BY_SESSION[sessionId] || defaultSessionStudents
  return source.map((student) => ({
    ...student,
    status: getResolvedStatus(sessionId, student.studentId, student.status),
  }))
}

export function formatAttendanceDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Returns students for a CRN with attendance rate and per-session history.
 * Each item: { id, name, studentId, email, attendedCount, totalSessions, rate, sessionHistory: [ { sessionId, date, startTime, endTime, status } ] }
 */
export function getStudentAttendanceForCrn(lessonId) {
  const sessions = getSessionsForCrn(lessonId)
  const roster = STUDENTS_BY_CRN[lessonId] || defaultRoster
  const rosterByStudentId = {}
  roster.forEach((r) => { rosterByStudentId[r.studentId] = r })

  const studentMap = {}
  sessions.forEach((session) => {
    const sessionStudents = getStudentsForSession(session.id)
    sessionStudents.forEach((s) => {
      const key = s.studentId
      if (!studentMap[key]) {
        studentMap[key] = {
          id: s.id,
          name: s.name,
          studentId: s.studentId,
          email: (rosterByStudentId[key] && rosterByStudentId[key].email) || '',
          sessionHistory: [],
        }
      }
      studentMap[key].sessionHistory.push({
        sessionId: session.id,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        status: s.status,
      })
    })
  })

  roster.forEach((r) => {
    if (!studentMap[r.studentId]) {
      studentMap[r.studentId] = {
        id: r.id,
        name: r.name,
        studentId: r.studentId,
        email: r.email,
        sessionHistory: [],
      }
    }
  })

  return Object.values(studentMap).map((s) => {
    const attendedCount = s.sessionHistory.filter((h) => ATTENDED_STATUSES.has(h.status)).length
    const totalSessions = sessions.length
    const rate = totalSessions ? Math.round((attendedCount / totalSessions) * 100) : 0
    return {
      ...s,
      attendedCount,
      totalSessions,
      rate,
    }
  })
}
