import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFilter } from '../contexts/FilterContext'
import { fetchMyClubMemberships } from '../api/clubApi'
import { roleMayManageClub } from '../auth/clubStaffRoles'
import { getJwtHomeMenuKey, getResolvedHomeMenuKey, userSeesFullHomeAsAdmin } from '../auth/homeRoles'
import CallCard from '../call/CallCard'
import Card from '../components/Card'
import './Home.css'

/**
 * Admin home section order and metadata — same field names for all roles; empty sections are omitted.
 */
const SECTION_ORDER = [
  'scheduling',
  'qr',
  'lostFound',
  'studentLife',
  'itfm',
]

/** Student: Ada Clubs before Lost&Found (user reading order) while using same section titles. */
const SECTION_ORDER_STUDENT = ['studentLife', 'lostFound', 'itfm']

const SECTION_META = {
  scheduling: { title: 'Scheduling and room allocation', category: 'home', centerButtons: true },
  qr: { title: 'QR Lesson Attendance', category: 'home', centerButtons: true },
  lostFound: { title: 'Lost&Found', category: 'community' },
  studentLife: { title: 'Student Life & Clubs', category: 'community' },
  itfm: { title: 'IT&FM Support', category: 'community' },
}

function buildHomeCallCard(catalog) {
  return {
    title: 'Call Card',
    category: 'community',
    buttons: [
      catalog.callContacts,
      catalog.callHistory,
    ],
    children: <CallCard />,
  }
}

/**
 * @param {(path: string, extra?: boolean | { title: string } | null) => () => void} nav
 */
function makeCatalog(nav) {
  return {
    courses: { text: 'Courses', onClick: nav('/scheduling/courses', false) },
    addPreferences: { text: 'Add preferences', onClick: nav('/scheduling/preferences', false) },
    scheduling: { text: 'Scheduling', onClick: nav('/scheduling', false) },
    qrAttendance: { text: 'QR Attendance', onClick: nav('/attendance', false) },
    lostFound: { text: 'Lost&Found', onClick: nav('/lost-and-found-2', false) },
    lostFoundAdmin: { text: 'Lost&Found Admin', onClick: nav('/admin/lost-and-found', false) },
    adaClubs: { text: 'Ada Clubs', onClick: nav('/clubs', false) },
    clubAdmin: { text: 'Club Admin', onClick: nav('/club-admin', false) },
    studentServices: { text: 'Student Services', onClick: nav('/student-services', false) },
    itSupport: { text: 'IT Support', onClick: nav('/it-support', true) },
    fmSupport: { text: 'FM Support', onClick: nav('/fm-support', true) },
    myRequests: { text: 'My Requests', onClick: nav('/my-requests', false) },
    supportDispatcher: { text: 'Support Dispatcher', onClick: nav('/support-dispatcher', false) },
    callContacts: { text: 'Contacts', onClick: nav('/calls/contacts', false) },
    staffPortal: { text: 'Staff Portal', onClick: nav('/staff-portal', false) },
    callHistory: { text: 'Call History', onClick: nav('/calls/history', false) },
  }
}

const ADMIN_BUTTON_KEYS = {
  scheduling: ['courses', 'addPreferences', 'scheduling'],
  qr: ['qrAttendance'],
  lostFound: ['lostFound', 'lostFoundAdmin'],
  studentLife: ['adaClubs', 'clubAdmin', 'studentServices'],
  itfm: ['itSupport', 'fmSupport', 'myRequests', 'supportDispatcher', 'staffPortal'],
}

/** @type {Record<string, Record<string, string[]>>} */
const ROLE_TO_KEYS = {
  student: {
    lostFound: ['lostFound'],
    studentLife: ['adaClubs'],
  },
  instructor: {
    scheduling: ['addPreferences'],
    qr: ['qrAttendance'],
    lostFound: ['lostFound'],
    studentLife: ['adaClubs'],
    itfm: ['itSupport', 'fmSupport', 'myRequests'],
  },
  course_manager: {
    scheduling: ['courses', 'scheduling'],
    lostFound: ['lostFound'],
    studentLife: ['adaClubs'],
    itfm: ['itSupport', 'fmSupport', 'myRequests'],
  },
  lf_admin: {
    lostFound: ['lostFound', 'lostFoundAdmin'],
    studentLife: ['adaClubs'],
    itfm: ['itSupport', 'fmSupport', 'myRequests'],
  },
  club_admin: {
    lostFound: ['lostFound'],
    studentLife: ['adaClubs', 'clubAdmin'],
    itfm: ['itSupport', 'fmSupport', 'myRequests'],
  },
  student_services: {
    lostFound: ['lostFound'],
    studentLife: ['adaClubs', 'studentServices'],
    itfm: ['itSupport', 'fmSupport', 'myRequests'],
  },
  dispatcher: {
    lostFound: ['lostFound'],
    studentLife: ['adaClubs'],
    itfm: ['itSupport', 'fmSupport', 'myRequests', 'supportDispatcher'],
  },
  support_staff: {
    lostFound: ['lostFound'],
    studentLife: ['adaClubs'],
    itfm: ['itSupport', 'fmSupport', 'myRequests', 'staffPortal'],
  },
}

const INSTRUCTOR_SCHEDULING_SUBTITLE =
  'Add preferences: your account ID is detected automatically — no manual ID entry is required on this page.'

/**
 * @param {Record<string, string[] | undefined>} keyMap sectionId -> button key names
 * @param {ReturnType<typeof makeCatalog>} catalog
 * @param {string} role
 */
function cardsFromKeyMap(keyMap, catalog, role) {
  const out = []
  const order = role === 'student' ? SECTION_ORDER_STUDENT : SECTION_ORDER
  for (const sectionId of order) {
    const want = keyMap[sectionId]
    if (!want || want.length === 0) continue
    const buttons = want
      .map((k) => catalog[k])
      .filter(Boolean)
    if (buttons.length === 0) continue
    const meta = SECTION_META[sectionId]
    if (!meta) continue
    const subTitle =
      role === 'instructor' && sectionId === 'scheduling' && want.includes('addPreferences')
        ? INSTRUCTOR_SCHEDULING_SUBTITLE
        : undefined
    out.push({
      title: meta.title,
      category: meta.category,
      centerButtons: Boolean(meta.centerButtons),
      subTitle: subTitle || undefined,
      buttons,
    })
    if (sectionId === 'itfm' && role !== 'student') {
      out.push(buildHomeCallCard(catalog))
    }
  }
  return out
}

function makeNavigateHelper(navigate) {
  return (path, ex) => {
    if (ex === true) {
      return () => navigate(path, { state: { from: 'home' } })
    }
    if (ex && typeof ex === 'object' && 'title' in ex) {
      return () => navigate(path, { state: { title: ex.title } })
    }
    return () => navigate(path)
  }
}

/**
 * @param {import('react-router-dom').NavigateFunction} navigate
 */
function buildAdminAllCards(navigate) {
  const n = makeNavigateHelper(navigate)
  const catalog = makeCatalog(n)
  return cardsFromKeyMap(ADMIN_BUTTON_KEYS, catalog, 'admin')
}

function buildRoleCards(navigate, key) {
  const n = makeNavigateHelper(navigate)
  const catalog = makeCatalog(n)
  const k = !ROLE_TO_KEYS[key] ? 'student' : key
  const spec = ROLE_TO_KEYS[k] || ROLE_TO_KEYS.student
  return cardsFromKeyMap(spec, catalog, k)
}

const Home = () => {
  const navigate = useNavigate()
  const { activeFilter, setActiveFilter } = useFilter()
  const [homeMenuKey, setHomeMenuKey] = useState(() => {
    if (userSeesFullHomeAsAdmin()) return 'admin'
    return getJwtHomeMenuKey()
  })
  const [clubLoading, setClubLoading] = useState(() => {
    if (userSeesFullHomeAsAdmin()) return false
    return getJwtHomeMenuKey() === 'student'
  })

  useEffect(() => {
    if (userSeesFullHomeAsAdmin() || getJwtHomeMenuKey() !== 'student') {
      if (!userSeesFullHomeAsAdmin()) {
        setHomeMenuKey(getJwtHomeMenuKey())
      }
      setClubLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const raw = await fetchMyClubMemberships()
        const items = raw?.items ?? raw ?? []
        const rows = Array.isArray(items) ? items : []
        const can = rows.some((row) => roleMayManageClub(row.role ?? row.membershipRole))
        if (!cancelled) {
          setHomeMenuKey(getResolvedHomeMenuKey(can))
        }
      } catch {
        if (!cancelled) setHomeMenuKey('student')
      } finally {
        if (!cancelled) setClubLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!userSeesFullHomeAsAdmin()) {
      setActiveFilter('home')
    }
  }, [setActiveFilter])

  const allCards = useMemo(() => {
    if (userSeesFullHomeAsAdmin()) {
      return buildAdminAllCards(navigate)
    }
    if (homeMenuKey === 'admin') {
      return buildAdminAllCards(navigate)
    }
    return buildRoleCards(navigate, homeMenuKey)
  }, [navigate, homeMenuKey])

  const isFullAdmin = userSeesFullHomeAsAdmin()

  const filteredCards = useMemo(() => {
    if (clubLoading) return []
    if (isFullAdmin) {
      if (activeFilter === 'home') return allCards
      return allCards.filter((card) => card.category === activeFilter)
    }
    return allCards
  }, [activeFilter, allCards, clubLoading, isFullAdmin])

  if (clubLoading) {
    return (
      <div className="home-page" style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
        Loading your home…
      </div>
    )
  }

  return (
    <div className="home-page">
      <div className="cards-container">
        {filteredCards.length > 0 ? (
          filteredCards.map((card, index) => (
            <Card
              key={`${card.title}-${index}`}
              title={card.title}
              children={card.children}
              buttons={card.buttons}
              centerButtons={card.centerButtons}
              subTitle={card.subTitle}
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
