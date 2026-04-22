/// <reference types="vite/client" />

function decodePayload(accessToken: string): Record<string, unknown> | null {
  try {
    const parts = accessToken.split('.')
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4))
    return JSON.parse(atob(base64 + pad)) as Record<string, unknown>
  } catch {
    return null
  }
}

function pushRoles(out: string[], raw: unknown) {
  if (raw == null) return
  if (Array.isArray(raw)) {
    for (const x of raw) {
      if (typeof x === 'string' && x.trim()) out.push(x.trim())
      else if (typeof x === 'number') out.push(String(x))
    }
    return
  }
  if (typeof raw === 'string' && raw.trim()) {
    out.push(raw.trim())
    return
  }
  if (typeof raw === 'number') out.push(String(raw))
}

/** Role / claim values from access token (common ASP.NET + generic shapes). */
export function getJwtRoles(accessToken: string | null | undefined): string[] {
  if (!accessToken) return []
  const payload = decodePayload(accessToken)
  if (!payload) return []
  const out: string[] = []
  pushRoles(out, payload.role)
  pushRoles(out, payload.roles)
  pushRoles(out, payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'])
  return out
}

/**
 * Who joins the dispatcher inbox (incoming calls).
 *
 * Normal rules: JWT role contains "dispatcher" OR equals "tech_admin", OR Staff + email contains "dispatcher".
 *
 * To test calls quickly: create `.env.local` with:
 *   VITE_FORCE_CALL_DISPATCHER=true
 * restart dev server — any logged-in user is treated as a dispatcher.
 */
export function isDispatcherAccessToken(accessToken: string | null | undefined): boolean {
  if (!accessToken) return false

  const force = String(import.meta.env.VITE_FORCE_CALL_DISPATCHER || '').toLowerCase()
  if (force === 'true' || force === '1' || force === 'yes') return true

  for (const r of getJwtRoles(accessToken)) {
    const x = r.toLowerCase()
    if (x.includes('dispatcher') || x === 'tech_admin') return true
  }

  const payload = decodePayload(accessToken)
  if (!payload) return false
  const email = String(payload.email ?? '').toLowerCase()
  const userType = String(payload.userType ?? '').toLowerCase()
  if (userType === 'staff' && email.includes('dispatcher')) return true

  return false
}

/** Decode JWT payload (no signature verification — server validates). */
export function getAccessTokenSubject(accessToken: string | null | undefined): string | null {
  if (!accessToken) return null
  const payload = decodePayload(accessToken)
  if (!payload) return null
  const sub = payload.sub ?? payload.nameid
  if (typeof sub === 'string' && sub.length > 0) return sub
  if (sub != null && sub !== '') return String(sub)
  return null
}
