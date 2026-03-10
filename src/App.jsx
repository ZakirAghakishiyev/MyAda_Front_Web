import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { FilterProvider } from './contexts/FilterContext'
import { CancelledRequestsProvider } from './contexts/CancelledRequestsContext'
import { RegisteredEventsProvider } from './contexts/RegisteredEventsContext'
import { LostAndFoundAdminProvider } from './contexts/LostAndFoundAdminContext'
import Header from './components/Header'
import LostAndFoundAdmin from './pages/LostAndFoundAdmin'
import LostAndFoundAdminItemDetail from './pages/LostAndFoundAdminItemDetail'
import Home from './pages/Home'
import SchedulingPage from './pages/SchedulingPage'
import LostAndFoundList from './pages/LostAndFoundList'
import LostAndFoundItemDetail from './pages/LostAndFoundItemDetail'
import AnnounceLostItem from './pages/AnnounceLostItem'
import AnnounceFoundItem from './pages/AnnounceFoundItem'
import LostAndFound2 from './pages/LostAndFound2'
import ITSupport from './pages/ITSupport'
import FMSupport from './pages/FMSupport'
import MyRequests from './pages/MyRequests'
import RequestDetail from './pages/RequestDetail'
import SupportDispatcher from './pages/SupportDispatcher'
import AssignTask from './pages/AssignTask'
import RequestDetailDispatcher from './pages/RequestDetailDispatcher'
import SupportStaffDirectory from './pages/SupportStaffDirectory'
import StaffPortalLayout from './pages/StaffPortalLayout'
import StaffPortal from './pages/StaffPortal'
import AttendancePortal from './pages/AttendancePortal'
import AttendanceCourseList from './pages/AttendanceCourseList'
import AttendanceStudents from './pages/AttendanceStudents'
import AttendanceHistory from './pages/AttendanceHistory'
import StaffPortalHistory from './pages/StaffPortalHistory'
import StaffTicketDetail from './pages/StaffTicketDetail'
import ComingSoonPage from './pages/ComingSoonPage'
import ClubsList from './pages/ClubsList'
import ClubNotifications from './pages/ClubNotifications'
import MyMemberships from './pages/MyMemberships'
import ClubDetail from './pages/ClubDetail'
import ProposeClub from './pages/ProposeClub'
import JoinClub from './pages/JoinClub'
import ClubVacancies from './pages/ClubVacancies'
import VacancyDetail from './pages/VacancyDetail'
import ApplyVacancy from './pages/ApplyVacancy'
import ClubEvents from './pages/ClubEvents'
import EventDetail from './pages/EventDetail'
import EventTicket from './pages/EventTicket'
import MyRegisteredEvents from './pages/MyRegisteredEvents'
import MyVacancyApplications from './pages/MyVacancyApplications'
import ClubAdminLayout from './pages/club-admin/ClubAdminLayout'
import ClubAdminDashboard from './pages/club-admin/ClubAdminDashboard'
import ClubAdminApplications from './pages/club-admin/ClubAdminApplications'
import ClubAdminVacancies from './pages/club-admin/ClubAdminVacancies'
import ClubAdminNewVacancy from './pages/club-admin/ClubAdminNewVacancy'
import ClubAdminEvents from './pages/club-admin/ClubAdminEvents'
import ClubAdminPositions from './pages/club-admin/ClubAdminPositions'
import ClubAdminNewPosition from './pages/club-admin/ClubAdminNewPosition'
import ClubAdminSuggestEvent from './pages/club-admin/ClubAdminSuggestEvent'
import ClubAdminMembers from './pages/club-admin/ClubAdminMembers'
import ClubAdminEmployees from './pages/club-admin/ClubAdminEmployees'
import StudentServices from './pages/StudentServices'
import StudentServicesEventDetail from './pages/StudentServicesEventDetail'
import './App.css'

const AppContent = () => {
  const location = useLocation()
  const isRequestDetailRoute = location.pathname.match(/^\/my-requests\/T-\d+$/)
  const isDispatcherTicketRoute = location.pathname.match(/^\/support-dispatcher\/T-\d+$/)
  const isClubAdminRoute = location.pathname.startsWith('/club-admin')
  const isStaffPortalRoute = location.pathname.startsWith('/staff-portal')
  const isAttendanceRoute = location.pathname.startsWith('/attendance')
  const hideHeaderOnRoutes = [
    '/scheduling',
    '/lost-and-found',
    '/lost-and-found/announce-lost',
    '/lost-and-found/announce-found',
    '/lost-and-found-2',
    '/admin/lost-and-found',
    '/it-support',
    '/fm-support',
    '/my-requests',
    '/coming-soon',
    '/clubs',
    '/clubs/my-memberships',
    '/clubs/vacancies',
    '/clubs/vacancies/my-applications',
    '/clubs/events',
    '/clubs/events/my-registrations',
    '/clubs/notifications',
    '/student-services',
    '/support-dispatcher',
    '/support-dispatcher/staff',
    '/support-dispatcher/assign-task'
  ]
  const isClubDetailRoute = location.pathname.match(/^\/clubs\/\d+$/)
  const isProposeClubRoute = location.pathname === '/clubs/propose'
  const isJoinClubRoute = location.pathname.match(/^\/clubs\/\d+\/join$/)
  const isVacancyDetailRoute = location.pathname.match(/^\/clubs\/vacancies\/\d+$/)
  const isApplyVacancyRoute = location.pathname.match(/^\/clubs\/vacancies\/\d+\/apply$/)
  const isEventDetailRoute = location.pathname.match(/^\/clubs\/events\/\d+$/)
  const isEventTicketRoute = location.pathname.match(/^\/clubs\/events\/\d+\/ticket$/)
  const isStudentServicesEventDetailRoute = location.pathname.match(/^\/student-services\/events\/[^/]+$/)
  const isItemDetailRoute = location.pathname.match(/^\/lost-and-found\/item\/\d+$/)
  const isAdminItemDetailRoute = location.pathname.match(/^\/admin\/lost-and-found\/item\/\d+$/)

  const isModalFromHome =
    ((location.pathname === '/lost-and-found/announce-lost' ||
      location.pathname === '/lost-and-found/announce-found') &&
    location.state?.from === 'home') ||
    (location.pathname === '/it-support' && location.state?.from === 'home') ||
    (location.pathname === '/fm-support' && location.state?.from === 'home')

  const isModalFromAdmin =
    (location.pathname === '/lost-and-found/announce-lost' ||
      location.pathname === '/lost-and-found/announce-found') &&
    location.state?.from === 'admin'

  const isLF2FromAdmin =
    location.pathname === '/lost-and-found-2' && location.state?.from === 'admin'

  const hideHeader =
    !isModalFromHome &&
    !isModalFromAdmin &&
    !isLF2FromAdmin &&
    (hideHeaderOnRoutes.includes(location.pathname) || isClubAdminRoute || isStaffPortalRoute || isAttendanceRoute || isItemDetailRoute || isAdminItemDetailRoute || isRequestDetailRoute || isDispatcherTicketRoute || isClubDetailRoute || isProposeClubRoute || isJoinClubRoute || isVacancyDetailRoute || isApplyVacancyRoute || isEventDetailRoute || isEventTicketRoute || isStudentServicesEventDetailRoute)

  return (
    <div className="app">
      {!hideHeader && <Header />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scheduling" element={<SchedulingPage />} />
          <Route path="/coming-soon" element={<ComingSoonPage />} />
          <Route path="/student-services" element={<StudentServices />} />
          <Route path="/student-services/events/:id" element={<StudentServicesEventDetail />} />
          <Route path="/clubs" element={<ClubsList />} />
          <Route path="/clubs/notifications" element={<ClubNotifications />} />
          <Route path="/clubs/my-memberships" element={<MyMemberships />} />
          <Route path="/clubs/vacancies" element={<ClubVacancies />} />
          <Route path="/clubs/vacancies/my-applications" element={<MyVacancyApplications />} />
          <Route path="/clubs/events/my-registrations" element={<MyRegisteredEvents />} />
          <Route path="/clubs/events/:id/ticket" element={<EventTicket />} />
          <Route path="/clubs/events/:id" element={
            <>
              <ClubEvents />
              <EventDetail />
            </>
          } />
          <Route path="/clubs/events" element={<ClubEvents />} />
          <Route path="/clubs/vacancies/:id/apply" element={
            <>
              <ClubVacancies />
              <ApplyVacancy />
            </>
          } />
          <Route path="/clubs/vacancies/:id" element={
            <>
              <ClubVacancies />
              <VacancyDetail />
            </>
          } />
          <Route path="/clubs/propose" element={<ProposeClub />} />
          <Route path="/clubs/:id/join" element={
            <>
              <ClubDetail />
              <JoinClub />
            </>
          } />
          <Route path="/clubs/:id" element={<ClubDetail />} />
          <Route path="/club-admin" element={<ClubAdminLayout />}>
            <Route index element={<ClubAdminDashboard />} />
            <Route path="applications" element={<ClubAdminApplications />} />
            <Route path="vacancies" element={<ClubAdminVacancies />} />
            <Route path="members" element={<ClubAdminMembers />} />
            <Route path="employees" element={<ClubAdminEmployees />} />
            <Route path="vacancies/new" element={<ClubAdminNewVacancy />} />
             <Route path="events" element={<ClubAdminEvents />} />
            <Route path="positions" element={<ClubAdminPositions />} />
            <Route path="positions/new" element={<ClubAdminNewPosition />} />
            <Route path="events/propose" element={<ClubAdminSuggestEvent />} />
          </Route>
          <Route path="/lost-and-found" element={<LostAndFoundList />} />
          <Route path="/lost-and-found-2" element={
            location.state?.from === 'admin' ? (
              <div className="popup-source-wrap">
                <div className="popup-source-bg">
                  <LostAndFoundAdmin />
                </div>
                <LostAndFound2 initialReport={location.state?.openReport} fromAdmin />
              </div>
            ) : (
              <LostAndFound2 />
            )
          } />
          <Route path="/admin/lost-and-found/item/:id" element={
            <div className="popup-source-wrap">
              <div className="popup-source-bg">
                <LostAndFoundAdmin />
              </div>
              <LostAndFoundAdminItemDetail />
            </div>
          } />
          <Route path="/admin/lost-and-found" element={<LostAndFoundAdmin />} />
          <Route path="/lost-and-found/item/:id" element={
            <>
              <LostAndFoundList />
              <LostAndFoundItemDetail />
            </>
          } />
          <Route path="/lost-and-found/announce-lost" element={
            location.state?.from === 'admin' ? (
              <div className="popup-source-wrap">
                <div className="popup-source-bg">
                  <LostAndFoundAdmin />
                </div>
                <AnnounceLostItem />
              </div>
            ) : (
              <>
                {location.state?.from === 'home' ? <Home /> : <LostAndFoundList />}
                <AnnounceLostItem />
              </>
            )
          } />
          <Route path="/lost-and-found/announce-found" element={
            location.state?.from === 'admin' ? (
              <div className="popup-source-wrap">
                <div className="popup-source-bg">
                  <LostAndFoundAdmin />
                </div>
                <AnnounceFoundItem />
              </div>
            ) : (
              <>
                {location.state?.from === 'home' ? <Home /> : <LostAndFoundList />}
                <AnnounceFoundItem />
              </>
            )
          } />
          <Route path="/it-support" element={
            <>
              <Home />
              <ITSupport />
            </>
          } />
          <Route path="/fm-support" element={
            <>
              <Home />
              <FMSupport />
            </>
          } />
          <Route path="/my-requests" element={<MyRequests />} />
          <Route path="/my-requests/:id" element={
            <>
              <MyRequests />
              <RequestDetail />
            </>
          } />
          <Route path="/support-dispatcher" element={<SupportDispatcher />} />
          <Route path="/support-dispatcher/:id" element={
            <>
              <SupportDispatcher />
              <RequestDetailDispatcher />
            </>
          } />
          <Route path="/support-dispatcher/staff" element={<SupportStaffDirectory />} />
          <Route path="/staff-portal" element={<StaffPortalLayout />}>
            <Route index element={<StaffPortal />} />
            <Route path="history" element={<StaffPortalHistory />} />
            <Route path="ticket/:id" element={<StaffTicketDetail />} />
          </Route>
          <Route path="/attendance" element={<AttendanceCourseList />} />
          <Route path="/attendance/lesson/:lessonId/students" element={<AttendanceStudents />} />
          <Route path="/attendance/lesson/:lessonId/history" element={<AttendanceHistory />} />
          <Route path="/attendance/lesson/:lessonId" element={<AttendancePortal />} />
          <Route
            path="/support-dispatcher/assign-task"
            element={
              <>
                {location.state?.from === 'staff' ? <SupportStaffDirectory /> : <SupportDispatcher />}
                <AssignTask />
              </>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <FilterProvider>
      <CancelledRequestsProvider>
        <Router>
          <RegisteredEventsProvider>
            <LostAndFoundAdminProvider>
              <AppContent />
            </LostAndFoundAdminProvider>
          </RegisteredEventsProvider>
        </Router>
      </CancelledRequestsProvider>
    </FilterProvider>
  )
}

export default App
