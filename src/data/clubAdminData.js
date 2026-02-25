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
export const MEMBER_POSITIONS = ['Full Member', 'Associate Member', 'Treasurer', 'Secretary', 'Vice President', 'President']

// Mock club members
export const mockClubMembers = [
  { id: 1, name: 'Alex', surname: 'Johnson', email: 'alex.j@university.edu', studentId: '20220012', position: 'President', joinedDate: 'Sep 1, 2022', age: 22 },
  { id: 2, name: 'Maria', surname: 'Garcia', email: 'maria.g@university.edu', studentId: '20220145', position: 'Full Member', joinedDate: 'Sep 15, 2022', age: 20 },
  { id: 3, name: 'James', surname: 'Smith', email: 'james.s@university.edu', studentId: '20219890', position: 'Treasurer', joinedDate: 'Oct 1, 2022', age: 24 },
  { id: 4, name: 'Sarah', surname: 'Chen', email: 'sarah.c@university.edu', studentId: '20220333', position: 'Secretary', joinedDate: 'Oct 10, 2022', age: 21 },
  { id: 5, name: 'Emma', surname: 'Wilson', email: 'emma.w@university.edu', studentId: '20220456', position: 'Full Member', joinedDate: 'Nov 1, 2022', age: 19 },
  { id: 6, name: 'David', surname: 'Brown', email: 'david.b@university.edu', studentId: '20220567', position: 'Associate Member', joinedDate: 'Jan 15, 2023', age: 23 }
]

// Employee/role positions (job titles for filled vacancies)
export const EMPLOYEE_POSITIONS = ['Marketing Coordinator', 'Event Coordinator', 'Lead Designer', 'Content Writer', 'Treasurer', 'Outreach Lead']

// Mock club employees (members who hold job positions)
export const mockClubEmployees = [
  { id: 1, name: 'Mike', surname: 'Wilson', email: 'mike.w@university.edu', position: 'Marketing Coordinator', department: 'Marketing', joinedDate: 'Oct 24, 2023', age: 21 },
  { id: 2, name: 'Lisa', surname: 'Park', email: 'lisa.p@university.edu', position: 'Event Coordinator', department: 'Events', joinedDate: 'Oct 25, 2023', age: 23 },
  { id: 3, name: 'Chris', surname: 'Lee', email: 'chris.l@university.edu', position: 'Lead Designer', department: 'Technology', joinedDate: 'Sep 10, 2023', age: 25 }
]
