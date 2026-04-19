import React, { createContext, useContext } from 'react'

/** @type {React.Context<{ clubId: string, clubSearch: string, accessState: string } | null>} */
export const ClubAdminAccessContext = createContext(null)

export function useClubAdminAccess() {
  return useContext(ClubAdminAccessContext)
}
