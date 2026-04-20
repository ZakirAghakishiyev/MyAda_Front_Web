import { useLocation } from 'react-router-dom'
import { useClubAdminAccess } from '../contexts/ClubAdminAccessContext'

export function useClubAdminClubId() {
  const ctx = useClubAdminAccess()
  const { search } = useLocation()
  if (ctx?.clubId) return ctx.clubId
  return new URLSearchParams(search).get('club') || ''
}

/** Returns `?club=…` for the active admin club, or empty string. */
export function useClubAdminSearch() {
  const ctx = useClubAdminAccess()
  const { search } = useLocation()
  if (ctx?.clubSearch) return ctx.clubSearch
  const id = new URLSearchParams(search).get('club')
  return id ? `?club=${encodeURIComponent(id)}` : ''
}
