export const mockClubEvents = [
  {
    id: 1,
    clubId: 1,
    clubName: 'ADA Digital Entertainment Club',
    title: 'Esports Tournament Finals',
    category: 'Technology',
    description: 'Join us for the finals of our semester-long esports tournament. Teams will compete in League of Legends and Valorant.',
    date: '2025-02-15',
    time: '14:00',
    endTime: '18:00',
    location: 'Student Center, Room 201',
    image: null
  },
  {
    id: 2,
    clubId: 1,
    clubName: 'ADA Digital Entertainment Club',
    title: 'Game Dev Workshop',
    category: 'Technology',
    description: 'Learn the basics of game development with Unity. No prior experience required.',
    date: '2025-02-20',
    time: '16:00',
    endTime: '18:30',
    location: 'Computer Lab, Building B',
    image: null
  },
  {
    id: 3,
    clubId: 2,
    clubName: 'ADA Photo Club',
    title: 'Campus Photo Walk',
    category: 'Arts',
    description: 'A guided photography walk around campus. Bring your camera or smartphone.',
    date: '2025-02-22',
    time: '10:00',
    endTime: '12:00',
    location: 'Main Campus Entrance',
    image: null
  },
  {
    id: 4,
    clubId: 3,
    clubName: 'E-Commerce Club',
    title: 'Startup Pitch Night',
    category: 'Business',
    description: 'Present your startup idea or listen to fellow students pitch theirs. Networking and feedback session.',
    date: '2025-02-25',
    time: '17:00',
    endTime: '19:30',
    location: 'Auditorium',
    image: null
  },
  {
    id: 5,
    clubId: 4,
    clubName: 'ADAMUN',
    title: 'Model UN Practice Session',
    category: 'Academic',
    description: 'Practice debate and diplomacy. This session focuses on resolution writing.',
    date: '2025-02-18',
    time: '15:00',
    endTime: '17:00',
    location: 'Conference Room, Building A',
    image: null
  },
  {
    id: 6,
    clubId: 6,
    clubName: 'Music Club',
    title: 'Open Mic Night',
    category: 'Arts',
    description: 'Showcase your talent or enjoy performances. All genres welcome.',
    date: '2025-02-28',
    time: '19:00',
    endTime: '22:00',
    location: 'Student Lounge',
    image: null
  }
]

export function getEventById(id) {
  const numId = parseInt(id, 10)
  return mockClubEvents.find((e) => e.id === numId) || null
}
