import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFilter } from '../contexts/FilterContext'
import Card from '../components/Card'
import './Home.css'

const Home = () => {
  const navigate = useNavigate()
  const { activeFilter } = useFilter()

  const schedulingButtons = [
    {
      text: 'Go to Scheduling',
      onClick: () => navigate('/scheduling')
    }
  ]

  const lostAndFoundButtons = [
    {
      text: 'Announce Lost Item',
      onClick: () => navigate('/lost-and-found/announce-lost', { state: { from: 'home' } })
    },
    {
      text: 'Announce Found Item',
      onClick: () => navigate('/lost-and-found/announce-found', { state: { from: 'home' } })
    },
    {
      text: 'View List',
      onClick: () => navigate('/lost-and-found')
    }
  ]

  const clubsButtons = [
    {
      text: 'ADA Clubs',
      onClick: () => navigate('/coming-soon', { state: { title: 'ADA Clubs' } })
    },
    {
      text: 'Become a Member',
      onClick: () => navigate('/coming-soon', { state: { title: 'Become a Member' } })
    },
    {
      text: 'Club Vacancies',
      onClick: () => navigate('/coming-soon', { state: { title: 'Club Vacancies' } })
    },
    {
      text: 'Club Events',
      onClick: () => navigate('/coming-soon', { state: { title: 'Club Events' } })
    }
  ]

  const gradesButtons = [
    {
      text: 'View My Grades',
      onClick: () => navigate('/coming-soon', { state: { title: 'View My Grades' } })
    },
    {
      text: 'View Transcript',
      onClick: () => navigate('/coming-soon', { state: { title: 'View Transcript' } })
    }
  ]

  const coursesButtons = [
    {
      text: 'Course Registration',
      onClick: () => navigate('/coming-soon', { state: { title: 'Course Registration' } })
    },
    {
      text: 'View Schedule',
      onClick: () => navigate('/coming-soon', { state: { title: 'View Schedule' } })
    }
  ]

  const libraryButtons = [
    {
      text: 'Library Account',
      onClick: () => navigate('/coming-soon', { state: { title: 'Library Account' } })
    },
    {
      text: 'Room Reservation',
      onClick: () => navigate('/coming-soon', { state: { title: 'Room Reservation' } })
    }
  ]

  const profileButtons = [
    {
      text: 'Personal Information',
      onClick: () => navigate('/coming-soon', { state: { title: 'Personal Information' } })
    },
    {
      text: 'Account Settings',
      onClick: () => navigate('/coming-soon', { state: { title: 'Account Settings' } })
    }
  ]

  const tasksButtons = [
    {
      text: 'View Tasks',
      onClick: () => navigate('/coming-soon', { state: { title: 'View Tasks' } })
    },
    {
      text: 'Create Task',
      onClick: () => navigate('/coming-soon', { state: { title: 'Create Task' } })
    }
  ]

  const itfmSupportButtons = [
    {
      text: 'IT Support',
      onClick: () => navigate('/it-support', { state: { from: 'home' } })
    },
    {
      text: 'FM Support',
      onClick: () => navigate('/fm-support', { state: { from: 'home' } })
    },
    {
      text: 'My Requests',
      onClick: () => navigate('/my-requests')
    },
    {
      text: 'View All',
      onClick: () => navigate('/coming-soon', { state: { title: 'View All Requests' } })
    }
  ]

  // Define all cards with their categories
  const allCards = [
    { title: 'Scheduling and room allocation', buttons: schedulingButtons, category: 'home', centerButtons: true },
    { title: 'Lost and found', buttons: lostAndFoundButtons, category: 'community' },
    { title: 'Student Life & Clubs', buttons: clubsButtons, category: 'community' },
    { title: 'IT&FM Support', buttons: itfmSupportButtons, category: 'community' },
    { title: 'My Grades', buttons: gradesButtons, category: 'academics' },
    { title: 'Course Registration', buttons: coursesButtons, category: 'academics' },
    { title: 'Library Services', buttons: libraryButtons, category: 'academics' },
    { title: 'Student Profile', buttons: profileButtons, category: 'account' },
    { title: 'Account Settings', buttons: profileButtons, category: 'account' },
    { title: 'Work Tasks', buttons: tasksButtons, category: 'work' },
    { title: 'Projects', buttons: tasksButtons, category: 'work' }
  ]

  // Filter cards based on active filter
  const filteredCards = useMemo(() => {
    if (activeFilter === 'home') {
      return allCards // Show all cards when Home filter is active
    }
    return allCards.filter(card => card.category === activeFilter)
  }, [activeFilter])

  return (
    <div className="home-page">
      <div className="cards-container">
        {filteredCards.length > 0 ? (
          filteredCards.map((card, index) => (
            <Card
              key={index}
              title={card.title}
              buttons={card.buttons}
              centerButtons={card.centerButtons}
            />
          ))
        ) : (
          <div className="no-cards-message">
            <p>No cards available for this category.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
