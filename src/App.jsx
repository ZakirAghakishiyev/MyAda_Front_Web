import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { FilterProvider } from './contexts/FilterContext'
import { CancelledRequestsProvider } from './contexts/CancelledRequestsContext'
import { RegisteredEventsProvider } from './contexts/RegisteredEventsContext'
import Header from './components/Header'
import Home from './pages/Home'
import SchedulingPage from './pages/SchedulingPage'
import LostAndFoundList from './pages/LostAndFoundList'
import LostAndFoundItemDetail from './pages/LostAndFoundItemDetail'
import AnnounceLostItem from './pages/AnnounceLostItem'
import AnnounceFoundItem from './pages/AnnounceFoundItem'
import ITSupport from './pages/ITSupport'
import FMSupport from './pages/FMSupport'
import MyRequests from './pages/MyRequests'
import RequestDetail from './pages/RequestDetail'
import ComingSoonPage from './pages/ComingSoonPage'
import ClubsList from './pages/ClubsList'
import MyMemberships from './pages/MyMemberships'
import ClubDetail from './pages/ClubDetail'
import ProposeClub from './pages/ProposeClub'
import JoinClub from './pages/JoinClub'
import ClubVacancies from './pages/ClubVacancies'
import VacancyDetail from './pages/VacancyDetail'
import ApplyVacancy from './pages/ApplyVacancy'
import ClubEvents from './pages/ClubEvents'
import EventDetail from './pages/EventDetail'
import MyRegisteredEvents from './pages/MyRegisteredEvents'
import './App.css'

const AppContent = () => {
  const location = useLocation()
  const isRequestDetailRoute = location.pathname.match(/^\/my-requests\/T-\d+$/)
  const hideHeaderOnRoutes = [
    '/scheduling',
    '/lost-and-found',
    '/lost-and-found/announce-lost',
    '/lost-and-found/announce-found',
    '/it-support',
    '/fm-support',
    '/my-requests',
    '/coming-soon',
    '/clubs',
    '/clubs/my-memberships',
    '/clubs/vacancies',
    '/clubs/events',
    '/clubs/events/my-registrations'
  ]
  const isClubDetailRoute = location.pathname.match(/^\/clubs\/\d+$/)
  const isProposeClubRoute = location.pathname === '/clubs/propose'
  const isJoinClubRoute = location.pathname.match(/^\/clubs\/\d+\/join$/)
  const isVacancyDetailRoute = location.pathname.match(/^\/clubs\/vacancies\/\d+$/)
  const isApplyVacancyRoute = location.pathname.match(/^\/clubs\/vacancies\/\d+\/apply$/)
  const isEventDetailRoute = location.pathname.match(/^\/clubs\/events\/\d+$/)
  const isItemDetailRoute = location.pathname.match(/^\/lost-and-found\/item\/\d+$/)

  const isModalFromHome =
    ((location.pathname === '/lost-and-found/announce-lost' ||
      location.pathname === '/lost-and-found/announce-found') &&
    location.state?.from === 'home') ||
    (location.pathname === '/it-support' && location.state?.from === 'home') ||
    (location.pathname === '/fm-support' && location.state?.from === 'home')

  const hideHeader =
    !isModalFromHome &&
    (hideHeaderOnRoutes.includes(location.pathname) || isItemDetailRoute || isRequestDetailRoute || isClubDetailRoute || isProposeClubRoute || isJoinClubRoute || isVacancyDetailRoute || isApplyVacancyRoute || isEventDetailRoute)

  return (
    <div className="app">
      {!hideHeader && <Header />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scheduling" element={<SchedulingPage />} />
          <Route path="/coming-soon" element={<ComingSoonPage />} />
          <Route path="/clubs" element={<ClubsList />} />
          <Route path="/clubs/my-memberships" element={<MyMemberships />} />
          <Route path="/clubs/vacancies" element={<ClubVacancies />} />
          <Route path="/clubs/events/my-registrations" element={<MyRegisteredEvents />} />
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
          <Route path="/clubs/propose" element={
            <>
              <ClubsList />
              <ProposeClub />
            </>
          } />
          <Route path="/clubs/:id/join" element={
            <>
              <ClubsList />
              <ClubDetail />
              <JoinClub />
            </>
          } />
          <Route path="/clubs/:id" element={
            <>
              <ClubsList />
              <ClubDetail />
            </>
          } />
          <Route path="/lost-and-found" element={<LostAndFoundList />} />
          <Route path="/lost-and-found/item/:id" element={
            <>
              <LostAndFoundList />
              <LostAndFoundItemDetail />
            </>
          } />
          <Route path="/lost-and-found/announce-lost" element={
            <>
              {location.state?.from === 'home' ? <Home /> : <LostAndFoundList />}
              <AnnounceLostItem />
            </>
          } />
          <Route path="/lost-and-found/announce-found" element={
            <>
              {location.state?.from === 'home' ? <Home /> : <LostAndFoundList />}
              <AnnounceFoundItem />
            </>
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
            <AppContent />
          </RegisteredEventsProvider>
        </Router>
      </CancelledRequestsProvider>
    </FilterProvider>
  )
}

export default App
