import { useLocation } from 'react-router-dom'
import { useClubAdminAccess } from '../contexts/ClubAdminAccessContext'
import { normalizeClubRouteKey } from '../utils/clubRouteKey'

export function useClubAdminClubId() {
  const ctx = useClubAdminAccess()
  const { search } = useLocation()
  if (ctx?.clubId) return normalizeClubRouteKey(ctx.clubId) || String(ctx.clubId).trim()
  return normalizeClubRouteKey(new URLSearchParams(search).get('club')) || ''
}

/** Returns `?club=…` for the active admin club, or empty string. */
export function useClubAdminSearch() {
  const ctx = useClubAdminAccess()
  const { search } = useLocation()
  if (ctx?.clubSearch) return ctx.clubSearch
  const id = normalizeClubRouteKey(new URLSearchParams(search).get('club'))
  return id ? `?club=${encodeURIComponent(id)}` : ''
}
