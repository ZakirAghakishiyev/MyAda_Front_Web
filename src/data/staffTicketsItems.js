/** Staff portal tickets: dashboard (assigned) + history. Same shape as myRequestsItems for RequestDetail-style view. */
import { getRequestById } from './myRequestsItems'

export const staffTickets = [
  {
    id: 'REQ-8821',
    description: 'Server Room AC Unit Failure',
    descriptionFull: 'AC unit in the server room has failed. Temperature rising. Facilities support required.',
    category: 'Facilities',
    location: 'Main Library, Server Rm 204',
    assignedTo: 'John Doe',
    timeAgo: '12m ago',
    status: 'In Progress',
    urgency: 'Urgent',
    priority: 'High',
    created: 'Mar 6, 2026 • 10:15 AM',
    completed: null,
    cancelReason: null,
    rating: null,
    timeline: [
      { step: 'Created', detail: 'Mar 6, 2026 • 10:15 AM', done: true },
      { step: 'Assigned', detail: 'Assigned to John Doe', done: true },
      { step: 'In Progress', detail: 'Work started on ticket', done: true },
      { step: 'Completed', detail: null, done: false }
    ]
  },
  {
    id: 'REQ-8819',
    description: 'Wi-Fi dead zone in North Wing',
    descriptionFull: 'No Wi-Fi coverage in North Wing, 3rd Floor. Reported by Dr. Sarah Jenkins.',
    category: 'Wi-Fi & Network',
    location: 'North Wing, 3rd Floor',
    assignedTo: 'John Doe',
    timeAgo: '25m ago',
    status: 'Assigned',
    urgency: 'Not Urgent',
    priority: 'Medium',
    created: 'Mar 6, 2026 • 10:02 AM',
    completed: null,
    cancelReason: null,
    rating: null,
    timeline: [
      { step: 'Created', detail: 'Mar 6, 2026 • 10:02 AM', done: true },
      { step: 'Assigned', detail: 'Assigned to John Doe', done: true },
      { step: 'In Progress', detail: 'Work started on ticket', done: false },
      { step: 'Completed', detail: null, done: false }
    ]
  },
  {
    id: 'REQ-8815',
    description: 'Light fixture replacement',
    descriptionFull: 'Light fixture replacement needed in Admin Building, Hallway B.',
    category: 'Maintenance',
    location: 'Admin Building, Hallway B',
    assignedTo: 'John Doe',
    timeAgo: '1h ago',
    status: 'In Progress',
    urgency: 'Not Urgent',
    priority: 'Low',
    created: 'Mar 6, 2026 • 9:30 AM',
    completed: null,
    cancelReason: null,
    rating: null,
    timeline: [
      { step: 'Created', detail: 'Mar 6, 2026 • 9:30 AM', done: true },
      { step: 'Assigned', detail: 'Assigned to John Doe', done: true },
      { step: 'In Progress', detail: 'Work started on ticket', done: true },
      { step: 'Completed', detail: null, done: false }
    ]
  },
  {
    id: 'REQ-8812',
    description: 'Projector not displaying in Room 101',
    descriptionFull: 'Projector displays no signal in Main Building Room 101. Reported by Prof. James Wilson.',
    category: 'Projector/Display',
    location: 'Main Building, Room 101',
    assignedTo: 'John Doe',
    timeAgo: '2h ago',
    status: 'Assigned',
    urgency: 'Not Urgent',
    priority: 'Low',
    created: 'Mar 6, 2026 • 8:45 AM',
    completed: null,
    cancelReason: null,
    rating: null,
    timeline: [
      { step: 'Created', detail: 'Mar 6, 2026 • 8:45 AM', done: true },
      { step: 'Assigned', detail: 'Assigned to John Doe', done: true },
      { step: 'In Progress', detail: 'Work started on ticket', done: false },
      { step: 'Completed', detail: null, done: false }
    ]
  },
  {
    id: 'REQ-8805',
    description: 'Email access issue in Lab 3',
    descriptionFull: 'Students unable to access email from Lab 3 machines.',
    category: 'Email & Office 365',
    location: 'Lab 3, North Wing',
    assignedTo: 'John Doe',
    timeAgo: '1 day ago',
    status: 'Completed',
    urgency: 'Not Urgent',
    priority: 'Medium',
    created: 'Mar 5, 2026 • 2:00 PM',
    completed: 'Mar 5, 2026 • 4:30 PM',
    cancelReason: null,
    rating: 5,
    timeline: [
      { step: 'Created', detail: 'Mar 5, 2026 • 2:00 PM', done: true },
      { step: 'Assigned', detail: 'Assigned to John Doe', done: true },
      { step: 'In Progress', detail: 'Work started on ticket', done: true },
      { step: 'Completed', detail: 'Mar 5, 2026 • 4:30 PM', done: true }
    ]
  },
  {
    id: 'REQ-8798',
    description: 'HVAC adjustment Room 201',
    descriptionFull: 'Temperature adjustment requested for Room 201.',
    category: 'Maintenance',
    location: 'Main Building, Room 201',
    assignedTo: 'John Doe',
    timeAgo: '2 days ago',
    status: 'Completed',
    urgency: 'Not Urgent',
    priority: 'Low',
    created: 'Mar 4, 2026 • 11:00 AM',
    completed: 'Mar 4, 2026 • 12:15 PM',
    cancelReason: null,
    rating: 4,
    timeline: [
      { step: 'Created', detail: 'Mar 4, 2026 • 11:00 AM', done: true },
      { step: 'Assigned', detail: 'Assigned to John Doe', done: true },
      { step: 'In Progress', detail: 'Work started on ticket', done: true },
      { step: 'Completed', detail: 'Mar 4, 2026 • 12:15 PM', done: true }
    ]
  },
  {
    id: 'REQ-8782',
    description: 'Printer setup Admin floor',
    descriptionFull: 'New printer setup and configuration on Admin floor.',
    category: 'Printer/Scanner',
    location: 'Admin Building',
    assignedTo: 'John Doe',
    timeAgo: '3 days ago',
    status: 'Completed',
    urgency: 'Not Urgent',
    priority: 'Low',
    created: 'Mar 3, 2026 • 9:00 AM',
    completed: 'Mar 3, 2026 • 10:30 AM',
    cancelReason: null,
    rating: 5,
    timeline: [
      { step: 'Created', detail: 'Mar 3, 2026 • 9:00 AM', done: true },
      { step: 'Assigned', detail: 'Assigned to John Doe', done: true },
      { step: 'In Progress', detail: 'Work started on ticket', done: true },
      { step: 'Completed', detail: 'Mar 3, 2026 • 10:30 AM', done: true }
    ]
  },
  {
    id: 'REQ-8761',
    description: 'Power outlet repair',
    descriptionFull: 'Power outlet not working in Library study area.',
    category: 'Maintenance',
    location: 'Library, Study Area',
    assignedTo: 'John Doe',
    timeAgo: '4 days ago',
    status: 'Completed',
    urgency: 'Urgent',
    priority: 'High',
    created: 'Mar 2, 2026 • 1:00 PM',
    completed: 'Mar 2, 2026 • 2:45 PM',
    cancelReason: null,
    rating: 5,
    timeline: [
      { step: 'Created', detail: 'Mar 2, 2026 • 1:00 PM', done: true },
      { step: 'Assigned', detail: 'Assigned to John Doe', done: true },
      { step: 'In Progress', detail: 'Work started on ticket', done: true },
      { step: 'Completed', detail: 'Mar 2, 2026 • 2:45 PM', done: true }
    ]
  },
  {
    id: 'REQ-8744',
    description: 'Door hinge replacement B Block',
    descriptionFull: 'Door hinge replacement needed in B Block, 2nd Floor.',
    category: 'Maintenance',
    location: 'B Block, 2nd Floor',
    assignedTo: 'John Doe',
    timeAgo: '1 week ago',
    status: 'Completed',
    urgency: 'Not Urgent',
    priority: 'Low',
    created: 'Feb 28, 2026 • 10:00 AM',
    completed: 'Feb 28, 2026 • 11:20 AM',
    cancelReason: null,
    rating: 4,
    timeline: [
      { step: 'Created', detail: 'Feb 28, 2026 • 10:00 AM', done: true },
      { step: 'Assigned', detail: 'Assigned to John Doe', done: true },
      { step: 'In Progress', detail: 'Work started on ticket', done: true },
      { step: 'Completed', detail: 'Feb 28, 2026 • 11:20 AM', done: true }
    ]
  },
  {
    id: 'REQ-8720',
    description: 'Wi-Fi extender install',
    descriptionFull: 'Install Wi-Fi extender in Dormitory East to improve coverage.',
    category: 'Wi-Fi & Network',
    location: 'Dormitory East',
    assignedTo: 'John Doe',
    timeAgo: '2 weeks ago',
    status: 'Completed',
    urgency: 'Not Urgent',
    priority: 'Medium',
    created: 'Feb 25, 2026 • 2:00 PM',
    completed: 'Feb 25, 2026 • 4:00 PM',
    cancelReason: null,
    rating: 5,
    timeline: [
      { step: 'Created', detail: 'Feb 25, 2026 • 2:00 PM', done: true },
      { step: 'Assigned', detail: 'Assigned to John Doe', done: true },
      { step: 'In Progress', detail: 'Work started on ticket', done: true },
      { step: 'Completed', detail: 'Feb 25, 2026 • 4:00 PM', done: true }
    ]
  }
]

export function getStaffTicketById(id) {
  const staff = staffTickets.find((t) => t.id === id)
  if (staff) return staff
  return getRequestById(id) || null
}
