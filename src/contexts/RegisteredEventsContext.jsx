import React, { createContext, useContext, useState } from 'react'

const RegisteredEventsContext = createContext(null)

export function RegisteredEventsProvider({ children }) {
  const [registeredIds, setRegisteredIds] = useState(new Set())

  const registerEvent = (eventId) => {
    const id = typeof eventId === 'number' ? eventId : parseInt(eventId, 10)
    setRegisteredIds((prev) => new Set([...prev, id]))
  }

  const isRegistered = (eventId) => {
    const id = typeof eventId === 'number' ? eventId : parseInt(eventId, 10)
    return registeredIds.has(id)
  }

  const getRegisteredIds = () => Array.from(registeredIds)

  return (
    <RegisteredEventsContext.Provider value={{ registerEvent, isRegistered, getRegisteredIds }}>
      {children}
    </RegisteredEventsContext.Provider>
  )
}

export function useRegisteredEvents() {
  const ctx = useContext(RegisteredEventsContext)
  if (!ctx) {
    return {
      registerEvent: () => {},
      isRegistered: () => false,
      getRegisteredIds: () => []
    }
  }
  return ctx
}
