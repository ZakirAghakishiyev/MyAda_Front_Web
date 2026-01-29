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
      onClick: () => navigate('/lost-and-found/announce-lost')
    },
    {
      text: 'Announce Found Item',
      onClick: () => navigate('/lost-and-found/announce-found')
    },
    {
      text: 'View List',
      onClick: () => navigate('/lost-and-found')
    }
  ]

  const clubsButtons = [
    {
      text: 'ADA Clubs',
      onClick: () => {
        console.log('Navigate to ADA Clubs')
      }
    },
    {
      text: 'Become a Member',
      onClick: () => {
        console.log('Navigate to Become a Member')
      }
    },
    {
      text: 'Club Vacancies',
      onClick: () => {
        console.log('Navigate to Club Vacancies')
      }
    },
    {
      text: 'Club Events',
      onClick: () => {
        console.log('Navigate to Club Events')
      }
    }
  ]

  const gradesButtons = [
    {
      text: 'View My Grades',
      onClick: () => {
        console.log('Navigate to View Grades')
      }
    },
    {
      text: 'View Transcript',
      onClick: () => {
        console.log('Navigate to View Transcript')
      }
    }
  ]

  const coursesButtons = [
    {
      text: 'Course Registration',
      onClick: () => {
        console.log('Navigate to Course Registration')
      }
    },
    {
      text: 'View Schedule',
      onClick: () => {
        console.log('Navigate to View Schedule')
      }
    }
  ]

  const libraryButtons = [
    {
      text: 'Library Account',
      onClick: () => {
        console.log('Navigate to Library Account')
      }
    },
    {
      text: 'Room Reservation',
      onClick: () => {
        console.log('Navigate to Room Reservation')
      }
    }
  ]

  const profileButtons = [
    {
      text: 'Personal Information',
      onClick: () => {
        console.log('Navigate to Personal Information')
      }
    },
    {
      text: 'Account Settings',
      onClick: () => {
        console.log('Navigate to Account Settings')
      }
    }
  ]

  const tasksButtons = [
    {
      text: 'View Tasks',
      onClick: () => {
        console.log('Navigate to View Tasks')
      }
    },
    {
      text: 'Create Task',
      onClick: () => {
        console.log('Navigate to Create Task')
      }
    }
  ]

  // Define all cards with their categories
  const allCards = [
    { title: 'Scheduling and room allocation', buttons: schedulingButtons, category: 'home', centerButtons: true },
    { title: 'Lost and found', buttons: lostAndFoundButtons, category: 'community' },
    { title: 'Student Life & Clubs', buttons: clubsButtons, category: 'community' },
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
