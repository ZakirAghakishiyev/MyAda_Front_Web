export const mockVacancies = [
  {
    id: 1,
    clubId: 1,
    clubName: 'ADA Digital Entertainment Club',
    position: 'Event Coordinator',
    category: 'Technology',
    requirements: [
      'Currently enrolled student at ADA University',
      'Experience organizing events or club activities',
      'Strong organizational and communication skills',
      'Available 5-10 hours per week'
    ]
  },
  {
    id: 2,
    clubId: 1,
    clubName: 'ADA Digital Entertainment Club',
    position: 'Content Creator',
    category: 'Technology',
    requirements: [
      'Passion for digital content (video, graphics, or streaming)',
      'Portfolio or samples of previous work',
      'Familiarity with editing software (optional)',
      'Commitment of at least one semester'
    ]
  },
  {
    id: 3,
    clubId: 2,
    clubName: 'ADA Photo Club',
    position: 'Marketing Lead',
    category: 'Arts',
    requirements: [
      'Experience with social media marketing',
      'Creative mindset for promotional content',
      'Ability to manage club social accounts',
      'Photo editing skills preferred'
    ]
  },
  {
    id: 4,
    clubId: 3,
    clubName: 'E-Commerce Club',
    position: 'Treasurer',
    category: 'Business',
    requirements: [
      'Basic understanding of budgeting and finance',
      'Attention to detail and accuracy',
      'Excel or spreadsheet proficiency',
      'Good academic standing'
    ]
  },
  {
    id: 5,
    clubId: 4,
    clubName: 'ADAMUN',
    position: 'Secretary',
    category: 'Academic',
    requirements: [
      'Strong writing and note-taking skills',
      'Familiarity with Model UN procedures',
      'Punctuality and reliability',
      'Proficiency in English'
    ]
  },
  {
    id: 6,
    clubId: 6,
    clubName: 'Music Club',
    position: 'Workshop Coordinator',
    category: 'Arts',
    requirements: [
      'Background in music (performance or production)',
      'Experience planning workshops or sessions',
      'Strong interpersonal skills',
      'Flexible schedule for evening events'
    ]
  }
]

export function getVacancyById(id) {
  const numId = parseInt(id, 10)
  return mockVacancies.find((v) => v.id === numId) || null
}
