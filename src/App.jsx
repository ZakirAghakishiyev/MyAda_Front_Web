import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom'
import { RequireAuth, RequireStudentServices, RequireClubAdminPortal } from './auth/RouteGuards'
import { FilterProvider } from './contexts/FilterContext'
import { CancelledRequestsProvider } from './contexts/CancelledRequestsContext'
import { RegisteredEventsProvider } from './contexts/RegisteredEventsContext'
import { LostAndFoundAdminProvider } from './contexts/LostAndFoundAdminContext'
import Header from './components/Header'
import LostAndFoundAdmin from './pages/LostAndFoundAdmin'
import LostAndFoundAdminItemDetail from './pages/LostAndFoundAdminItemDetail'
import Home from './pages/Home'
import SchedulingPage from './pages/SchedulingPage'
import CoursePage from './pages/scheduling/CoursePage'
import CourseDetailPage from './pages/scheduling/CourseDetailPage'
import SchedulingPreferencesPage from './pages/scheduling/SchedulingPreferencesPage'
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
import SupportDispatcherHistory from './pages/SupportDispatcherHistory'
import AssignTask from './pages/AssignTask'
import RequestDetailDispatcher from './pages/RequestDetailDispatcher'
import SupportStaffDirectory from './pages/SupportStaffDirectory'
import StaffPortalLayout from './pages/StaffPortalLayout'
import StaffPortal from './pages/StaffPortal'
import AttendancePortal from './pages/AttendancePortal'
import AttendanceCourseList from './pages/AttendanceCourseList'
import AttendanceStudents from './pages/AttendanceStudents'
import AttendanceHistory from './pages/AttendanceHistory'
import AttendanceStudentScanner from './pages/AttendanceStudentScanner'
import AttendanceQrTestPage from './pages/AttendanceQrTestPage'
import AttendanceEntryGate from './pages/AttendanceEntryGate'
import StaffPortalHistory from './pages/StaffPortalHistory'
import StaffTicketDetail from './pages/StaffTicketDetail'
import ComingSoonPage from './pages/ComingSoonPage'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
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
import ClubAdminProfile from './pages/club-admin/ClubAdminProfile'
import ClubAdminInterviewTimes from './pages/club-admin/ClubAdminInterviewTimes'
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
  const isSchedulingRoute = location.pathname.startsWith('/scheduling')
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
    '/login',
    '/forgot-password',
    '/reset-password',
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
    '/support-dispatcher/assign-task',
    '/support-dispatcher/history'
  ]
  const isClubDetailRoute = location.pathname.match(/^\/clubs\/[^/]+$/)
  const isProposeClubRoute = location.pathname === '/clubs/propose'
  const isJoinClubRoute = location.pathname.match(/^\/clubs\/[^/]+\/join$/)
  const isVacancyDetailRoute = location.pathname.match(/^\/clubs\/vacancies\/[^/]+$/)
  const isApplyVacancyRoute = location.pathname.match(/^\/clubs\/vacancies\/[^/]+\/apply$/)
  const isEventDetailRoute = location.pathname.match(/^\/clubs\/events\/[^/]+$/)
  const isEventTicketRoute = location.pathname.match(/^\/clubs\/events\/[^/]+\/ticket$/)
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
    (hideHeaderOnRoutes.includes(location.pathname) || isClubAdminRoute || isStaffPortalRoute || isAttendanceRoute || isSchedulingRoute || isItemDetailRoute || isAdminItemDetailRoute || isRequestDetailRoute || isDispatcherTicketRoute || isClubDetailRoute || isProposeClubRoute || isJoinClubRoute || isVacancyDetailRoute || isApplyVacancyRoute || isEventDetailRoute || isEventTicketRoute || isStudentServicesEventDetailRoute)

  return (
    <div className="app">
      {!hideHeader && <Header />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scheduling" element={<SchedulingPage />} />
          <Route path="/scheduling/courses/:courseId" element={<CourseDetailPage />} />
          <Route path="/scheduling/courses" element={<CoursePage />} />
          <Route path="/scheduling/preferences" element={<SchedulingPreferencesPage />} />
          <Route path="/coming-soon" element={<ComingSoonPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/student-services"
            element={
              <RequireStudentServices>
                <StudentServices />
              </RequireStudentServices>
            }
          />
          <Route
            path="/student-services/events/:id"
            element={
              <RequireStudentServices>
                <StudentServicesEventDetail />
              </RequireStudentServices>
            }
          />
          <Route path="/clubs" element={<RequireAuth />}>
            <Route index element={<ClubsList />} />
            <Route path="notifications" element={<ClubNotifications />} />
            <Route path="my-memberships" element={<MyMemberships />} />
            <Route path="vacancies" element={<Outlet />}>
              <Route index element={<ClubVacancies />} />
              <Route path="my-applications" element={<MyVacancyApplications />} />
              <Route path=":id" element={<Outlet />}>
                <Route
                  index
                  element={
                    <>
                      <ClubVacancies />
                      <VacancyDetail />
                    </>
                  }
                />
                <Route
                  path="apply"
                  element={
                    <>
                      <ClubVacancies />
                      <ApplyVacancy />
                    </>
                  }
                />
              </Route>
            </Route>
            <Route path="events" element={<Outlet />}>
              <Route index element={<ClubEvents />} />
              <Route path="my-registrations" element={<MyRegisteredEvents />} />
              <Route path=":id" element={<Outlet />}>
                <Route
                  index
                  element={
                    <>
                      <ClubEvents />
                      <EventDetail />
                    </>
                  }
                />
                <Route path="ticket" element={<EventTicket />} />
              </Route>
            </Route>
            <Route path="propose" element={<ProposeClub />} />
            <Route path=":id" element={<Outlet />}>
              <Route
                path="join"
                element={
                  <>
                    <ClubDetail />
                    <JoinClub />
                  </>
                }
              />
              <Route index element={<ClubDetail />} />
            </Route>
          </Route>
          <Route
            path="/club-admin"
            element={
              <RequireClubAdminPortal>
                <ClubAdminLayout />
              </RequireClubAdminPortal>
            }
          >
            <Route index element={<ClubAdminDashboard />} />
            <Route path="applications" element={<ClubAdminApplications />} />
            <Route path="interview-times" element={<ClubAdminInterviewTimes />} />
            <Route path="vacancies" element={<ClubAdminVacancies />} />
            <Route path="members" element={<ClubAdminMembers />} />
            <Route path="employees" element={<ClubAdminEmployees />} />
            <Route path="profile" element={<ClubAdminProfile />} />
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
          <Route path="/support-dispatcher/history" element={<SupportDispatcherHistory />} />
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
          <Route path="/attendance" element={<AttendanceEntryGate />} />
          <Route path="/attendance/student/scan" element={<AttendanceStudentScanner />} />
          <Route path="/attendance/test" element={<AttendanceQrTestPage />} />
          <Route path="/attendance/:instructorId" element={<AttendanceCourseList />} />
          <Route path="/attendance/:instructorId/lesson/:lessonId/students" element={<AttendanceStudents />} />
          <Route path="/attendance/:instructorId/lesson/:lessonId/history" element={<AttendanceHistory />} />
          <Route path="/attendance/:instructorId/lesson/:lessonId" element={<AttendancePortal />} />
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
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
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
