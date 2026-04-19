import React, { createContext, useContext, useState } from 'react'

const RegisteredEventsContext = createContext(null)

export function RegisteredEventsProvider({ children }) {
  const [registeredIds, setRegisteredIds] = useState(new Set())

  const registerEvent = (eventId) => {
    const id = eventId != null ? String(eventId) : ''
    if (!id) return
    setRegisteredIds((prev) => new Set([...prev, id]))
  }

  const isRegistered = (eventId) => {
    const id = eventId != null ? String(eventId) : ''
    return id ? registeredIds.has(id) : false
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
