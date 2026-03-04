// Mock data for Club Admin dashboard, applications, and activity feed

export const mockClubAdminStats = {
  activeMembers: 124,
  membersChange: 5,
  openVacancies: 3,
  vacanciesChange: -2,
  newApplications: 12,
  applicationsChange: 8,
  upcomingEvents: 4,
  eventsStatus: 'Stable'
}

export const mockClubAdminActivity = [
  { id: 1, studentName: 'Alex Johnson', actionType: 'Application Submitted', roleOrEvent: 'Lead Designer', status: 'Pending Review', timestamp: '2 mins ago' },
  { id: 2, studentName: 'Maria Garcia', actionType: 'Membership Confirmed', roleOrEvent: 'General Member', status: 'Completed', timestamp: '1 hour ago' },
  { id: 3, studentName: 'James Smith', actionType: 'Role Application', roleOrEvent: 'Treasurer', status: 'Under Review', timestamp: '3 hours ago' },
  { id: 4, studentName: 'Sarah Chen', actionType: 'Event Suggestion', roleOrEvent: 'Annual Gala 2024', status: 'New Proposal', timestamp: '5 hours ago' }
]

export const mockMembershipApplications = [
  { id: 1, applicantName: 'Jane Cooper', email: 'jane.c@university.edu', studentId: '20230045', roleType: 'Full Membership', appliedOn: 'Oct 24, 2023', status: 'Pending', avatar: null, phone: '+994 50 111 22 33', department: 'Computer Science', year: 'Junior', gpa: '3.6', message: 'I am very interested in joining the club to contribute to events and meet like-minded students.' },
  { id: 2, applicantName: 'John Doe', email: 'john.d@university.edu', studentId: '20230112', roleType: 'Associate Member', appliedOn: 'Oct 23, 2023', status: 'Reviewing', avatar: null, phone: '+994 50 222 33 44', department: 'Business Administration', year: 'Sophomore', gpa: '3.4', message: 'Would love to be an associate member and participate in workshops.' },
  { id: 3, applicantName: 'Emily Brown', email: 'emily.b@university.edu', studentId: '20229876', roleType: 'Full Membership', appliedOn: 'Oct 22, 2023', status: 'Pending', avatar: null, phone: '+994 50 333 44 55', department: 'Visual Arts', year: 'Senior', gpa: '3.8', message: 'I have been following the club activities and would like to become a full member.' }
]

export const mockJobVacancyApplications = [
  { id: 4, applicantName: 'Mike Wilson', email: 'mike.w@university.edu', studentId: '20230456', roleType: 'Marketing Coordinator', appliedOn: 'Oct 24, 2023', status: 'Pending', avatar: null, phone: '+994 50 444 55 66', department: 'Marketing', year: 'Junior', gpa: '3.5', message: 'I have experience managing social media for student projects and would like to bring that to the club.', experience: '1 year social media management', portfolioUrl: 'https://portfolio.example.com/mike' },
  { id: 5, applicantName: 'Lisa Park', email: 'lisa.p@university.edu', studentId: '20230234', roleType: 'Event Coordinator', appliedOn: 'Oct 23, 2023', status: 'Reviewing', avatar: null, phone: '+994 50 555 66 77', department: 'International Relations', year: 'Senior', gpa: '3.7', message: 'I have organized several campus events and am excited to apply for the Event Coordinator role.', experience: '2 years event planning', portfolioUrl: null }
]

export const VACANCY_CATEGORIES = ['Marketing', 'Technology', 'Events', 'Finance', 'Outreach', 'Content', 'Other']

// Member positions (status) in the club
// In this UI we treat all regular members as having the same status: "Member"
export const MEMBER_POSITIONS = ['Member']

// Mock club members (only regular members appear here)
export const mockClubMembers = [
  { id: 2, name: 'Maria', surname: 'Garcia', email: 'maria.g@university.edu', studentId: '20220145', position: 'Member', joinedDate: 'Sep 15, 2022', age: 20 },
  { id: 5, name: 'Emma', surname: 'Wilson', email: 'emma.w@university.edu', studentId: '20220456', position: 'Member', joinedDate: 'Nov 1, 2022', age: 19 },
  { id: 6, name: 'David', surname: 'Brown', email: 'david.b@university.edu', studentId: '20220567', position: 'Member', joinedDate: 'Jan 15, 2023', age: 23 }
]

// Employee/role positions (job titles for filled vacancies, including leadership)
export const EMPLOYEE_POSITIONS = [
  {
    id: 1,
    title: 'President',
    category: 'Other',
    requirements: [
      'Strong leadership experience within student organizations.',
      'Ability to coordinate multiple teams and initiatives.'
    ]
  },
  {
    id: 2,
    title: 'Vice President',
    category: 'Other',
    requirements: [
      'Experience supporting executive leadership.',
      'Comfort stepping in to lead events and meetings.'
    ]
  },
  {
    id: 3,
    title: 'Secretary',
    category: 'Other',
    requirements: [
      'Excellent note‑taking and documentation skills.',
      'Strong attention to detail and organization.'
    ]
  },
  {
    id: 4,
    title: 'Treasurer',
    category: 'Finance',
    requirements: [
      'Basic budgeting and finance knowledge.',
      'Comfort working with spreadsheets and reports.'
    ]
  },
  {
    id: 5,
    title: 'Marketing Coordinator',
    category: 'Marketing',
    requirements: [
      'Experience with social media or basic design tools.',
      'Interest in growing club visibility on campus.'
    ]
  },
  {
    id: 6,
    title: 'Event Coordinator',
    category: 'Events',
    requirements: [
      'Prior experience organizing events or logistics.',
      'Strong communication and time‑management skills.'
    ]
  },
  {
    id: 7,
    title: 'Lead Designer',
    category: 'Content',
    requirements: [
      'Portfolio of design work (posters, social graphics, etc.).',
      'Comfort working with tools like Figma or Illustrator.'
    ]
  },
  {
    id: 8,
    title: 'Content Writer',
    category: 'Content',
    requirements: [
      'Good writing skills in English.',
      'Ability to adapt tone for different audiences.'
    ]
  },
  {
    id: 9,
    title: 'Outreach Lead',
    category: 'Outreach',
    requirements: [
      'Confident communication with external partners.',
      'Interest in building collaborations and sponsorships.'
    ]
  }
]

// Mock club employees (members who hold job/leadership positions)
export const mockClubEmployees = [
  { id: 1, name: 'Alex', surname: 'Johnson', email: 'alex.j@university.edu', position: 'President', department: 'Management', joinedDate: 'Sep 1, 2022', age: 22 },
  { id: 3, name: 'James', surname: 'Smith', email: 'james.s@university.edu', position: 'Treasurer', department: 'Finance', joinedDate: 'Oct 1, 2022', age: 24 },
  { id: 4, name: 'Sarah', surname: 'Chen', email: 'sarah.c@university.edu', position: 'Secretary', department: 'Administration', joinedDate: 'Oct 10, 2022', age: 21 },
  { id: 7, name: 'Mike', surname: 'Wilson', email: 'mike.w@university.edu', position: 'Marketing Coordinator', department: 'Marketing', joinedDate: 'Oct 24, 2023', age: 21 },
  { id: 8, name: 'Lisa', surname: 'Park', email: 'lisa.p@university.edu', position: 'Event Coordinator', department: 'Events', joinedDate: 'Oct 25, 2023', age: 23 },
  { id: 9, name: 'Chris', surname: 'Lee', email: 'chris.l@university.edu', position: 'Lead Designer', department: 'Technology', joinedDate: 'Sep 10, 2023', age: 25 }
]
