export const mockRequests = [
  {
    id: 'T-1234',
    description: 'Cannot connect to ADA-WiFi network',
    descriptionFull: 'Unable to connect to the campus WiFi network',
    category: 'Wi-Fi & Network',
    location: 'Main Building - Floor 2',
    assignedTo: 'Farid Mammadov',
    timeAgo: '11h ago',
    status: 'In Progress',
    urgency: 'Urgent',
    priority: 'High',
    created: 'Jan 31, 2026 • 2:19 AM',
    completed: null,
    cancelReason: null,
    rating: null,
    timeline: [
      { step: 'Created', detail: 'Jan 31, 2026 • 2:19 AM', done: true },
      { step: 'Assigned', detail: 'Assigned to Farid Mammadov', done: true },
      { step: 'In Progress', detail: 'Work started on ticket', done: true },
      { step: 'Completed', detail: null, done: false }
    ]
  },
  {
    id: 'T-1198',
    description: 'Projector not working in Lecture Hall 101',
    descriptionFull: 'Projector displays no signal in Lecture Hall 101',
    category: 'Projector/Display',
    location: 'Lecture Hall 101',
    assignedTo: 'Leyla Huseynova',
    timeAgo: 'Yesterday',
    status: 'Assigned',
    urgency: 'Not Urgent',
    priority: 'Low',
    created: 'Jan 30, 2026 • 10:00 AM',
    completed: null,
    cancelReason: null,
    rating: null,
    timeline: [
      { step: 'Created', detail: 'Jan 30, 2026 • 10:00 AM', done: true },
      { step: 'Assigned', detail: 'Assigned to Leyla Huseynova', done: true },
      { step: 'In Progress', detail: 'Work started on ticket', done: false },
      { step: 'Completed', detail: null, done: false }
    ]
  },
  {
    id: 'T-1145',
    description: 'Cannot access Outlook email',
    descriptionFull: 'Unable to sign in to Outlook email account',
    category: 'Email & Office 365',
    location: 'Dormitory',
    assignedTo: null,
    timeAgo: 'Nov 15',
    status: 'Assigned',
    urgency: 'Not Urgent',
    priority: 'Low',
    created: 'Nov 15, 2025 • 9:00 AM',
    completed: null,
    cancelReason: null,
    rating: null,
    timeline: [
      { step: 'Created', detail: 'Nov 15, 2025 • 9:00 AM', done: true },
      { step: 'Assigned', detail: 'Pending assignment', done: false },
      { step: 'In Progress', detail: 'Work started on ticket', done: false },
      { step: 'Completed', detail: null, done: false }
    ]
  },
  {
    id: 'T-1122',
    description: 'Password reset for student account',
    descriptionFull: 'Forgot password for student portal',
    category: 'Password Reset',
    location: 'Library',
    assignedTo: 'Aysel Aliyeva',
    timeAgo: '2 days ago',
    status: 'Completed',
    urgency: 'Not Urgent',
    priority: 'Low',
    created: 'Nov 10, 2025 • 12:00 AM',
    completed: 'Nov 14, 2025 • 12:00 AM',
    cancelReason: null,
    rating: 5,
    timeline: [
      { step: 'Created', detail: 'Nov 10, 2025 • 12:00 AM', done: true },
      { step: 'Assigned', detail: 'Assigned to Aysel Aliyeva', done: true },
      { step: 'In Progress', detail: 'Work started on ticket', done: true },
      { step: 'Completed', detail: 'Nov 14, 2025 • 12:00 AM', done: true }
    ]
  },
  {
    id: 'T-1098',
    description: 'Broken desk chair in Room B205',
    descriptionFull: 'Desk chair is broken and needs replacement',
    category: 'Maintenance',
    location: 'Main Building - Room B205',
    assignedTo: 'Leyla Huseynova',
    timeAgo: '5 days ago',
    status: 'Completed',
    urgency: 'Urgent',
    priority: 'High',
    created: 'Nov 8, 2025 • 2:00 PM',
    completed: 'Nov 12, 2025 • 4:30 PM',
    cancelReason: null,
    rating: 4,
    timeline: [
      { step: 'Created', detail: 'Nov 8, 2025 • 2:00 PM', done: true },
      { step: 'Assigned', detail: 'Assigned to Leyla Huseynova', done: true },
      { step: 'In Progress', detail: 'Work started on ticket', done: true },
      { step: 'Completed', detail: 'Nov 12, 2025 • 4:30 PM', done: true }
    ]
  },
  {
    id: 'T-1087',
    description: 'Need Adobe Creative Suite installed',
    descriptionFull: 'Request for Adobe Creative Suite installation',
    category: 'Software Installation',
    location: 'Computer Lab B',
    assignedTo: null,
    timeAgo: '1 week ago',
    status: 'Cancelled',
    urgency: 'Not Urgent',
    priority: 'Low',
    created: 'Nov 5, 2025 • 12:00 AM',
    completed: null,
    cancelReason: 'Found alternative solution',
    rating: null,
    timeline: [
      { step: 'Created', detail: 'Nov 5, 2025 • 12:00 AM', done: true },
      { step: 'Assigned', detail: 'Assigned to IT Support', done: true },
      { step: 'Cancelled', detail: 'Found alternative solution', done: true }
    ]
  }
]

export function getRequestById(id) {
  return mockRequests.find((r) => r.id === id) || null
}
