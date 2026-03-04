import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockClubMembers as initialMembers, mockClubEmployees as initialEmployees, MEMBER_POSITIONS as MEMBER_POSITIONS_LIST, EMPLOYEE_POSITIONS as EMPLOYEE_POSITIONS_LIST } from '../data/clubAdminData'
import './StudentServices.css'
import './club-admin/ClubAdmin.css'

const IconHome = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const IconOverview = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM13 3h8v6h-8V3zM3 21h8v-6H3v6z" />
  </svg>
)

const IconClubs = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="7" height="7" rx="1" />
    <rect x="14" y="4" width="7" height="7" rx="1" />
    <rect x="3" y="15" width="7" height="7" rx="1" />
    <rect x="14" y="15" width="7" height="7" rx="1" />
  </svg>
)

const IconEvents = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const IconStaff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
  </svg>
)

const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.45a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.27 15 1.65 1.65 0 0 0 2 14H2a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3.55 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 3.27 1.65 1.65 0 0 0 9 2h.09a2 2 0 0 1 4 0H13a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.73 9H21a2 2 0 0 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15Z" />
  </svg>
)

/* Icons for Club Proposals detail */
const IconInfo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)
const IconPeople = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const IconPeopleTwo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
  </svg>
)
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
)
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)
const IconLeaf = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
  </svg>
)
const IconDoc = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
)
const IconDocSigned = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M9 15l2 2 4-4" />
  </svg>
)
const IconDocEdit = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M11 15H8l-1 4 4-1v-3" /><path d="M17 9l2 2-6 6-4 1 1-4 6-6z" />
  </svg>
)
const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)
const IconGrid = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
)
const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const IconCloseX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)
const IconPen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
)
const IconConfirm = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconMessage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)
const IconGraduation = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
)
const IconStar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)
const IconFilter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)
const IconSort = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="8" y2="18" />
  </svg>
)
const IconMoreVertical = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
  </svg>
)
const IconPlusCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
)
const IconMonitor = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)
const IconSun = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
)
const IconMessageCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)
const IconActivityCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)
const IconActivityAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

/* Mock club proposals – fields align with ProposeClub (name, shortDesc, uniqueDesc, goals, activities, officers, otherMembers, alignment, vision, commitment, docs) */
const INITIAL_CLUB_PROPOSALS = [
  {
    id: '1',
    proposalId: 'PROP-2023-042',
    clubName: 'Green Tech Initiative',
    shortName: 'GTI',
    shortDesc: 'The Green Tech Initiative aims to bridge the gap between environmental sustainability and technological innovation. We focus on teaching students how to develop software and hardware solutions that reduce carbon footprints and promote circular economy principles on campus.',
    uniqueDesc: "Unlike the 'Eco-Club' (advocacy) or 'Computer Science Society' (general coding), we specifically target the intersection of engineering and sustainability through hands-on green-tech builds.",
    goals: 'Educate 100+ students on sustainable IoT practices\nLaunch one campus-wide energy saving app\nCollaborate with local eco-tech startups',
    activities: 'Monthly workshops on green tech, hackathons, campus energy audits, and partnership events with local startups.',
    category: 'TECHNOLOGY',
    submittedBy: 'Sarah Jenkins',
    submittedAt: 'Oct 24, 2023',
    status: 'pending_review',
    primaryOfficers: [
      { role: 'President', studentId: 'SID-2023-9844' },
      { role: 'Vice President', studentId: 'SID-2022-1102' },
      { role: 'Treasurer', studentId: 'SID-2023-4450' },
    ],
    otherMembers: [
      { studentId: 'SID-2023-7721', position: 'Outreach Coordinator', status: 'Verified' },
      { studentId: 'SID-2022-3390', position: 'Technical Lead', status: 'Verified' },
      { studentId: 'SID-2024-0012', position: 'Secretary', status: 'Verified' },
      { studentId: 'SID-2023-1182', position: 'Social Media Manager', status: 'Pending' },
    ],
    alignment: 'Our club directly supports the university\'s sustainability pillar and tech innovation goals. We align with the strategic plan by fostering hands-on learning and campus-wide impact.',
    vision: 'In 3–5 years we aim to be the go-to hub for green tech on campus, with at least two spin-off projects and a formal partnership with the engineering department.',
    commitment: 'yes',
    constitutionDoc: { name: 'Green_Tech_Constitution_v1.pdf', size: '2.4 MB', uploadedAt: 'Oct 24, 2023' },
  },
  {
    id: '2',
    proposalId: 'PROP-2023-041',
    clubName: 'Modern Jazz Collective',
    shortName: 'MJC',
    shortDesc: 'A collective for jazz musicians and enthusiasts to perform, learn, and collaborate.',
    uniqueDesc: 'Focus on contemporary and fusion jazz, with regular jam sessions and guest artist workshops.',
    goals: 'Host monthly jam sessions\nProduce one campus concert per semester\nBuild a small recording archive',
    activities: 'Rehearsals, workshops, open mics, and collaboration with music department.',
    category: 'ARTS',
    submittedBy: 'Marcus Lee',
    submittedAt: 'Oct 22, 2023',
    status: 'pending_review',
    primaryOfficers: [
      { role: 'President', studentId: 'SID-2022-8801' },
      { role: 'Vice President', studentId: 'SID-2023-2201' },
      { role: 'Treasurer', studentId: 'SID-2022-5500' },
    ],
    otherMembers: [
      { studentId: 'SID-2023-1001', position: 'Secretary', status: 'Verified' },
      { studentId: 'SID-2022-7700', position: 'Event Coordinator', status: 'Verified' },
    ],
    alignment: 'Supports arts and culture strategic pillar; complements the music department\'s curriculum.',
    vision: 'Become the leading student jazz group on campus with annual festival participation.',
    commitment: 'yes',
    constitutionDoc: { name: 'MJC_Constitution.pdf', size: '1.8 MB', uploadedAt: 'Oct 22, 2023' },
  },
  {
    id: '3',
    proposalId: 'PROP-2023-040',
    clubName: 'Debate Society Recharter',
    shortName: 'DSR',
    shortDesc: 'Rechartering of the former Debate Society with updated constitution and expanded membership goals.',
    uniqueDesc: 'Structured debate formats (British Parliamentary, World Schools) with coaching and competition travel.',
    goals: 'Compete in two regional tournaments\nTrain 30+ members in debate formats\nHost one campus debate open',
    activities: 'Weekly practice rounds, coaching sessions, and inter-university competitions.',
    category: 'ACADEMIC',
    submittedBy: 'Elena Torres',
    submittedAt: 'Oct 21, 2023',
    status: 'pending_review',
    primaryOfficers: [
      { role: 'President', studentId: 'SID-2022-3344' },
      { role: 'Vice President', studentId: 'SID-2023-5566' },
      { role: 'Treasurer', studentId: 'SID-2022-9988' },
    ],
    otherMembers: [
      { studentId: 'SID-2023-2211', position: 'Secretary', status: 'Verified' },
      { studentId: 'SID-2022-4433', position: 'Outreach Officer', status: 'Pending' },
    ],
    alignment: 'Aligns with academic excellence and critical thinking initiatives.',
    vision: 'Restore the society to national competition level within two years.',
    commitment: 'yes',
    constitutionDoc: { name: 'Debate_Society_Recharter.pdf', size: '2.1 MB', uploadedAt: 'Oct 21, 2023' },
  },
  {
    id: '4',
    proposalId: 'PROP-2023-038',
    clubName: 'Culinary Arts Guild',
    shortName: 'CAG',
    shortDesc: 'A club for students interested in culinary arts, food science, and sustainable cooking.',
    uniqueDesc: 'Emphasis on sustainable sourcing and campus garden integration.',
    goals: 'Quarterly cooking workshops\nOne pop-up dinner per semester\nPartnership with campus dining',
    activities: 'Workshops, potlucks, and guest chef sessions.',
    category: 'LIFESTYLE',
    submittedBy: 'James Chen',
    submittedAt: 'Oct 15, 2023',
    status: 'under_revision',
    primaryOfficers: [
      { role: 'President', studentId: 'SID-2022-1122' },
      { role: 'Vice President', studentId: 'SID-2023-3344' },
      { role: 'Treasurer', studentId: 'SID-2022-6677' },
    ],
    otherMembers: [
      { studentId: 'SID-2023-8899', position: 'Secretary', status: 'Verified' },
    ],
    alignment: 'Supports wellness and community engagement; ties to sustainability through local sourcing.',
    vision: 'Establish a student-run café pop-up within three years.',
    commitment: 'yes',
    constitutionDoc: { name: 'CAG_Constitution_draft.pdf', size: '1.9 MB', uploadedAt: 'Oct 15, 2023' },
  },
]

/* Buildings and rooms for event room assignment */
const BUILDINGS = [
  { id: 'b1', name: 'Student Union' },
  { id: 'b2', name: 'North Campus Hall' },
  { id: 'b3', name: 'Conference Center' },
]
const ROOMS_BY_BUILDING = {
  b1: [
    { id: 'r1', name: 'Grand Ballroom, Room 302 (Level 3)' },
    { id: 'r2', name: 'Room 101' },
    { id: 'r3', name: 'Room 205' },
  ],
  b2: [
    { id: 'r4', name: 'Main Auditorium' },
    { id: 'r5', name: 'Room B' },
    { id: 'r6', name: 'Small Hall' },
  ],
  b3: [
    { id: 'r7', name: 'Conference Room A (Level 2)' },
    { id: 'r8', name: 'Conference Room B' },
    { id: 'r9', name: 'Level 2 Main' },
  ],
}

/* Mock event proposals – fields align with ClubAdminSuggestEvent (eventName, dateTime, duration, attendance, venue, poster, description, objectives, subEvents, etc.) */
const INITIAL_EVENT_PROPOSALS = [
  {
    id: '1',
    proposalId: '10294',
    eventTitle: 'Annual Spring Tech Symposium',
    submittedOn: 'April 10, 2024',
    submittedBy: 'Alex Rivera',
    submittedAgo: '2h ago',
    clubName: 'Robotics Club',
    status: 'PENDING REVIEW',
    eventDateShort: 'Apr 24, 2024',
    dateTime: 'Wednesday, April 24, 2024',
    timeRange: '09:00 AM - 05:00 PM',
    duration: '8 Hours',
    durationLabel: 'Full day event',
    attendance: '250 - 300 People',
    attendanceNote: 'Open to all students',
    venue: 'Grand Ballroom, Student Union',
    venueRoom: 'Room 302 (Level 3)',
    requestedBuildingId: 'b1',
    requestedRoomId: 'r1',
    description: 'The Annual Spring Tech Symposium brings together students, faculty, and industry professionals for a full day of talks, workshops, and networking. The event features guest speakers from leading tech companies, a hands-on coding workshop, and a student project showcase. It aims to bridge academic learning with industry expectations and provide students with exposure to current trends in software development, AI, and cybersecurity.',
    objectives: [
      'Expose students to current industry trends through expert-led panels.',
      'Provide a platform for 20+ student groups to showcase their technical innovations.',
      'Facilitate networking between students and prospective local employers.',
    ],
    subEvents: [
      { title: 'Keynote: Future of AI', capacity: '300', timeRange: '09:30 AM - 11:00 AM', venueNotes: 'Main Stage, Screen Req.' },
      { title: 'Coding Workshop', capacity: '80', timeRange: '11:30 AM - 01:00 PM', venueNotes: 'Lab A' },
      { title: 'Project Showcase', capacity: '200', timeRange: '02:00 PM - 05:00 PM', venueNotes: 'Exhibition Hall' },
    ],
    posterPlaceholder: true,
  },
  {
    id: '2',
    proposalId: '10291',
    eventTitle: 'Jazz Night Live',
    submittedOn: 'April 8, 2024',
    submittedBy: 'Maya Chen',
    submittedAgo: '1d ago',
    clubName: 'Music & Arts Club',
    status: 'REVIEWING',
    eventDateShort: 'Apr 26, 2024',
    dateTime: 'Friday, April 26, 2024',
    timeRange: '07:00 PM - 10:00 PM',
    duration: '3 Hours',
    durationLabel: 'Evening event',
    attendance: '150 - 200 People',
    attendanceNote: 'Open to all students',
    venue: 'North Campus Hall',
    venueRoom: 'Main Auditorium',
    requestedBuildingId: 'b2',
    requestedRoomId: 'r4',
    description: 'An evening of live jazz performances featuring student bands and guest artists.',
    objectives: ['Showcase student musical talent.', 'Create a relaxed social event for the campus community.'],
    subEvents: [
      { title: 'Opening Set', capacity: '200', timeRange: '07:00 PM - 08:00 PM', venueNotes: 'Main stage' },
    ],
    posterPlaceholder: true,
  },
  {
    id: '3',
    proposalId: '10288',
    eventTitle: 'Startup Pitch Competition',
    submittedOn: 'April 5, 2024',
    submittedBy: 'Jordan Lee',
    submittedAgo: '4d ago',
    clubName: 'Entrepreneurship Society',
    status: 'URGENT',
    eventDateShort: 'Apr 30, 2024',
    dateTime: 'Tuesday, April 30, 2024',
    timeRange: '02:00 PM - 06:00 PM',
    duration: '4 Hours',
    durationLabel: 'Half-day event',
    attendance: '100 - 120 People',
    attendanceNote: 'Registered teams only',
    venue: 'Conference Room A',
    venueRoom: 'Level 2',
    requestedBuildingId: 'b3',
    requestedRoomId: 'r7',
    description: 'Student teams pitch their startup ideas to a panel of investors and mentors. Prizes for top three pitches.',
    objectives: ['Connect student ideas with real-world feedback.', 'Award seed funding to winning teams.'],
    subEvents: [
      { title: 'Pitch Round 1', capacity: '120', timeRange: '02:00 PM - 04:00 PM', venueNotes: 'AV required' },
      { title: 'Finalists & Awards', capacity: '120', timeRange: '04:30 PM - 06:00 PM', venueNotes: 'Main room' },
    ],
    posterPlaceholder: true,
  },
]

/* Master Directory – command center mock data */
const DIRECTORY_CLUBS = [
  { id: '1', name: 'ACM Tech Chapter', established: 'Sept 2021', president: 'Alex Rodriguez', presidentId: '8848291', members: 450, category: 'Academic', status: 'Active', iconColor: 'blue' },
  { id: '2', name: 'Modern Arts Society', established: 'Jan 2019', president: 'Elena Fisher', presidentId: '1029384', members: 125, category: 'Creative', status: 'Active', iconColor: 'orange' },
  { id: '3', name: 'University Football FC', established: 'Aug 2015', president: 'Marcus Wright', presidentId: '5549021', members: 62, category: 'Sports', status: 'On Probation', iconColor: 'purple' },
  { id: '4', name: 'Debate Union', established: 'May 2010', president: 'Sarah Jenkins', presidentId: '3321109', members: 188, category: 'Public Speaking', status: 'Active', iconColor: 'purple' },
]
const DIRECTORY_ACTIVITY = [
  { id: '1', title: 'Chess Club Approved', detail: '24 minutes ago by Admin J.', icon: 'check', iconColor: 'blue' },
  { id: '2', title: 'Annual Gala Booked', detail: '1 hour ago by Events Lead', icon: 'calendar', iconColor: 'green' },
  { id: '3', title: 'Funding Audit Alert', detail: '3 hours ago from Finance System', icon: 'alert', iconColor: 'red' },
]
/* Approved events for the Events section (separate from proposals) */
const APPROVED_EVENTS = [
  {
    id: 'u1',
    title: 'Annual Spring Tech Symposium',
    date: '2026-04-24',
    club: 'Robotics Club',
    venue: 'Grand Ballroom',
    capacity: 250,
    durationHours: 3,
    description: 'Flagship tech symposium bringing together student projects, guest speakers and demos.',
    subEvents: [],
  },
  {
    id: 'u2',
    title: 'Jazz Night',
    date: '2025-11-02',
    club: 'Modern Jazz Collective',
    venue: 'Student Union Hall',
    capacity: 180,
    durationHours: 2,
    description: 'Evening of live jazz featuring student bands and guest artists.',
    subEvents: [],
  },
  {
    id: 'u3',
    title: 'Startup Pitch Day',
    date: '2026-09-15',
    club: 'Entrepreneurs Society',
    venue: 'Business Building',
    capacity: 120,
    durationHours: 4,
    description: 'Pitch competition and networking event for early–stage student startups.',
    subEvents: [],
  },
]

const SUB_EVENT_LOCATIONS = {
  'Main Building': ['Auditorium A', 'Auditorium B', 'Lecture Hall 101'],
  'Student Center': ['Grand Ballroom', 'Activity Room 1', 'Activity Room 2'],
  'Business Building': ['Conference Room 1', 'Conference Room 2'],
}

const StudentServices = () => {
  const navigate = useNavigate()
  const [section, setSection] = useState('command')
  const [clubProposals, setClubProposals] = useState(INITIAL_CLUB_PROPOSALS)
  const [selectedProposalId, setSelectedProposalId] = useState('1')
  const [proposalSearch, setProposalSearch] = useState('')
  const [rejectModal, setRejectModal] = useState({ open: false, reason: '' })
  const [revisionModal, setRevisionModal] = useState({ open: false, changes: '' })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [requirementsModalOpen, setRequirementsModalOpen] = useState(false)
  const [requirementsList, setRequirementsList] = useState([
    'Minimum of 10 active student members',
    'Signed faculty advisor agreement form',
    'Proposed constitution and bylaws document',
    'Annual activity plan and estimated budget',
  ])
  const [newRequirement, setNewRequirement] = useState('')
  const [requirementsDeadline, setRequirementsDeadline] = useState('')
  const [editingRequirementIndex, setEditingRequirementIndex] = useState(null)
  const [editingRequirementDraft, setEditingRequirementDraft] = useState('')
  const [eventProposals, setEventProposals] = useState(INITIAL_EVENT_PROPOSALS)
  const [selectedEventId, setSelectedEventId] = useState('1')
  const [eventSearch, setEventSearch] = useState('')
  const [eventRejectModal, setEventRejectModal] = useState({ open: false, reason: '' })
  const [eventRevisionModal, setEventRevisionModal] = useState({ open: false, changes: '' })
  const [eventRoomAssignments, setEventRoomAssignments] = useState([])
  const [commandTab, setCommandTab] = useState('clubs')
  const [commandPage, setCommandPage] = useState(1)
  const [directoryClubs, setDirectoryClubs] = useState(DIRECTORY_CLUBS)
  const [directorySelectedClubId, setDirectorySelectedClubId] = useState(null)
  const [directoryClubTab, setDirectoryClubTab] = useState('members')
  const [clubMembers, setClubMembers] = useState([...(Array.isArray(initialMembers) ? initialMembers : [])])
  const [clubEmployees, setClubEmployees] = useState([...(Array.isArray(initialEmployees) ? initialEmployees : [])])
  const [clubMemberSearch, setClubMemberSearch] = useState('')
  const [clubEmployeeSearch, setClubEmployeeSearch] = useState('')
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false)
  const [addEmployeeId, setAddEmployeeId] = useState('')
  const [addEmployeePosition, setAddEmployeePosition] = useState('')
  const [removeMemberId, setRemoveMemberId] = useState(null)
  const [removeEmployeeId, setRemoveEmployeeId] = useState(null)
  const [pendingEmployeePosition, setPendingEmployeePosition] = useState({})
  const [clubEditName, setClubEditName] = useState('')
  const [clubEditStatus, setClubEditStatus] = useState('')
  const [clubEditImage, setClubEditImage] = useState(null)

  // Student Services – Events (approved events overview)
  const [approvedEvents, setApprovedEvents] = useState(APPROVED_EVENTS)
  const [eventsFilterStatus, setEventsFilterStatus] = useState('upcoming') // 'all' | 'upcoming' | 'past'
  const [eventsSearch, setEventsSearch] = useState('')
  const [editingApprovedEvent, setEditingApprovedEvent] = useState(null)
  const [editEventTitle, setEditEventTitle] = useState('')
  const [editEventDate, setEditEventDate] = useState('')
  const [editEventVenue, setEditEventVenue] = useState('')
  const [editEventBuilding, setEditEventBuilding] = useState('')
  const [editEventRoom, setEditEventRoom] = useState('')
  const [editEventDuration, setEditEventDuration] = useState('')
  const [editEventCapacity, setEditEventCapacity] = useState('')
  const [editEventDescription, setEditEventDescription] = useState('')
  const [editSubEvents, setEditSubEvents] = useState([])
  const [editSubTitle, setEditSubTitle] = useState('')
  const [editSubCapacity, setEditSubCapacity] = useState('')
  const [editSubDate, setEditSubDate] = useState('')
  const [editSubStart, setEditSubStart] = useState('')
  const [editSubEnd, setEditSubEnd] = useState('')
  const [editSubError, setEditSubError] = useState('')
  const [editSubBuilding, setEditSubBuilding] = useState('')
  const [editSubRoom, setEditSubRoom] = useState('')

  const todayIso = new Date().toISOString().slice(0, 10)

  const filteredApprovedEvents = useMemo(() => {
    const q = eventsSearch.trim().toLowerCase()
    return approvedEvents.filter((ev) => {
      const isUpcoming = !ev.date || ev.date >= todayIso
      if (eventsFilterStatus === 'upcoming' && !isUpcoming) return false
      if (eventsFilterStatus === 'past' && isUpcoming) return false
      if (!q) return true
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.club.toLowerCase().includes(q) ||
        (ev.venue && ev.venue.toLowerCase().includes(q))
      )
    })
  }, [approvedEvents, eventsFilterStatus, eventsSearch, todayIso])

  const startEditApprovedEvent = (ev) => {
    setEditingApprovedEvent(ev)
    setEditEventTitle(ev.title || '')
    setEditEventDate(ev.date || '')
    setEditEventVenue(ev.venue || '')
    // Try to infer building/room from existing venue
    let foundBuilding = ''
    let foundRoom = ''
    if (ev.venue) {
      Object.entries(SUB_EVENT_LOCATIONS).forEach(([building, rooms]) => {
        rooms.forEach((room) => {
          if (!foundRoom && (ev.venue === room || ev.venue.includes(room))) {
            foundBuilding = building
            foundRoom = room
          }
        })
      })
    }
    setEditEventBuilding(foundBuilding)
    setEditEventRoom(foundRoom)
    setEditEventDuration(String(ev.durationHours ?? ''))
    setEditEventCapacity(String(ev.capacity ?? ''))
    setEditEventDescription(ev.description || '')
    setEditSubEvents(ev.subEvents || [])
    setEditSubTitle('')
    setEditSubCapacity('')
    setEditSubDate('')
    setEditSubStart('')
    setEditSubEnd('')
    setEditSubError('')
    setEditSubBuilding('')
    setEditSubRoom('')
  }

  const cancelEditApprovedEvent = () => {
    setEditingApprovedEvent(null)
    setEditEventTitle('')
    setEditEventDate('')
    setEditEventVenue('')
    setEditEventBuilding('')
    setEditEventRoom('')
    setEditEventDuration('')
    setEditEventCapacity('')
    setEditEventDescription('')
    setEditSubEvents([])
    setEditSubTitle('')
    setEditSubCapacity('')
    setEditSubDate('')
    setEditSubStart('')
    setEditSubEnd('')
    setEditSubError('')
    setEditSubBuilding('')
    setEditSubRoom('')
  }

  const addEditSubEvent = () => {
    const title = editSubTitle.trim()
    const capacity = editSubCapacity.trim()
    const start = editSubStart.trim()
    const end = editSubEnd.trim()
    const date = (editSubDate || editEventDate).trim()
    const building = editSubBuilding.trim()
    const room = editSubRoom.trim()

    if (!title || !capacity || !start || !end || !building || !room) {
      setEditSubError('Please fill in title, capacity, times, building and room.')
      return
    }
    if (start && end && start >= end) {
      setEditSubError('End time must be later than start time.')
      return
    }

    setEditSubEvents((prev) => [...prev, { title, capacity, start, end, date, building, room }])
    setEditSubError('')
    setEditSubTitle('')
    setEditSubCapacity('')
    setEditSubDate('')
    setEditSubStart('')
    setEditSubEnd('')
    setEditSubBuilding('')
    setEditSubRoom('')
  }

  const removeEditSubEvent = (index) => {
    setEditSubEvents((prev) => prev.filter((_, i) => i !== index))
  }

  const confirmEditApprovedEvent = (e) => {
    e.preventDefault()
    if (!editingApprovedEvent) return
    setApprovedEvents((prev) =>
      prev.map((ev) =>
        ev.id === editingApprovedEvent.id
          ? {
              ...ev,
              title: editEventTitle || ev.title,
              date: editEventDate || ev.date,
              venue:
                (editEventBuilding && editEventRoom && `${editEventBuilding} – ${editEventRoom}`) ||
                editEventVenue ||
                ev.venue,
              durationHours:
                editEventDuration !== '' ? Number(editEventDuration) || ev.durationHours : ev.durationHours,
              capacity:
                editEventCapacity !== '' ? Number(editEventCapacity) || ev.capacity : ev.capacity,
              description: editEventDescription || ev.description,
              subEvents: editSubEvents,
            }
          : ev
      )
    )
    cancelEditApprovedEvent()
  }

  const renderHeader = (title, subtitle) => (
    <header className="ss-main-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="ss-main-header-actions">
        <input
          className="ss-search"
          placeholder="Search clubs, students, or events..."
          type="text"
        />
        <div className="ss-main-profile">
          <div className="ss-main-avatar">A</div>
          <div className="ss-main-profile-text">
            <span className="ss-main-profile-name">Admin User</span>
            <span className="ss-main-profile-role">Student Services Office</span>
          </div>
        </div>
      </div>
    </header>
  )

  const getClubIcon = (color) => {
    const Icon = color === 'orange' ? IconSun : color === 'purple' ? IconMessageCircle : IconMonitor
    return <Icon />
  }

  const selectedDirectoryClub = directoryClubs.find((c) => c.id === directorySelectedClubId)
  const filteredClubMembers = useMemo(() => {
    const q = clubMemberSearch.trim().toLowerCase()
    if (!q) return clubMembers
    return clubMembers.filter(
      (m) =>
        `${m.name} ${m.surname}`.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.studentId && m.studentId.toLowerCase().includes(q)) ||
        (m.position && m.position.toLowerCase().includes(q))
    )
  }, [clubMembers, clubMemberSearch])
  const filteredClubEmployees = useMemo(() => {
    const q = clubEmployeeSearch.trim().toLowerCase()
    if (!q) return clubEmployees
    return clubEmployees.filter(
      (e) =>
        `${e.name} ${e.surname}`.toLowerCase().includes(q) ||
        (e.email && e.email.toLowerCase().includes(q)) ||
        (e.position && e.position.toLowerCase().includes(q)) ||
        (e.department && e.department.toLowerCase().includes(q))
    )
  }, [clubEmployees, clubEmployeeSearch])

  const handleSaveClubSettings = () => {
    if (!selectedDirectoryClub) return
    const updateClub = (profileImageUrl) => {
      setDirectoryClubs((prev) =>
        prev.map((c) =>
          c.id === selectedDirectoryClub.id
            ? {
                ...c,
                name: clubEditName.trim() || c.name,
                status: clubEditStatus || c.status,
                ...(profileImageUrl != null && { profileImageUrl }),
              }
            : c
        )
      )
      setClubEditImage(null)
      setDirectorySelectedClubId(null)
    }
    if (clubEditImage && clubEditImage instanceof File) {
      const reader = new FileReader()
      reader.onload = () => updateClub(reader.result)
      reader.readAsDataURL(clubEditImage)
    } else {
      updateClub(selectedDirectoryClub.profileImageUrl)
    }
  }

  const handleAddEmployee = () => {
    const id = addEmployeeId.trim()
    const position = addEmployeePosition && addEmployeePosition !== 'Select position' ? addEmployeePosition : null
    if (!id || !position) return
    const nextId = Math.max(0, ...clubEmployees.map((e) => e.id)) + 1
    setClubEmployees((prev) => [
      ...prev,
      { id: nextId, name: 'New', surname: 'Employee', email: `${id}@university.edu`, position, studentId: id, joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), age: null },
    ])
    setAddEmployeeOpen(false)
    setAddEmployeeId('')
    setAddEmployeePosition('')
  }

  const handleEmployeePositionChange = (employeeId, newPosition, currentPosition) => {
    const value = newPosition || null
    if (value === (currentPosition || null)) {
      setPendingEmployeePosition((prev) => { const next = { ...prev }; delete next[employeeId]; return next })
    } else {
      setPendingEmployeePosition((prev) => ({ ...prev, [employeeId]: value }))
    }
  }

  const handleConfirmEmployeePosition = (employeeId) => {
    const newPosition = pendingEmployeePosition[employeeId]
    if (newPosition == null) return
    setClubEmployees((prev) => prev.map((emp) => (emp.id === employeeId ? { ...emp, position: newPosition } : emp)))
    setPendingEmployeePosition((prev) => { const next = { ...prev }; delete next[employeeId]; return next })
  }

  const renderCommandClubDetail = (backLabel = 'Back to Master Directory') => {
    if (!selectedDirectoryClub) return null
    const MEMBER_POSITIONS = Array.isArray(MEMBER_POSITIONS_LIST) ? MEMBER_POSITIONS_LIST : ['Member']
    const EMPLOYEE_POSITIONS = Array.isArray(EMPLOYEE_POSITIONS_LIST) ? EMPLOYEE_POSITIONS_LIST : ['President', 'Vice President', 'Secretary', 'Treasurer']

    return (
      <>
        <div className="ss-cc-club-detail">
          <button type="button" className="ss-cc-back" onClick={() => setDirectorySelectedClubId(null)} aria-label="Back">
            ← {backLabel}
          </button>
          <header className="ss-cc-club-header">
            <div className="ss-cc-club-header-left">
              <div className="ss-cc-club-avatar-wrap">
                {clubEditImage ? (
                  <img src={URL.createObjectURL(clubEditImage)} alt="" className="ss-cc-club-avatar-img" />
                ) : selectedDirectoryClub.profileImageUrl ? (
                  <img src={selectedDirectoryClub.profileImageUrl} alt="" className="ss-cc-club-avatar-img" />
                ) : (
                  <span className={`ss-cc-club-icon-lg ss-cc-club-icon--${selectedDirectoryClub.iconColor}`}>{getClubIcon(selectedDirectoryClub.iconColor)}</span>
                )}
              </div>
              <h1 className="ss-cc-club-detail-title">{selectedDirectoryClub.name}</h1>
            </div>
          </header>
          <nav className="ss-cc-club-tabs">
            <button type="button" className={`ss-cc-club-tab ${directoryClubTab === 'members' ? 'ss-cc-club-tab--active' : ''}`} onClick={() => setDirectoryClubTab('members')}>Members</button>
            <button type="button" className={`ss-cc-club-tab ${directoryClubTab === 'employees' ? 'ss-cc-club-tab--active' : ''}`} onClick={() => setDirectoryClubTab('employees')}>Employees</button>
            <button type="button" className={`ss-cc-club-tab ${directoryClubTab === 'settings' ? 'ss-cc-club-tab--active' : ''}`} onClick={() => setDirectoryClubTab('settings')}>Settings</button>
          </nav>

          {directoryClubTab === 'members' && (
            <div className="club-admin-page ss-cc-club-panel">
              <header className="club-admin-header">
                <h1 className="club-admin-header-title">Members</h1>
                <div className="club-admin-header-search" style={{ flex: '1 1 280px', maxWidth: 360 }}>
                  <input type="text" placeholder="Search by name, email, or student ID..." value={clubMemberSearch} onChange={(e) => setClubMemberSearch(e.target.value)} aria-label="Search members" />
                </div>
              </header>
              <div className="club-admin-content">
                <p style={{ margin: '0 24px 20px', fontSize: 14, color: '#64748b' }}>Manage club members. Update position or remove a member.</p>
                <div className="club-admin-card" style={{ margin: '0 24px 24px' }}>
                  <table className="club-admin-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Student ID</th>
                        <th>Age</th>
                        <th>Position</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClubMembers.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <div className="club-admin-table-user">
                              <div className="club-admin-table-avatar" />
                              <div>
                                <div className="club-admin-table-name">{m.name} {m.surname}</div>
                                <a href={`mailto:${m.email}`} className="club-admin-table-email">{m.email}</a>
                              </div>
                            </div>
                          </td>
                          <td>{m.studentId ?? '—'}</td>
                          <td>{m.age != null ? m.age : '—'}</td>
                          <td>
                            <select
                              className="club-admin-select-inline"
                              value={m.position ?? ''}
                              onChange={(e) => setClubMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, position: e.target.value } : x)))}
                              aria-label={`Position for ${m.name} ${m.surname}`}
                            >
                              {MEMBER_POSITIONS.map((pos) => (
                                <option key={pos} value={pos}>{pos}</option>
                              ))}
                            </select>
                          </td>
                          <td>{m.joinedDate ?? '—'}</td>
                          <td>
                            <button type="button" className="club-admin-btn-icon club-admin-btn-icon--reject" aria-label="Remove member" onClick={() => setRemoveMemberId(m.id)}><IconTrash /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredClubMembers.length === 0 && <p className="club-admin-table-empty">No members found.</p>}
                </div>
              </div>
              {removeMemberId != null && (
                <div className="club-admin-popup-overlay" onClick={() => setRemoveMemberId(null)} role="dialog" aria-modal="true">
                  <div className="club-admin-popup club-admin-popup--sm" onClick={(e) => e.stopPropagation()}>
                    <div className="club-admin-popup-header">
                      <h2>Remove member</h2>
                      <button type="button" className="club-admin-popup-close" onClick={() => setRemoveMemberId(null)} aria-label="Close">×</button>
                    </div>
                    <div className="club-admin-popup-body"><p>Are you sure you want to remove this member from the club?</p></div>
                    <div className="club-admin-popup-footer">
                      <button type="button" className="club-admin-btn-secondary" onClick={() => setRemoveMemberId(null)}>Cancel</button>
                      <button type="button" className="club-admin-btn-danger" onClick={() => { setClubMembers((prev) => prev.filter((x) => x.id !== removeMemberId)); setRemoveMemberId(null) }}>Remove</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {directoryClubTab === 'employees' && (
            <div className="club-admin-page ss-cc-club-panel">
              <header className="club-admin-header">
                <h1 className="club-admin-header-title">Employees</h1>
                <div className="club-admin-header-search" style={{ flex: '1 1 280px', maxWidth: 360 }}>
                  <input type="text" placeholder="Search by name, email, or position..." value={clubEmployeeSearch} onChange={(e) => setClubEmployeeSearch(e.target.value)} aria-label="Search employees" />
                </div>
                <button type="button" className="club-admin-btn-primary" onClick={() => setAddEmployeeOpen(true)}>+ Add employee</button>
              </header>
              <div className="club-admin-content">
                <p style={{ margin: '0 24px 20px', fontSize: 14, color: '#64748b' }}>Manage club employees. Add without application: enter ID and position, then confirm.</p>
                <div className="club-admin-card" style={{ margin: '0 24px 24px' }}>
                  <table className="club-admin-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Age</th>
                        <th>Position</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClubEmployees.map((e) => {
                        const currentPosition = e.position ?? ''
                        const draftPosition = pendingEmployeePosition[e.id] ?? currentPosition
                        const hasPendingChange = pendingEmployeePosition[e.id] != null && pendingEmployeePosition[e.id] !== currentPosition
                        return (
                          <tr key={e.id}>
                            <td>
                              <div className="club-admin-table-user">
                                <div className="club-admin-table-avatar" />
                                <div>
                                  <div className="club-admin-table-name">{e.name} {e.surname}</div>
                                  <a href={`mailto:${e.email}`} className="club-admin-table-email">{e.email}</a>
                                </div>
                              </div>
                            </td>
                            <td>{e.age != null ? e.age : '—'}</td>
                            <td>
                              <select
                                className="club-admin-select-inline"
                                value={draftPosition}
                                onChange={(ev) => handleEmployeePositionChange(e.id, ev.target.value || null, currentPosition)}
                                aria-label={`Position for ${e.name} ${e.surname}`}
                              >
                                <option value="">—</option>
                                {EMPLOYEE_POSITIONS.map((pos) => (
                                  <option key={pos} value={pos}>{pos}</option>
                                ))}
                              </select>
                            </td>
                            <td>{e.joinedDate ?? '—'}</td>
                            <td>
                              <div className="club-admin-table-actions-wrap">
                                {hasPendingChange && (
                                  <button type="button" className="club-admin-btn-confirm-position" onClick={() => handleConfirmEmployeePosition(e.id)}>
                                    Confirm
                                  </button>
                                )}
                                <button type="button" className="club-admin-btn-icon club-admin-btn-icon--reject" aria-label="Remove employee" onClick={() => setRemoveEmployeeId(e.id)}><IconTrash /></button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {filteredClubEmployees.length === 0 && <p className="club-admin-table-empty">No employees found.</p>}
                </div>
              </div>
              {removeEmployeeId != null && (
                <div className="club-admin-popup-overlay" onClick={() => setRemoveEmployeeId(null)} role="dialog" aria-modal="true">
                  <div className="club-admin-popup club-admin-popup--sm" onClick={(ev) => ev.stopPropagation()}>
                    <div className="club-admin-popup-header">
                      <h2>Remove employee</h2>
                      <button type="button" className="club-admin-popup-close" onClick={() => setRemoveEmployeeId(null)} aria-label="Close">×</button>
                    </div>
                    <div className="club-admin-popup-body"><p>Are you sure you want to remove this employee from their role?</p></div>
                    <div className="club-admin-popup-footer">
                      <button type="button" className="club-admin-btn-secondary" onClick={() => setRemoveEmployeeId(null)}>Cancel</button>
                      <button type="button" className="club-admin-btn-danger" onClick={() => { setClubEmployees((prev) => prev.filter((x) => x.id !== removeEmployeeId)); setRemoveEmployeeId(null) }}>Remove</button>
                    </div>
                  </div>
                </div>
              )}
              {addEmployeeOpen && (
                <div className="club-admin-popup-overlay" onClick={() => setAddEmployeeOpen(false)} role="dialog" aria-modal="true" aria-labelledby="add-employee-title">
                  <div className="club-admin-popup" onClick={(e) => e.stopPropagation()}>
                    <div className="club-admin-popup-header">
                      <h2 id="add-employee-title">Add employee (no application)</h2>
                      <button type="button" className="club-admin-popup-close" onClick={() => setAddEmployeeOpen(false)} aria-label="Close">×</button>
                    </div>
                    <div className="club-admin-popup-body">
                      <div className="club-admin-field">
                        <label>Student ID</label>
                        <input type="text" placeholder="e.g. 20230123" value={addEmployeeId} onChange={(e) => setAddEmployeeId(e.target.value)} />
                      </div>
                      <div className="club-admin-field">
                        <label>Position</label>
                        <select value={addEmployeePosition} onChange={(e) => setAddEmployeePosition(e.target.value)}>
                          <option value="">Select position</option>
                          {EMPLOYEE_POSITIONS.map((pos) => (
                            <option key={pos} value={pos}>{pos}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="club-admin-popup-footer">
                      <button type="button" className="club-admin-btn-secondary" onClick={() => setAddEmployeeOpen(false)}>Cancel</button>
                      <button type="button" className="club-admin-btn-primary" onClick={handleAddEmployee} disabled={!addEmployeeId.trim() || !addEmployeePosition}>Confirm</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {directoryClubTab === 'settings' && (
            <div className="ss-cc-club-panel ss-cc-settings">
              <h2 className="ss-cc-settings-title">Edit club</h2>
              <div className="ss-cc-settings-form">
                <div className="club-admin-field">
                  <label>Club name</label>
                  <input type="text" value={clubEditName} onChange={(e) => setClubEditName(e.target.value)} placeholder="Club name" />
                </div>
                <div className="club-admin-field">
                  <label>Status</label>
                  <select value={clubEditStatus} onChange={(e) => setClubEditStatus(e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="On Probation">On Probation</option>
                  </select>
                </div>
                <div className="club-admin-field">
                  <label>Profile image</label>
                  <input type="file" accept="image/*" onChange={(e) => setClubEditImage(e.target.files?.[0] ?? null)} />
                  {clubEditImage && <span className="ss-cc-settings-filename">{clubEditImage.name}</span>}
                </div>
                <div className="ss-cc-settings-actions">
                  <button type="button" className="club-admin-btn-secondary" onClick={() => setDirectorySelectedClubId(null)}>Cancel</button>
                  <button type="button" className="club-admin-btn-primary" onClick={handleSaveClubSettings}>Save changes</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    )
  }

  const renderCommandCenter = () => {
    if (directorySelectedClubId && selectedDirectoryClub) {
      return renderCommandClubDetail()
    }
    return (
    <>
      <header className="ss-cc-header">
        <div>
          <h1 className="ss-cc-title">Master Directory</h1>
          <p className="ss-cc-subtitle">The central source of truth for all campus organizations, student-led activities, and approved programming.</p>
        </div>
        <button type="button" className="ss-cc-register-btn" onClick={() => navigate('/clubs/propose')}>
          <span className="ss-cc-register-icon"><IconPlusCircle /></span>
          Register New Club
        </button>
      </header>

      <section className="ss-cc-kpis">
        <div className="ss-cc-kpi">
          <span className={`ss-cc-kpi-icon ss-cc-kpi-icon--blue`}><IconStar /></span>
          <div className="ss-cc-kpi-label">Active Clubs</div>
          <div className="ss-cc-kpi-value">142</div>
          <div className="ss-cc-kpi-trend ss-cc-kpi-trend--up">↑ 3% vs last term</div>
        </div>
        <div className="ss-cc-kpi">
          <span className="ss-cc-kpi-icon ss-cc-kpi-icon--blue"><IconCalendar /></span>
          <div className="ss-cc-kpi-label">Upcoming Events</div>
          <div className="ss-cc-kpi-value">28</div>
          <div className="ss-cc-kpi-trend ss-cc-kpi-trend--up">↑ 12% this week</div>
        </div>
        <div className="ss-cc-kpi">
          <span className="ss-cc-kpi-icon ss-cc-kpi-icon--orange"><IconDoc /></span>
          <div className="ss-cc-kpi-label">Pending Proposals</div>
          <div className="ss-cc-kpi-value">15</div>
          <div className="ss-cc-kpi-trend ss-cc-kpi-trend--down">↓ 5% reduction</div>
        </div>
        <div className="ss-cc-kpi">
          <span className="ss-cc-kpi-icon ss-cc-kpi-icon--teal"><IconPeople /></span>
          <div className="ss-cc-kpi-label">Student Members</div>
          <div className="ss-cc-kpi-value">12,450</div>
          <div className="ss-cc-kpi-trend ss-cc-kpi-trend--up">↑ 8.2% annual growth</div>
        </div>
      </section>

      <div className="ss-cc-tabs-wrap">
        <div className="ss-cc-tabs">
          <button type="button" className={`ss-cc-tab ${commandTab === 'clubs' ? 'ss-cc-tab--active' : ''}`} onClick={() => setCommandTab('clubs')}>
            <IconPeople /> Active Clubs <span className="ss-cc-tab-count">142</span>
          </button>
          <button type="button" className={`ss-cc-tab ${commandTab === 'events' ? 'ss-cc-tab--active' : ''}`} onClick={() => setCommandTab('events')}>
            <IconCalendar /> Upcoming Events <span className="ss-cc-tab-count">28</span>
          </button>
        </div>
        <div className="ss-cc-toolbar">
          <span className="ss-cc-showing">Showing 1-10 of 142 clubs</span>
          <div className="ss-cc-toolbar-btns">
            <button type="button" className="ss-cc-filter-btn"><IconFilter /> Filter</button>
            <button type="button" className="ss-cc-filter-btn"><IconSort /> Sort</button>
          </div>
        </div>
      </div>

      <div className="ss-cc-card ss-cc-table-wrap">
        <table className="ss-cc-table">
          <thead>
            <tr>
              <th>CLUB NAME</th>
              <th>PRESIDENT</th>
              <th>MEMBERS</th>
              <th>CATEGORY</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody
            role="presentation"
            onClick={(e) => {
              const row = e.target.closest('tr[data-club-id]')
              if (row) {
                const id = row.getAttribute('data-club-id')
                if (id != null) setDirectorySelectedClubId(id)
              }
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              const row = e.target.closest('tr[data-club-id]')
              if (row) {
                const id = row.getAttribute('data-club-id')
                if (id != null) setDirectorySelectedClubId(id)
              }
            }}
          >
            {directoryClubs.map((c) => (
              <tr
                key={c.id}
                data-club-id={c.id}
                className="ss-cc-table-row-clickable"
                role="button"
                tabIndex={0}
              >
                <td>
                  <div className="ss-cc-club-cell">
                    <span className={`ss-cc-club-icon ss-cc-club-icon--${c.iconColor}`}>{getClubIcon(c.iconColor)}</span>
                    <div>
                      <span className="ss-cc-club-name">{c.name}</span>
                      <span className="ss-cc-club-established">Established {c.established}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div>
                    <span className="ss-cc-president-name">{c.president}</span>
                    <span className="ss-cc-president-id">ID: {c.presidentId}</span>
                  </div>
                </td>
                <td>{c.members}</td>
                <td><span className="ss-cc-pill">{c.category}</span></td>
                <td>
                  <span className={`ss-cc-status ss-cc-status--${c.status === 'Active' ? 'active' : 'probation'}`}>
                    <span className="ss-cc-status-dot" /> {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ss-cc-pagination">
          <button type="button" className="ss-cc-page-btn">Previous</button>
          <div className="ss-cc-page-nums">
            <button type="button" className="ss-cc-page-num ss-cc-page-num--active">1</button>
            <button type="button" className="ss-cc-page-num">2</button>
            <button type="button" className="ss-cc-page-num">3</button>
            <span className="ss-cc-page-ellipsis">...</span>
            <button type="button" className="ss-cc-page-num">15</button>
          </div>
          <button type="button" className="ss-cc-page-btn">Next</button>
        </div>
      </div>

      <section className="ss-cc-activity">
        <h2 className="ss-cc-activity-title">REAL-TIME ACTIVITY HUB</h2>
        <div className="ss-cc-activity-cards">
          {DIRECTORY_ACTIVITY.map((a) => (
            <div key={a.id} className="ss-cc-activity-card">
              <span className={`ss-cc-activity-icon ss-cc-activity-icon--${a.iconColor}`}>
                {a.icon === 'check' && <IconActivityCheck />}
                {a.icon === 'calendar' && <IconCalendar />}
                {a.icon === 'alert' && <IconActivityAlert />}
              </span>
              <div>
                <div className="ss-cc-activity-card-title">{a.title}</div>
                <div className="ss-cc-activity-card-detail">{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
  }

  const pendingProposals = clubProposals.filter((p) => p.status === 'pending_review')
  const underRevisionProposals = clubProposals.filter((p) => p.status === 'under_revision')
  const filterProposals = (list) => {
    if (!proposalSearch.trim()) return list
    const q = proposalSearch.trim().toLowerCase()
    return list.filter(
      (p) =>
        p.clubName.toLowerCase().includes(q) ||
        p.proposalId.toLowerCase().includes(q) ||
        p.submittedBy.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
    )
  }
  const selectedProposal = clubProposals.find((p) => p.id === selectedProposalId)

  const handleReject = () => {
    if (!rejectModal.reason.trim()) return
    const remaining = clubProposals.filter((p) => p.id !== selectedProposalId)
    setClubProposals(remaining)
    setSelectedProposalId(remaining[0]?.id ?? '')
    setRejectModal({ open: false, reason: '' })
  }

  const handleRequestRevision = () => {
    if (!revisionModal.changes.trim()) return
    setClubProposals((prev) =>
      prev.map((p) => (p.id === selectedProposalId ? { ...p, status: 'under_revision' } : p))
    )
    setRevisionModal({ open: false, changes: '' })
  }

  const handleApprove = () => {
    const remaining = clubProposals.filter((p) => p.id !== selectedProposalId)
    setClubProposals(remaining)
    setSelectedProposalId(remaining[0]?.id ?? '')
  }

  const filterEventProposals = (list) => {
    if (!eventSearch.trim()) return list
    const q = eventSearch.trim().toLowerCase()
    return list.filter(
      (e) =>
        e.eventTitle.toLowerCase().includes(q) ||
        e.proposalId.toLowerCase().includes(q) ||
        e.submittedBy.toLowerCase().includes(q) ||
        e.clubName.toLowerCase().includes(q)
    )
  }
  const selectedEvent = eventProposals.find((e) => e.id === selectedEventId)
  const pendingEventCount = eventProposals.length

  const handleEventReject = () => {
    if (!eventRejectModal.reason.trim()) return
    const remaining = eventProposals.filter((e) => e.id !== selectedEventId)
    setEventProposals(remaining)
    setSelectedEventId(remaining[0]?.id ?? '')
    setEventRejectModal({ open: false, reason: '' })
  }

  const handleEventRequestRevision = () => {
    if (!eventRevisionModal.changes.trim()) return
    setEventProposals((prev) =>
      prev.map((e) => (e.id === selectedEventId ? { ...e, status: 'UNDER REVISION' } : e))
    )
    setEventRevisionModal({ open: false, changes: '' })
  }

  const handleEventApprove = () => {
    const remaining = eventProposals.filter((e) => e.id !== selectedEventId)
    setEventProposals(remaining)
    setSelectedEventId(remaining[0]?.id ?? '')
  }

  useEffect(() => {
    const event = eventProposals.find((e) => e.id === selectedEventId)
    if (!event) {
      setEventRoomAssignments([])
      return
    }
    const b = event.requestedBuildingId || BUILDINGS[0]?.id
    const r = event.requestedRoomId || (ROOMS_BY_BUILDING[b] && ROOMS_BY_BUILDING[b][0]?.id)
    if (!event.subEvents || event.subEvents.length === 0) {
      setEventRoomAssignments([{ buildingId: b, roomId: r }])
    } else {
      setEventRoomAssignments(
        event.subEvents.map(() => ({ buildingId: b, roomId: r }))
      )
    }
  }, [selectedEventId, eventProposals])

  useEffect(() => {
    if (!directorySelectedClubId) return
    const club = directoryClubs.find((c) => c.id === directorySelectedClubId)
    if (club) {
      setClubEditName(club.name)
      setClubEditStatus(club.status)
    }
  }, [directorySelectedClubId, directoryClubs])

  const setEventRoomAssignmentAt = (index, buildingId, roomId) => {
    setEventRoomAssignments((prev) => {
      const next = [...prev]
      while (next.length <= index) next.push({ buildingId: BUILDINGS[0]?.id, roomId: ROOMS_BY_BUILDING[BUILDINGS[0]?.id]?.[0]?.id })
      const cur = next[index]
      next[index] = {
        buildingId: buildingId ?? cur.buildingId,
        roomId: roomId !== undefined ? roomId : cur.roomId,
      }
      if (buildingId && roomId === undefined) {
        const rooms = ROOMS_BY_BUILDING[buildingId]
        next[index].roomId = rooms?.[0]?.id ?? ''
      }
      return next
    })
  }

  const renderClubProposals = () => (
    <>
      <div className="ss-cp-wrap">
        <aside className="ss-cp-sidebar">
          <div className="ss-cp-search-wrap">
            <span className="ss-cp-search-icon"><IconSearch /></span>
            <input
              type="text"
              className="ss-cp-search"
              placeholder="Search proposals..."
              value={proposalSearch}
              onChange={(e) => setProposalSearch(e.target.value)}
              aria-label="Search proposals"
            />
          </div>
          <div className="ss-cp-list-requirements-wrap">
            <button type="button" className="ss-cp-btn ss-cp-btn--requirements" onClick={() => setRequirementsModalOpen(true)}>
              <IconCheck /> Requirements
            </button>
          </div>
          <div className="ss-cp-list">
            <div className="ss-cp-list-section">
              <div className="ss-cp-list-label">PENDING REVIEW</div>
              {filterProposals(pendingProposals).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`ss-cp-list-item ${selectedProposalId === p.id ? 'ss-cp-list-item--selected' : ''}`}
                  onClick={() => setSelectedProposalId(p.id)}
                >
                  {selectedProposalId === p.id && <span className="ss-cp-list-dot" aria-hidden />}
                  <div className="ss-cp-list-item-content">
                    <span className="ss-cp-list-item-title">{p.clubName}</span>
                    <span className="ss-cp-list-item-meta">Submitted: {p.submittedAt}</span>
                    {p.category && <span className="ss-cp-list-item-tag">{p.category}</span>}
                  </div>
                </button>
              ))}
            </div>
            <div className="ss-cp-list-section">
              <div className="ss-cp-list-label">UNDER REVISION</div>
              {filterProposals(underRevisionProposals).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`ss-cp-list-item ${selectedProposalId === p.id ? 'ss-cp-list-item--selected' : ''}`}
                  onClick={() => setSelectedProposalId(p.id)}
                >
                  {selectedProposalId === p.id && <span className="ss-cp-list-dot" aria-hidden />}
                  <div className="ss-cp-list-item-content">
                    <span className="ss-cp-list-item-title">{p.clubName}</span>
                    <span className="ss-cp-list-item-meta">Submitted: {p.submittedAt}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="ss-cp-main">
          {selectedProposal ? (
            <>
              <header className="ss-cp-detail-header">
                <div className="ss-cp-detail-header-left">
                  <span className="ss-cp-detail-icon"><IconLeaf /></span>
                  <div>
                    <h1 className="ss-cp-detail-title">{selectedProposal.clubName}</h1>
                    <p className="ss-cp-detail-meta">ID: {selectedProposal.proposalId} • Submitted by {selectedProposal.submittedBy}</p>
                  </div>
                </div>
                <div className="ss-cp-detail-actions">
                  <button type="button" className="ss-cp-btn ss-cp-btn--reject" onClick={() => setRejectModal({ open: true, reason: '' })}>
                    Reject
                  </button>
                  <button type="button" className="ss-cp-btn ss-cp-btn--revision" onClick={() => setRevisionModal({ open: true, changes: '' })}>
                    Request Revision
                  </button>
                  <button type="button" className="ss-cp-btn ss-cp-btn--approve" onClick={handleApprove}>
                    Approve Proposal
                  </button>
                  <button type="button" className="ss-cp-btn ss-cp-btn--icon" aria-label="Notifications"><IconBell /></button>
                  <div className="ss-cp-avatar" aria-label="Profile" />
                </div>
              </header>

              <div className="ss-cp-detail-card">
                <section className="ss-cp-section">
                  <h2 className="ss-cp-section-title"><IconInfo /> CLUB FUNDAMENTALS</h2>
                  <div className="ss-cp-field">
                    <span className="ss-cp-field-label">PROPOSED NAME</span>
                    <p className="ss-cp-field-value">{selectedProposal.clubName}{selectedProposal.shortName ? ` (${selectedProposal.shortName})` : ''}</p>
                  </div>
                  <div className="ss-cp-field">
                    <span className="ss-cp-field-label">DESCRIPTION</span>
                    <p className="ss-cp-field-value">{selectedProposal.shortDesc}</p>
                  </div>
                  <div className="ss-cp-field">
                    <span className="ss-cp-field-label">UNIQUENESS</span>
                    <p className="ss-cp-field-value">{selectedProposal.uniqueDesc}</p>
                  </div>
                  <div className="ss-cp-field">
                    <span className="ss-cp-field-label">PRIMARY GOALS</span>
                    <ul className="ss-cp-goals-list">
                      {selectedProposal.goals.split('\n').filter(Boolean).map((goal, i) => (
                        <li key={i}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                  {selectedProposal.activities && (
                    <div className="ss-cp-field">
                      <span className="ss-cp-field-label">PROPOSED ACTIVITIES</span>
                      <p className="ss-cp-field-value">{selectedProposal.activities}</p>
                    </div>
                  )}
                </section>

                <section className="ss-cp-section">
                  <h2 className="ss-cp-section-title"><IconPeople /> PRIMARY OFFICERS</h2>
                  <ul className="ss-cp-officers-list">
                    {selectedProposal.primaryOfficers.map((o, i) => (
                      <li key={i}>
                        <span className="ss-cp-officer-role">{o.role}:</span>
                        <span className="ss-cp-officer-id">{o.studentId}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="ss-cp-section">
                  <h2 className="ss-cp-section-title"><IconPeopleTwo /> OTHER CORE MEMBERS</h2>
                  <table className="ss-cp-table">
                    <thead>
                      <tr>
                        <th>STUDENT ID</th>
                        <th>PROPOSED POSITION</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProposal.otherMembers.map((m, i) => (
                        <tr key={i}>
                          <td>{m.studentId}</td>
                          <td>{m.position}</td>
                          <td>
                            <span className={`ss-cp-pill ss-cp-pill--${m.status === 'Verified' ? 'success' : 'warning'}`}>
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section className="ss-cp-section">
                  <h2 className="ss-cp-section-title"><IconEye /> ALIGNMENT & VISION</h2>
                  <div className="ss-cp-field">
                    <span className="ss-cp-field-label">Alignment with university mission</span>
                    <p className="ss-cp-field-value">{selectedProposal.alignment}</p>
                  </div>
                  <div className="ss-cp-field">
                    <span className="ss-cp-field-label">Long-term vision</span>
                    <p className="ss-cp-field-value">{selectedProposal.vision}</p>
                  </div>
                </section>

                {selectedProposal.constitutionDoc && (
                  <section className="ss-cp-section">
                    <h2 className="ss-cp-section-title">Required documents</h2>
                    <div className="ss-cp-doc-row">
                      <div className="ss-cp-doc-icon" />
                      <div className="ss-cp-doc-body">
                        <div className="ss-cp-doc-name">{selectedProposal.constitutionDoc.name}</div>
                        <div className="ss-cp-doc-meta">{selectedProposal.constitutionDoc.uploadedAt} • {selectedProposal.constitutionDoc.size}</div>
                      </div>
                      <button type="button" className="ss-cp-btn ss-cp-btn--ghost">View</button>
                    </div>
                  </section>
                )}
              </div>
            </>
          ) : (
            <div className="ss-cp-empty">
              <p>Select a proposal from the list or no proposals match your search.</p>
            </div>
          )}
        </main>
      </div>

      {/* Reject modal: reason required, then confirm */}
      {rejectModal.open && (
        <div className="ss-cp-modal-overlay" onClick={() => setRejectModal({ open: false, reason: rejectModal.reason })} role="dialog" aria-modal="true" aria-labelledby="reject-modal-title">
          <div className="ss-cp-modal" onClick={(e) => e.stopPropagation()}>
            <h2 id="reject-modal-title" className="ss-cp-modal-title">Reject proposal</h2>
            <p className="ss-cp-modal-desc">Please provide a reason for rejection. The applicant will receive this feedback.</p>
            <label className="ss-cp-modal-label">
              Reason for rejection <span className="ss-cp-required">*</span>
            </label>
            <textarea
              className="ss-cp-modal-textarea"
              value={rejectModal.reason}
              onChange={(e) => setRejectModal((m) => ({ ...m, reason: e.target.value }))}
              placeholder="Explain why this proposal is being rejected..."
              rows={4}
              required
            />
            <div className="ss-cp-modal-actions">
              <button type="button" className="ss-cp-btn ss-cp-btn--secondary" onClick={() => setRejectModal({ open: false, reason: '' })}>Cancel</button>
              <button type="button" className="ss-cp-btn ss-cp-btn--reject" onClick={handleReject} disabled={!rejectModal.reason.trim()}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Revision modal: require necessary changes */}
      {revisionModal.open && (
        <div className="ss-cp-modal-overlay" onClick={() => setRevisionModal({ open: false, changes: revisionModal.changes })} role="dialog" aria-modal="true" aria-labelledby="revision-modal-title">
          <div className="ss-cp-modal" onClick={(e) => e.stopPropagation()}>
            <h2 id="revision-modal-title" className="ss-cp-modal-title">Request revision</h2>
            <p className="ss-cp-modal-desc">List all necessary changes the applicant must make. They will receive this feedback and can resubmit after making updates.</p>
            <label className="ss-cp-modal-label">
              Necessary changes <span className="ss-cp-required">*</span>
            </label>
            <textarea
              className="ss-cp-modal-textarea"
              value={revisionModal.changes}
              onChange={(e) => setRevisionModal((m) => ({ ...m, changes: e.target.value }))}
              placeholder="e.g. 1. Clarify uniqueness vs. Eco-Club&#10;2. Add faculty advisor signature to constitution&#10;3. Update treasurer student ID..."
              rows={6}
              required
            />
            <div className="ss-cp-modal-actions">
              <button type="button" className="ss-cp-btn ss-cp-btn--secondary" onClick={() => setRevisionModal({ open: false, changes: '' })}>Cancel</button>
              <button type="button" className="ss-cp-btn ss-cp-btn--revision" onClick={handleRequestRevision} disabled={!revisionModal.changes.trim()}>
                Submit revision request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Club Proposal Requirements modal */}
      {requirementsModalOpen && (
        <div className="ss-cp-modal-overlay" onClick={() => setRequirementsModalOpen(false)} role="dialog" aria-modal="true" aria-labelledby="requirements-modal-title">
          <div className="ss-cp-modal ss-cp-modal--requirements" onClick={(e) => e.stopPropagation()}>
            <div className="ss-cp-req-header">
              <div>
                <h2 id="requirements-modal-title" className="ss-cp-req-title">Club Proposal Requirements</h2>
                <p className="ss-cp-req-subtitle">Configure mandatory criteria for new student organization applications.</p>
              </div>
              <button type="button" className="ss-cp-req-close" onClick={() => setRequirementsModalOpen(false)} aria-label="Close">
                <IconCloseX />
              </button>
            </div>
            <div className="ss-cp-req-body">
              <div className="ss-cp-req-cards">
                {requirementsList.map((text, i) => {
                  const isEditing = editingRequirementIndex === i
                  return (
                    <div key={i} className="ss-cp-req-card">
                      <span className="ss-cp-req-card-icon"><IconDoc /></span>
                      {isEditing ? (
                        <input
                          type="text"
                          className="ss-cp-req-card-input"
                          value={editingRequirementDraft}
                          onChange={(e) => setEditingRequirementDraft(e.target.value)}
                          aria-label={`Edit requirement ${i + 1}`}
                          autoFocus
                        />
                      ) : (
                        <span className="ss-cp-req-card-text">{text}</span>
                      )}
                      <div className="ss-cp-req-card-actions">
                        {isEditing ? (
                          <button
                            type="button"
                            className="ss-cp-req-card-confirm"
                            onClick={() => {
                              const trimmed = editingRequirementDraft.trim()
                              if (trimmed) {
                                setRequirementsList((prev) => prev.map((item, j) => (j === i ? trimmed : item)))
                              }
                              setEditingRequirementIndex(null)
                              setEditingRequirementDraft('')
                            }}
                            aria-label="Confirm edit"
                          >
                            <IconConfirm />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="ss-cp-req-card-edit"
                            onClick={() => {
                              setEditingRequirementIndex(i)
                              setEditingRequirementDraft(text)
                            }}
                            aria-label="Edit requirement"
                          >
                            <IconPen />
                          </button>
                        )}
                        <button
                          type="button"
                          className="ss-cp-req-card-delete"
                          onClick={() => {
                            setRequirementsList((prev) => prev.filter((_, j) => j !== i))
                            if (editingRequirementIndex === i) {
                              setEditingRequirementIndex(null)
                              setEditingRequirementDraft('')
                            } else if (editingRequirementIndex !== null && editingRequirementIndex > i) {
                              setEditingRequirementIndex(editingRequirementIndex - 1)
                            }
                          }}
                          aria-label="Delete requirement"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="ss-cp-req-deadline">
                <label className="ss-cp-req-label">Submission deadline</label>
                <input
                  type="date"
                  className="ss-cp-req-input"
                  value={requirementsDeadline}
                  onChange={(e) => setRequirementsDeadline(e.target.value)}
                  aria-label="Set deadline for club proposal submissions"
                />
              </div>
              <div className="ss-cp-req-add-wrap">
                <span className="ss-cp-req-add-icon"><IconGrid /></span>
                <input
                  type="text"
                  className="ss-cp-req-add-input"
                  placeholder="Type a new requirement..."
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  aria-label="New requirement"
                />
              </div>
            </div>
            <div className="ss-cp-req-footer">
              <span className="ss-cp-req-autosave">Auto-save enabled</span>
              <div className="ss-cp-req-footer-buttons">
                <button type="button" className="ss-cp-btn ss-cp-btn--secondary" onClick={() => setRequirementsModalOpen(false)}>Close</button>
                <button
                  type="button"
                  className="ss-cp-btn ss-cp-btn--approve"
                  onClick={() => {
                    if (newRequirement.trim()) {
                      setRequirementsList((prev) => [...prev, newRequirement.trim()])
                      setNewRequirement('')
                    }
                  }}
                  disabled={!newRequirement.trim()}
                >
                  <IconPlus /> Add Requirement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )

  const renderEventApprovals = () => (
    <>
      <div className="ss-eap-wrap">
        <aside className="ss-eap-sidebar">
          <div className="ss-eap-sidebar-top">
            <h2 className="ss-eap-pending-title">Pending Proposals</h2>
            <span className="ss-eap-pending-badge">{pendingEventCount}</span>
          </div>
          <div className="ss-eap-search-wrap">
            <span className="ss-eap-search-icon"><IconSearch /></span>
            <input
              type="text"
              className="ss-eap-search"
              placeholder="Search proposals..."
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              aria-label="Search event proposals"
            />
          </div>
          <div className="ss-eap-list">
            {filterEventProposals(eventProposals).map((e) => (
              <button
                key={e.id}
                type="button"
                className={`ss-eap-list-item ${selectedEventId === e.id ? 'ss-eap-list-item--selected' : ''}`}
                onClick={() => setSelectedEventId(e.id)}
              >
                <div className="ss-eap-list-item-content">
                  <span className="ss-eap-list-id">#{e.proposalId}</span>
                  <span className="ss-eap-list-title">{e.eventTitle}</span>
                  <span className="ss-eap-list-meta">{(e.eventDateShort || e.dateTime)} • {e.clubName}</span>
                  <span className="ss-eap-list-ago">{e.submittedAgo}</span>
                  <span className={`ss-eap-pill ss-eap-pill--${e.status === 'URGENT' ? 'urgent' : e.status === 'REVIEWING' || e.status === 'NEW' ? 'muted' : 'warning'}`}>
                    {e.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="ss-eap-main">
          {selectedEvent ? (
            <>
              <header className="ss-eap-detail-header">
                <p className="ss-eap-proposal-meta">PROPOSAL #{selectedEvent.proposalId} Submitted on {selectedEvent.submittedOn} by {selectedEvent.submittedBy}</p>
                <h1 className="ss-eap-detail-title">{selectedEvent.eventTitle}</h1>
                <div className="ss-eap-detail-actions">
                  <button type="button" className="ss-eap-btn ss-eap-btn--reject" onClick={() => setEventRejectModal({ open: true, reason: '' })}>
                    Reject
                  </button>
                  <button type="button" className="ss-eap-btn ss-eap-btn--revision" onClick={() => setEventRevisionModal({ open: true, changes: '' })}>
                    Request Revision
                  </button>
                  <button type="button" className="ss-eap-btn ss-eap-btn--approve" onClick={handleEventApprove}>
                    Approve Proposal
                  </button>
                  <button type="button" className="ss-eap-btn ss-eap-btn--icon" aria-label="Notifications"><IconBell /></button>
                  <div className="ss-eap-avatar" aria-label="Profile" />
                </div>
              </header>

              <div className="ss-eap-detail-card">
                <section className="ss-eap-section">
                  <h2 className="ss-eap-section-title"><IconInfo /> EVENT BASICS</h2>
                  <div className="ss-eap-grid">
                    <div className="ss-eap-field">
                      <span className="ss-eap-field-label">DATE &amp; TIME</span>
                      <p className="ss-eap-field-value">{selectedEvent.dateTime}</p>
                      <p className="ss-eap-field-value">{selectedEvent.timeRange}</p>
                    </div>
                    <div className="ss-eap-field">
                      <span className="ss-eap-field-label">DURATION</span>
                      <p className="ss-eap-field-value">{selectedEvent.duration}</p>
                      <p className="ss-eap-field-muted">{selectedEvent.durationLabel}</p>
                    </div>
                    <div className="ss-eap-field">
                      <span className="ss-eap-field-label">EXPECTED ATTENDANCE</span>
                      <p className="ss-eap-field-value">{selectedEvent.attendance}</p>
                      <p className="ss-eap-field-muted">{selectedEvent.attendanceNote}</p>
                    </div>
                    <div className="ss-eap-field">
                      <span className="ss-eap-field-label">PRIMARY VENUE</span>
                      <p className="ss-eap-field-value">{selectedEvent.venue}</p>
                      <p className="ss-eap-field-muted">{selectedEvent.venueRoom}</p>
                    </div>
                  </div>
                  {selectedEvent.posterPlaceholder && (
                    <div className="ss-eap-field">
                      <span className="ss-eap-field-label">EVENT POSTER</span>
                      <div className="ss-eap-poster">Event poster</div>
                    </div>
                  )}
                </section>

                <section className="ss-eap-section">
                  <h2 className="ss-eap-section-title"><IconDoc /> EVENT CONTENT</h2>
                  <div className="ss-eap-field">
                    <span className="ss-eap-field-label">Detailed Description</span>
                    <p className="ss-eap-field-value ss-eap-field-value--block">{selectedEvent.description}</p>
                  </div>
                  <div className="ss-eap-field">
                    <span className="ss-eap-field-label">Purpose and Goals</span>
                    <ul className="ss-eap-goals-list">
                      {selectedEvent.objectives.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                </section>

                {selectedEvent.subEvents && selectedEvent.subEvents.length > 0 && (
                  <section className="ss-eap-section">
                    <h2 className="ss-eap-section-title"><IconCalendar /> SUB-EVENTS SCHEDULE</h2>
                    <table className="ss-eap-table">
                      <thead>
                        <tr>
                          <th>TITLE</th>
                          <th>CAPACITY</th>
                          <th>TIME RANGE</th>
                          <th>VENUE NOTES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEvent.subEvents.map((se, i) => (
                          <tr key={i}>
                            <td>{se.title}</td>
                            <td>{se.capacity}</td>
                            <td>{se.timeRange}</td>
                            <td>{se.venueNotes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                )}

                <section className="ss-eap-section">
                  <h2 className="ss-eap-section-title">Assign room(s)</h2>
                  {(() => {
                    const hasSubEvents = selectedEvent.subEvents && selectedEvent.subEvents.length > 0
                    const slotCount = hasSubEvents ? selectedEvent.subEvents.length : 1
                    const defaults = { buildingId: selectedEvent.requestedBuildingId || BUILDINGS[0]?.id, roomId: selectedEvent.requestedRoomId || (ROOMS_BY_BUILDING[selectedEvent.requestedBuildingId]?.[0]?.id) || ROOMS_BY_BUILDING[BUILDINGS[0]?.id]?.[0]?.id }
                    return (
                      <div className="ss-eap-assign-rooms">
                        {Array.from({ length: slotCount }, (_, i) => {
                          const a = eventRoomAssignments[i] || defaults
                          const rooms = ROOMS_BY_BUILDING[a.buildingId] || []
                          const label = hasSubEvents ? selectedEvent.subEvents[i].title : 'Room for entire event'
                          return (
                            <div key={i} className="ss-eap-assign-row">
                              <span className="ss-eap-assign-label">{label}</span>
                              <div className="ss-eap-assign-dropdowns">
                                <select
                                  className="ss-eap-select"
                                  value={a.buildingId}
                                  onChange={(e) => setEventRoomAssignmentAt(i, e.target.value, undefined)}
                                  aria-label={`Building for ${label}`}
                                >
                                  {BUILDINGS.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                  ))}
                                </select>
                                <select
                                  className="ss-eap-select"
                                  value={a.roomId}
                                  onChange={(e) => setEventRoomAssignmentAt(i, a.buildingId, e.target.value)}
                                  aria-label={`Room for ${label}`}
                                >
                                  {rooms.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </section>
              </div>
            </>
          ) : (
            <div className="ss-eap-empty">Select a proposal from the list or no proposals match your search.</div>
          )}
        </main>
      </div>

      {/* Event Reject modal */}
      {eventRejectModal.open && (
        <div className="ss-cp-modal-overlay" onClick={() => setEventRejectModal({ open: false, reason: eventRejectModal.reason })} role="dialog" aria-modal="true" aria-labelledby="event-reject-modal-title">
          <div className="ss-cp-modal" onClick={(e) => e.stopPropagation()}>
            <h2 id="event-reject-modal-title" className="ss-cp-modal-title">Reject event proposal</h2>
            <p className="ss-cp-modal-desc">Please provide a reason for rejection. The club will receive this feedback.</p>
            <label className="ss-cp-modal-label">Reason for rejection <span className="ss-cp-required">*</span></label>
            <textarea
              className="ss-cp-modal-textarea"
              value={eventRejectModal.reason}
              onChange={(e) => setEventRejectModal((m) => ({ ...m, reason: e.target.value }))}
              placeholder="Explain why this event proposal is being rejected..."
              rows={4}
            />
            <div className="ss-cp-modal-actions">
              <button type="button" className="ss-cp-btn ss-cp-btn--secondary" onClick={() => setEventRejectModal({ open: false, reason: '' })}>Cancel</button>
              <button type="button" className="ss-cp-btn ss-cp-btn--reject" onClick={handleEventReject} disabled={!eventRejectModal.reason.trim()}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Event Request Revision modal */}
      {eventRevisionModal.open && (
        <div className="ss-cp-modal-overlay" onClick={() => setEventRevisionModal({ open: false, changes: eventRevisionModal.changes })} role="dialog" aria-modal="true" aria-labelledby="event-revision-modal-title">
          <div className="ss-cp-modal" onClick={(e) => e.stopPropagation()}>
            <h2 id="event-revision-modal-title" className="ss-cp-modal-title">Request revision</h2>
            <p className="ss-cp-modal-desc">List all necessary changes the club must make. They will receive this feedback and can resubmit after updates.</p>
            <label className="ss-cp-modal-label">Necessary changes <span className="ss-cp-required">*</span></label>
            <textarea
              className="ss-cp-modal-textarea"
              value={eventRevisionModal.changes}
              onChange={(e) => setEventRevisionModal((m) => ({ ...m, changes: e.target.value }))}
              placeholder="e.g. 1. Adjust time range for keynote&#10;2. Provide updated poster&#10;3. Confirm venue availability..."
              rows={6}
            />
            <div className="ss-cp-modal-actions">
              <button type="button" className="ss-cp-btn ss-cp-btn--secondary" onClick={() => setEventRevisionModal({ open: false, changes: '' })}>Cancel</button>
              <button type="button" className="ss-cp-btn ss-cp-btn--revision" onClick={handleEventRequestRevision} disabled={!eventRevisionModal.changes.trim()}>Submit revision request</button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  const renderClubsSection = () => {
    if (directorySelectedClubId && selectedDirectoryClub) {
      return renderCommandClubDetail('Back to Clubs')
    }
    return (
      <>
        {renderHeader('Clubs', 'View approved campus clubs. Click a club to manage members, employees, and settings.')}
        <div className="ss-card" style={{ marginTop: 20 }}>
          <h2>Approved Clubs</h2>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748b' }}>Click a club row to open its detail page (members, employees, settings).</p>
          <div className="ss-cc-table-wrap" style={{ marginBottom: 0 }}>
            <table className="ss-cc-table">
              <thead>
                <tr>
                  <th>CLUB NAME</th>
                  <th>PRESIDENT</th>
                  <th>MEMBERS</th>
                  <th>CATEGORY</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody
                role="presentation"
                onClick={(e) => {
                  const row = e.target.closest('tr[data-club-id]')
                  if (row) {
                    const id = row.getAttribute('data-club-id')
                    if (id != null) setDirectorySelectedClubId(id)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  const row = e.target.closest('tr[data-club-id]')
                  if (row) {
                    const id = row.getAttribute('data-club-id')
                    if (id != null) setDirectorySelectedClubId(id)
                  }
                }}
              >
                {directoryClubs.map((c) => (
                  <tr
                    key={c.id}
                    data-club-id={c.id}
                    className="ss-cc-table-row-clickable"
                    role="button"
                    tabIndex={0}
                  >
                    <td>
                      <div className="ss-cc-club-cell">
                        <span className={`ss-cc-club-icon ss-cc-club-icon--${c.iconColor}`}>{getClubIcon(c.iconColor)}</span>
                        <div>
                          <span className="ss-cc-club-name">{c.name}</span>
                          <span className="ss-cc-club-established">Established {c.established}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className="ss-cc-president-name">{c.president}</span>
                        <span className="ss-cc-president-id">ID: {c.presidentId}</span>
                      </div>
                    </td>
                    <td>{c.members}</td>
                    <td><span className="ss-cc-pill">{c.category}</span></td>
                    <td>
                      <span className={`ss-cc-status ss-cc-status--${c.status === 'Active' ? 'active' : 'probation'}`}>
                        <span className="ss-cc-status-dot" /> {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )
  }

  const renderEventsSection = () => {
    if (editingApprovedEvent) {
      const isUpcoming = !editingApprovedEvent.date || editingApprovedEvent.date >= todayIso
      return (
        <>
          {renderHeader('Events', 'Review and update approved club events.')}
          <div className="ss-card" style={{ marginTop: 20 }}>
            <h2>Edit Event</h2>
            {!isUpcoming && (
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#b91c1c' }}>
                This event is in the past. Edits here will only update the record for reporting.
              </p>
            )}
            <form onSubmit={confirmEditApprovedEvent}>
              <div className="club-admin-form-row">
                <div className="club-admin-field">
                  <label>Event name</label>
                  <input
                    type="text"
                    value={editEventTitle}
                    onChange={(ev) => setEditEventTitle(ev.target.value)}
                    placeholder="Event title"
                  />
                </div>
                <div className="club-admin-field">
                  <label>Club</label>
                  <input type="text" value={editingApprovedEvent.club} disabled />
                </div>
              </div>

              <div className="club-admin-form-row">
                <div className="club-admin-field">
                  <label>Date</label>
                  <input
                    type="date"
                    value={editEventDate}
                    onChange={(ev) => setEditEventDate(ev.target.value)}
                  />
                </div>
                <div className="club-admin-field">
                  <label>Building</label>
                  <select
                    value={editEventBuilding}
                    onChange={(ev) => {
                      setEditEventBuilding(ev.target.value)
                      setEditEventRoom('')
                    }}
                  >
                    <option value="">Select building</option>
                    {Object.keys(SUB_EVENT_LOCATIONS).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="club-admin-field">
                  <label>Room</label>
                  <select
                    value={editEventRoom}
                    onChange={(ev) => setEditEventRoom(ev.target.value)}
                    disabled={!editEventBuilding}
                  >
                    <option value="">{editEventBuilding ? 'Select room' : 'Select building first'}</option>
                    {editEventBuilding &&
                      (SUB_EVENT_LOCATIONS[editEventBuilding] || []).map((room) => (
                        <option key={room} value={room}>{room}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="club-admin-form-row">
                <div className="club-admin-field">
                  <label>Duration (hours)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editEventDuration}
                    onChange={(ev) => setEditEventDuration(ev.target.value)}
                    placeholder="e.g. 2"
                  />
                </div>
                <div className="club-admin-field">
                  <label>Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={editEventCapacity}
                    onChange={(ev) => setEditEventCapacity(ev.target.value)}
                    placeholder="e.g. 200"
                  />
                </div>
              </div>

              <div className="club-admin-field">
                <label>Description</label>
                <textarea
                  value={editEventDescription}
                  onChange={(ev) => setEditEventDescription(ev.target.value)}
                  rows={4}
                  placeholder="Short description of the event..."
                />
              </div>

              <div className="club-admin-field">
                <label>Sub-events</label>
                <div className="club-admin-field">
                  <label style={{ fontSize: 12 }}>Date (optional)</label>
                  <input
                    type="date"
                    value={editSubDate}
                    onChange={(ev) => {
                      setEditSubDate(ev.target.value)
                      if (editSubError) setEditSubError('')
                    }}
                  />
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    If left empty, the sub-event will use the main event&apos;s date.
                  </div>
                </div>
                <div className="club-admin-form-row" style={{ marginTop: 8 }}>
                  <div className="club-admin-field">
                    <label style={{ fontSize: 12 }}>Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Opening remarks"
                      value={editSubTitle}
                      onChange={(ev) => {
                        setEditSubTitle(ev.target.value)
                        if (editSubError) setEditSubError('')
                      }}
                    />
                  </div>
                  <div className="club-admin-field">
                    <label style={{ fontSize: 12 }}>Capacity</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 100"
                      value={editSubCapacity}
                      onChange={(ev) => {
                        setEditSubCapacity(ev.target.value)
                        if (editSubError) setEditSubError('')
                      }}
                    />
                  </div>
                </div>
                <div className="club-admin-form-row" style={{ marginTop: 8 }}>
                  <div className="club-admin-field">
                    <label style={{ fontSize: 12 }}>Building</label>
                    <select
                      value={editSubBuilding}
                      onChange={(ev) => {
                        setEditSubBuilding(ev.target.value)
                        setEditSubRoom('')
                        if (editSubError) setEditSubError('')
                      }}
                    >
                      <option value="">Select building</option>
                      {Object.keys(SUB_EVENT_LOCATIONS).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="club-admin-field">
                    <label style={{ fontSize: 12 }}>Room</label>
                    <select
                      value={editSubRoom}
                      onChange={(ev) => {
                        setEditSubRoom(ev.target.value)
                        if (editSubError) setEditSubError('')
                      }}
                      disabled={!editSubBuilding}
                    >
                      <option value="">{editSubBuilding ? 'Select room' : 'Select building first'}</option>
                      {editSubBuilding &&
                        (SUB_EVENT_LOCATIONS[editSubBuilding] || []).map((room) => (
                          <option key={room} value={room}>{room}</option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="club-admin-form-row" style={{ marginTop: 8 }}>
                  <div className="club-admin-field">
                    <label style={{ fontSize: 12 }}>Start time</label>
                    <input
                      type="time"
                      value={editSubStart}
                      onChange={(ev) => {
                        setEditSubStart(ev.target.value)
                        if (editSubError) setEditSubError('')
                      }}
                    />
                  </div>
                  <div className="club-admin-field">
                    <label style={{ fontSize: 12 }}>End time</label>
                    <input
                      type="time"
                      value={editSubEnd}
                      onChange={(ev) => {
                        setEditSubEnd(ev.target.value)
                        if (editSubError) setEditSubError('')
                      }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="club-admin-btn-primary"
                  style={{ marginTop: 10 }}
                  onClick={addEditSubEvent}
                >
                  + Add sub-event
                </button>
                {editSubError && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#b91c1c' }}>
                    {editSubError}
                  </div>
                )}
                {editSubEvents.length > 0 && (
                  <table className="club-admin-table" style={{ marginTop: 12 }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Capacity</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Building</th>
                        <th>Room</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editSubEvents.map((se, index) => (
                        <tr key={`${se.title}-${index}`}>
                          <td>{se.date}</td>
                          <td>{se.title}</td>
                          <td>{se.capacity}</td>
                          <td>{se.start}</td>
                          <td>{se.end}</td>
                          <td>{se.building || '—'}</td>
                          <td>{se.room || '—'}</td>
                          <td>
                            <button
                              type="button"
                              className="club-admin-btn-icon"
                              onClick={() => removeEditSubEvent(index)}
                              aria-label="Remove sub-event"
                            >
                              <IconTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="club-admin-btn-secondary" onClick={cancelEditApprovedEvent}>
                  Cancel
                </button>
                <button type="submit" className="club-admin-btn-primary">
                  <IconConfirm /> Confirm changes
                </button>
              </div>
            </form>
          </div>
        </>
      )
    }

    return (
      <>
        {renderHeader('Events', 'View and manage approved club events across campus.')}
        <div className="ss-card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h2 style={{ margin: 0 }}>Events</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                Upcoming and past events that have been approved.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'inline-flex', borderRadius: 999, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <button
                  type="button"
                  className="club-admin-chip-btn"
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    background: eventsFilterStatus === 'upcoming' ? '#16a34a' : 'transparent',
                    color: eventsFilterStatus === 'upcoming' ? '#f0fdf4' : '#64748b',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => setEventsFilterStatus('upcoming')}
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  className="club-admin-chip-btn"
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    background: eventsFilterStatus === 'past' ? '#e11d48' : 'transparent',
                    color: eventsFilterStatus === 'past' ? '#fef2f2' : '#64748b',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => setEventsFilterStatus('past')}
                >
                  Past
                </button>
                <button
                  type="button"
                  className="club-admin-chip-btn"
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    background: eventsFilterStatus === 'all' ? '#0f172a' : 'transparent',
                    color: eventsFilterStatus === 'all' ? '#f8fafc' : '#64748b',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => setEventsFilterStatus('all')}
                >
                  All
                </button>
              </div>
              <div className="club-admin-header-search" style={{ maxWidth: 260 }}>
                <IconSearch />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={eventsSearch}
                  onChange={(ev) => setEventsSearch(ev.target.value)}
                  aria-label="Search approved events"
                />
              </div>
            </div>
          </div>

          <ul className="ss-events-list">
            {filteredApprovedEvents.map((ev) => {
              const isUpcoming = !ev.date || ev.date >= todayIso
              return (
                <li key={ev.id} className="ss-events-list-item">
                  <div className="ss-events-list-item-main">
                    <span className="ss-events-list-item-title">{ev.title}</span>
                    <span className="ss-events-list-item-meta">
                      {ev.date} · {ev.club} · {ev.venue}
                      {typeof ev.capacity !== 'undefined' && ` · Cap: ${ev.capacity}`}
                    </span>
                  </div>
                  <div className="ss-events-list-item-actions">
                    <span
                      className={`ss-pill ${
                        isUpcoming ? 'ss-pill--success' : 'ss-pill--muted'
                      }`}
                    >
                      {isUpcoming ? 'Upcoming' : 'Past'}
                    </span>
                    {isUpcoming && (
                      <button
                        type="button"
                        className="club-admin-btn-secondary"
                        style={{ padding: '6px 10px', fontSize: 12 }}
                        onClick={() => startEditApprovedEvent(ev)}
                      >
                        <IconPen /> Edit
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
            {filteredApprovedEvents.length === 0 && (
              <li className="ss-events-list-item">
                <span style={{ fontSize: 14, color: '#64748b' }}>No events found for this filter.</span>
              </li>
            )}
          </ul>
        </div>
      </>
    )
  }

  const renderStaffManagement = () => (
    <>
      {renderHeader('Club Ecosystem & Staff Manager', 'View active clubs, advisors, and officer rosters.')}
      <div className="ss-main-grid ss-main-grid--staff">
        <section className="ss-column-left">
          <div className="ss-card">
            <h2>Clubs Overview</h2>
            <section className="ss-kpis ss-kpis--mini">
              <div className="ss-kpi">
                <div className="ss-kpi-label">Active Clubs</div>
                <div className="ss-kpi-value">142</div>
              </div>
              <div className="ss-kpi">
                <div className="ss-kpi-label">Pending Advisors</div>
                <div className="ss-kpi-value">8</div>
              </div>
              <div className="ss-kpi">
                <div className="ss-kpi-label">On Probation</div>
                <div className="ss-kpi-value">12</div>
              </div>
            </section>

            <table className="ss-table">
              <thead>
                <tr>
                  <th>Club Name</th>
                  <th>Category</th>
                  <th>Members</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="ss-row-active">
                  <td>Robotics Society</td>
                  <td>STEM</td>
                  <td>45</td>
                  <td><span className="ss-pill ss-pill--success">Active</span></td>
                </tr>
                <tr>
                  <td>Debate Club</td>
                  <td>Arts &amp; Humanities</td>
                  <td>32</td>
                  <td><span className="ss-pill ss-pill--warning">Probation</span></td>
                </tr>
                <tr>
                  <td>Student Government</td>
                  <td>Governance</td>
                  <td>15</td>
                  <td><span className="ss-pill ss-pill--success">Active</span></td>
                </tr>
                <tr>
                  <td>Chess Club</td>
                  <td>Recreation</td>
                  <td>22</td>
                  <td><span className="ss-pill ss-pill--muted">Suspended</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <aside className="ss-column-right ss-column-right--staff">
          <div className="ss-card">
            <h2>Club Details</h2>
            <div className="ss-club-detail-header">
              <div className="ss-club-avatar">R</div>
              <div>
                <div className="ss-club-name">Robotics Society</div>
                <div className="ss-club-tag">Active Member</div>
              </div>
            </div>

            <div className="ss-club-section">
              <div className="ss-muted-label">Staff Advisor</div>
              <div className="ss-staff-row">
                <div className="ss-staff-avatar" />
                <div>
                  <div className="ss-staff-name">Dr. Sarah Jenkins</div>
                  <div className="ss-staff-meta">Engineering Dept.</div>
                </div>
              </div>
              <button type="button" className="ss-btn-link">Change Advisor</button>
            </div>

            <div className="ss-club-section">
              <div className="ss-muted-label">Club Officers</div>
              <ul className="ss-officer-list">
                <li>
                  <span>Alex Rivera</span>
                  <span className="ss-officer-meta">2023–2024 • President</span>
                </li>
                <li>
                  <span>Jamie Chen</span>
                  <span className="ss-officer-meta">2023–2024 • Vice Pres.</span>
                </li>
                <li>
                  <span>Jordan Smith</span>
                  <span className="ss-officer-meta">2023–2024 • Treasurer</span>
                </li>
                <li>
                  <span>Taylor Wong</span>
                  <span className="ss-officer-meta">2023–2024 • Secretary</span>
                </li>
              </ul>
            </div>

            <button type="button" className="ss-btn-primary ss-btn-full">Save Club Changes</button>
          </div>
        </aside>
      </div>
    </>
  )

  const renderContent = () => {
    if (section === 'club-proposals') return renderClubProposals()
    if (section === 'event-proposals') return renderEventApprovals()
    if (section === 'clubs') return renderClubsSection()
    if (section === 'events') return renderEventsSection()
    if (section === 'staff') return renderStaffManagement()
    return renderCommandCenter()
  }

  const IconMenu = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
  const IconChevronLeft = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )

  return (
    <div className={`ss-layout ${sidebarOpen ? '' : 'ss-layout--sidebar-closed'}`}>
      <aside className="ss-sidebar">
        <button type="button" className="ss-sidebar-toggle" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
          <IconChevronLeft />
        </button>
        <button type="button" className="ss-sidebar-home" onClick={() => navigate('/')} aria-label="Back to home">
          <IconHome /> Back to Home
        </button>
        <div className="ss-sidebar-title">Student Services</div>

        <nav className="ss-nav">
          <button className={`ss-nav-item ${section === 'command' ? 'ss-nav-item--active' : ''}`} type="button" onClick={() => setSection('command')}>
            <IconOverview />
            <span>Command Center</span>
          </button>
          <button className={`ss-nav-item ${section === 'club-proposals' ? 'ss-nav-item--active' : ''}`} type="button" onClick={() => setSection('club-proposals')}>
            <IconClubs />
            <span>Club Proposals</span>
          </button>
          <button className={`ss-nav-item ${section === 'event-proposals' ? 'ss-nav-item--active' : ''}`} type="button" onClick={() => setSection('event-proposals')}>
            <IconEvents />
            <span>Event Proposals</span>
          </button>
          <button className={`ss-nav-item ${section === 'clubs' ? 'ss-nav-item--active' : ''}`} type="button" onClick={() => setSection('clubs')}>
            <IconClubs />
            <span>Clubs</span>
          </button>
          <button className={`ss-nav-item ${section === 'events' ? 'ss-nav-item--active' : ''}`} type="button" onClick={() => setSection('events')}>
            <IconEvents />
            <span>Events</span>
          </button>
        </nav>

        <div className="ss-sidebar-footer">
          <button className="ss-help-link" type="button">
            Help &amp; Support
          </button>
          <button className="ss-logout" type="button">
            Logout
          </button>
        </div>
      </aside>

      <main className="ss-main">
        {!sidebarOpen && (
          <button type="button" className="ss-sidebar-open-btn" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <IconMenu />
          </button>
        )}
        {renderContent()}
      </main>
    </div>
  )
}

export default StudentServices

