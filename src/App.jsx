import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { FilterProvider } from './contexts/FilterContext'
import Header from './components/Header'
import Home from './pages/Home'
import SchedulingPage from './pages/SchedulingPage'
import LostAndFoundList from './pages/LostAndFoundList'
import AnnounceLostItem from './pages/AnnounceLostItem'
import AnnounceFoundItem from './pages/AnnounceFoundItem'
import './App.css'

const AppContent = () => {
  const location = useLocation()
  const hideHeaderOnRoutes = [
    '/scheduling',
    '/lost-and-found',
    '/lost-and-found/announce-lost',
    '/lost-and-found/announce-found'
  ]

  const hideHeader = hideHeaderOnRoutes.includes(location.pathname)

  return (
    <div className="app">
      {!hideHeader && <Header />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scheduling" element={<SchedulingPage />} />
          <Route path="/lost-and-found" element={<LostAndFoundList />} />
          <Route path="/lost-and-found/announce-lost" element={<AnnounceLostItem />} />
          <Route path="/lost-and-found/announce-found" element={<AnnounceFoundItem />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <FilterProvider>
      <Router>
        <AppContent />
      </Router>
    </FilterProvider>
  )
}

export default App
