import React, { createContext, useContext, useState } from 'react'

const FilterContext = createContext()

export const useFilter = () => {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider')
  }
  return context
}

export const FilterProvider = ({ children }) => {
  const [activeFilter, setActiveFilter] = useState('home')

  return (
    <FilterContext.Provider value={{ activeFilter, setActiveFilter }}>
      {children}
    </FilterContext.Provider>
  )
}
