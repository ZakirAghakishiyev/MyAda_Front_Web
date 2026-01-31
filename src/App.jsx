import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { FilterProvider } from './contexts/FilterContext'
import { CancelledRequestsProvider } from './contexts/CancelledRequestsContext'
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
    '/coming-soon'
  ]
  const isItemDetailRoute = location.pathname.match(/^\/lost-and-found\/item\/\d+$/)

  const isModalFromHome =
    ((location.pathname === '/lost-and-found/announce-lost' ||
      location.pathname === '/lost-and-found/announce-found') &&
    location.state?.from === 'home') ||
    (location.pathname === '/it-support' && location.state?.from === 'home') ||
    (location.pathname === '/fm-support' && location.state?.from === 'home')

  const hideHeader =
    !isModalFromHome &&
    (hideHeaderOnRoutes.includes(location.pathname) || isItemDetailRoute || isRequestDetailRoute)

  return (
    <div className="app">
      {!hideHeader && <Header />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scheduling" element={<SchedulingPage />} />
          <Route path="/coming-soon" element={<ComingSoonPage />} />
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
          <AppContent />
        </Router>
      </CancelledRequestsProvider>
    </FilterProvider>
  )
}

export default App
