// Mock data for Club Admin dashboard, applications, and activity feed
import sampleResumePdf from '../assets/Zakir Aghakishiyev Resume.pdf'

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
  {
    id: 1,
    applicantName: 'Jane Cooper',
    email: 'jane.c@university.edu',
    studentId: '20230045',
    roleType: 'Full Membership',
    appliedOn: 'Oct 24, 2023',
    status: 'Pending',
    avatar: null,
    phone: '+994 50 111 22 33',
    department: 'Computer Science',
    year: '2026',
    gpa: '3.6',
    answers: {
      letterOfPurpose: 'I want to join the club to contribute to event planning and collaborate with peers who are passionate about design and technology. I can support social media content, workshop logistics, and outreach activities.',
      previousExperience: 'https://www.behance.net/janecooper',
      portfolioDescription: 'Managed design deliverables for two student projects and created promotional visuals for departmental events.'
    },
    files: []
  },
  {
    id: 2,
    applicantName: 'John Doe',
    email: 'john.d@university.edu',
    studentId: '20230112',
    roleType: 'Associate Member',
    appliedOn: 'Oct 23, 2023',
    status: 'Reviewing',
    avatar: null,
    phone: '+994 50 222 33 44',
    department: 'Business Administration',
    year: '2027',
    gpa: '3.4',
    answers: {
      letterOfPurpose: 'I am applying to gain hands-on experience in club operations and support workshop execution. I am interested in membership engagement and helping organize internal communication.',
      previousExperience: '',
      portfolioDescription: ''
    },
    files: []
  },
  {
    id: 3,
    applicantName: 'Emily Brown',
    email: 'emily.b@university.edu',
    studentId: '20229876',
    roleType: 'Full Membership',
    appliedOn: 'Oct 22, 2023',
    status: 'Pending',
    avatar: null,
    phone: '+994 50 333 44 55',
    department: 'Visual Arts',
    year: '2025',
    gpa: '3.8',
    answers: {
      letterOfPurpose: 'I have been following the club activities and want to participate as an active member to support creative production and event branding. I am especially motivated to contribute to campaign concepts and visual storytelling.',
      previousExperience: 'https://dribbble.com/emilybrown',
      portfolioDescription: 'Built posters and digital assets for faculty showcases and volunteer-led student initiatives.'
    },
    files: []
  }
]

export const mockJobVacancyApplications = [
  {
    id: 4,
    applicantName: 'Mike Wilson',
    email: 'mike.w@university.edu',
    studentId: '20230456',
    roleType: 'Marketing Coordinator',
    appliedOn: 'Oct 24, 2023',
    status: 'Pending',
    avatar: null,
    phone: '+994 50 444 55 66',
    department: 'Marketing',
    year: '2026',
    gpa: '3.5',
    answers: {
      purposeOfApplication: 'I am interested in this role because I have practical experience planning social content calendars, producing campaign visuals, and tracking engagement metrics for student-led initiatives. I would like to help the club improve consistency of posting, audience targeting, and event promotion across platforms.',
      additionalAnswers: []
    },
    files: [
      {
        id: 'resume-sample-1',
        name: 'Zakir Aghakishiyev Resume.pdf',
        type: 'application/pdf',
        size: 224000,
        uploadedAt: 'Apr 8, 2026',
        url: sampleResumePdf
      }
    ]
  },
  {
    id: 5,
    applicantName: 'Lisa Park',
    email: 'lisa.p@university.edu',
    studentId: '20230234',
    roleType: 'Event Coordinator',
    appliedOn: 'Oct 23, 2023',
    status: 'Reviewing',
    avatar: null,
    phone: '+994 50 555 66 77',
    department: 'International Relations',
    year: '2025',
    gpa: '3.7',
    answers: {
      purposeOfApplication: 'I am applying for Event Coordinator because I have led logistics for orientation and department events, including vendor communication, schedules, and volunteer coordination. I can help the club run well-structured events and improve attendee experience through better planning and follow-up.',
      additionalAnswers: []
    },
    files: []
  }
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
