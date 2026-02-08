export const mockClubs = [
  {
    id: 1,
    name: 'ADA Digital Entertainment Club',
    category: 'Technology',
    tags: ['Gaming', 'Digital Media', 'Content Creation', 'Esports'],
    members: 156,
    status: 'Open',
    about: 'The ADA Digital Entertainment Club is a vibrant community for gaming enthusiasts, content creators, and digital entertainment lovers. We organize esports tournaments, game development workshops, streaming sessions, and digital content creation bootcamps.',
    officers: [
      { name: 'Rəşad Məmmədov', role: 'President' },
      { name: 'Leyla Həsənova', role: 'Vice President' }
    ],
    email: 'adaadecclub@ada.edu.az',
    phone: '+994 50 123 45 67'
  },
  {
    id: 2,
    name: 'ADA Photo Club',
    category: 'Arts',
    tags: ['Photography', 'Visual Arts'],
    members: 89,
    status: 'Open',
    about: 'A community for photography enthusiasts. We host workshops, photo walks, and exhibitions.',
    officers: [
      { name: 'Aysel Aliyeva', role: 'President' },
      { name: 'Farid Mammadov', role: 'Vice President' }
    ],
    email: 'photoclub@ada.edu.az',
    phone: '+994 50 234 56 78'
  },
  {
    id: 3,
    name: 'E-Commerce Club',
    category: 'Business',
    tags: ['Business', 'E-Commerce', 'Startups'],
    members: 134,
    status: 'Open',
    about: 'Explore e-commerce, digital marketing, and online business. We run case studies and guest speaker events.',
    officers: [
      { name: 'Elvin Hasanov', role: 'President' }
    ],
    email: 'ecommerce@ada.edu.az',
    phone: '+994 50 345 67 89'
  },
  {
    id: 4,
    name: 'ADAMUN',
    category: 'Academic',
    tags: ['Model UN', 'Debate', 'International Affairs'],
    members: 112,
    status: 'Open',
    about: 'Model United Nations club. Practice diplomacy, debate, and global issues.',
    officers: [
      { name: 'Nigar Mammadova', role: 'President' },
      { name: 'Rashad Ibrahimov', role: 'Secretary General' }
    ],
    email: 'adamun@ada.edu.az',
    phone: '+994 50 456 78 90'
  },
  {
    id: 5,
    name: 'ADA Chess Club',
    category: 'Sports',
    tags: ['Chess', 'Strategy'],
    members: 67,
    status: 'Paused',
    about: 'Chess enthusiasts of all levels. Tournaments and casual play.',
    officers: [
      { name: 'Vugar Gasimov', role: 'President' }
    ],
    email: 'chess@ada.edu.az',
    phone: '+994 50 567 89 01'
  },
  {
    id: 6,
    name: 'Music Club',
    category: 'Arts',
    tags: ['Music', 'Performance', 'Production'],
    members: 94,
    status: 'Open',
    about: 'Music lovers and performers. Jam sessions, open mics, and production workshops.',
    officers: [
      { name: 'Leyla Huseynova', role: 'President' }
    ],
    email: 'musicclub@ada.edu.az',
    phone: '+994 50 678 90 12'
  }
]

export const mockMemberships = [
  {
    clubId: 1,
    clubName: 'ADA Digital Entertainment Club',
    memberSince: 'Sep 2024',
    role: 'Member',
    status: 'Active'
  },
  {
    clubId: 2,
    clubName: 'ADA Photo Club',
    memberSince: 'Aug 2024',
    role: 'Vice President',
    status: 'Active'
  },
  {
    clubId: 4,
    clubName: 'ADAMUN',
    memberSince: 'Oct 2024',
    role: 'Member',
    status: 'Pending'
  },
  {
    clubId: 5,
    clubName: 'ADA Chess Club',
    memberSince: null,
    role: null,
    status: 'Declined'
  }
]

export function getClubById(id) {
  const numId = parseInt(id, 10)
  return mockClubs.find((c) => c.id === numId) || null
}
