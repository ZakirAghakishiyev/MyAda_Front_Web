import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchClubAdminDashboard, fetchClubAdminApplications } from '../../api/clubApi'
import { useClubAdminClubId, useClubAdminSearch } from '../../hooks/useClubAdminClubId'
import './ClubAdmin.css'

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
)
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
)
const IconGear = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
)
const IconPeople = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
)
const IconBriefcase = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
)
const IconFile = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
)
const IconCalendar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
)
const IconBulb = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" /></svg>
)

const statusDotClass = (status) => {
  if (status === 'Completed') return 'club-admin-status-dot--green'
  if (status === 'Under Review' || status === 'Reviewing') return 'club-admin-status-dot--purple'
  if (status === 'New Proposal') return 'club-admin-status-dot--blue'
  return 'club-admin-status-dot--orange'
}

const ClubAdminDashboard = () => {
  const clubId = useClubAdminClubId()
  const clubQs = useClubAdminSearch()
  const [stats, setStats] = useState({
    activeMembers: 0,
    membersChange: 0,
    openVacancies: 0,
    vacanciesChange: 0,
    newApplications: 0,
    applicationsChange: 0,
    upcomingEvents: 0,
    eventsStatus: 'N/A',
  })
  const [activity, setActivity] = useState([])
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadError('')
      try {
        const [d, apps] = await Promise.all([
          fetchClubAdminDashboard(clubId),
          fetchClubAdminApplications(clubId).catch(() => ({ items: [] })),
        ])
        if (cancelled || !d || typeof d !== 'object') return
        const st = d.stats && typeof d.stats === 'object' ? d.stats : d
        setStats((prev) => ({
          activeMembers: st.activeMembers ?? d.activeMembers ?? d.members ?? prev.activeMembers,
          membersChange: st.membersChange ?? d.membersChange ?? prev.membersChange,
          openVacancies: st.openVacancies ?? d.openVacancies ?? d.vacancies ?? prev.openVacancies,
          vacanciesChange: st.vacanciesChange ?? d.vacanciesChange ?? prev.vacanciesChange,
          newApplications: st.newApplications ?? d.newApplications ?? d.applications ?? prev.newApplications,
          applicationsChange: st.applicationsChange ?? d.applicationsChange ?? prev.applicationsChange,
          upcomingEvents: st.upcomingEvents ?? d.upcomingEvents ?? d.events ?? prev.upcomingEvents,
          eventsStatus: st.eventsStatus ?? d.eventsStatus ?? prev.eventsStatus,
        }))
        const appItems = apps?.items ?? apps ?? []
        if (Array.isArray(appItems) && appItems.length) {
          setActivity(
            appItems.slice(0, 8).map((row, idx) => ({
              id: row.id ?? row.applicationId ?? idx + 1,
              studentName: row.applicantName ?? row.studentName ?? 'Applicant',
              actionType: row.applicationType === 'job' ? 'Job application' : row.applicationType === 'membership' ? 'Membership' : 'Application',
              roleOrEvent: row.roleType ?? row.vacancyTitle ?? row.position ?? '—',
              status: row.status ?? 'Pending Review',
              timestamp: row.submittedAt
                ? new Date(row.submittedAt).toLocaleString()
                : 'Recently',
            }))
          )
        }
      } catch (e) {
        if (!cancelled) setLoadError(e?.message || 'Could not load dashboard data.')
      }
    })()
    return () => { cancelled = true }
  }, [clubId])

  const s = stats
  return (
    <>
      <header className="club-admin-header">
        <h1 className="club-admin-header-title">Dashboard Overview</h1>
        <div className="club-admin-header-search">
          <IconSearch />
          <input type="text" placeholder="Search members, applications or events..." aria-label="Search" />
        </div>
        <div className="club-admin-header-actions">
          <button type="button" className="club-admin-header-icon" aria-label="Notifications"><IconBell /></button>
          <button type="button" className="club-admin-header-icon" aria-label="Settings"><IconGear /></button>
          <div className="club-admin-user">
            <div className="club-admin-user-avatar" />
            <div className="club-admin-user-info">
              <span className="club-admin-user-name">Prof. Elena Vance</span>
              <span className="club-admin-user-role">Club Faculty Advisor</span>
            </div>
          </div>
        </div>
      </header>

      <div className="club-admin-kpis">
        <div className="club-admin-kpi">
          <div className="club-admin-kpi-icon club-admin-kpi-icon--green"><IconPeople /></div>
          <p className="club-admin-kpi-value">{s.activeMembers}</p>
          <p className="club-admin-kpi-label">Active Members</p>
          <span className={`club-admin-kpi-change club-admin-kpi-change--up`}>+{s.membersChange}%</span>
        </div>
        <div className="club-admin-kpi">
          <div className="club-admin-kpi-icon club-admin-kpi-icon--blue"><IconBriefcase /></div>
          <p className="club-admin-kpi-value">{s.openVacancies}</p>
          <p className="club-admin-kpi-label">Open Vacancies</p>
          <span className={`club-admin-kpi-change club-admin-kpi-change--down`}>{s.vacanciesChange}%</span>
        </div>
        <div className="club-admin-kpi">
          <div className="club-admin-kpi-icon club-admin-kpi-icon--amber"><IconFile /></div>
          <p className="club-admin-kpi-value">{s.newApplications}</p>
          <p className="club-admin-kpi-label">New Applications</p>
          <span className={`club-admin-kpi-change club-admin-kpi-change--up`}>+{s.applicationsChange}%</span>
        </div>
        <div className="club-admin-kpi">
          <div className="club-admin-kpi-icon club-admin-kpi-icon--purple"><IconCalendar /></div>
          <p className="club-admin-kpi-value">{s.upcomingEvents}</p>
          <p className="club-admin-kpi-label">Upcoming Events</p>
          <span className="club-admin-kpi-change club-admin-kpi-change--stable">{s.eventsStatus}</span>
        </div>
      </div>

      <div className="club-admin-content">
        {loadError ? (
          <p style={{ margin: '0 0 12px', fontSize: 14, color: '#b91c1c' }}>{loadError}</p>
        ) : null}
        <div className="club-admin-card">
          <div className="club-admin-card-head">
            <h2 className="club-admin-card-title">Recent Activity Feed</h2>
            <Link to={`/club-admin/applications${clubQs}`} className="club-admin-card-link">View all reports</Link>
          </div>
          <div className="club-admin-table-wrap">
          <table className="club-admin-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Action Type</th>
                <th>Role / Event</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((row) => (
                <tr key={row.id}>
                  <td>{row.studentName}</td>
                  <td>{row.actionType}</td>
                  <td>{row.roleOrEvent}</td>
                  <td>
                    <span className="club-admin-status">
                      <span className={`club-admin-status-dot ${statusDotClass(row.status)}`} />
                      {row.status}
                    </span>
                  </td>
                  <td>{row.timestamp}</td>
                  <td>
                    <Link to={`/club-admin/applications${clubQs}`} className="club-admin-card-link">Review</Link>
                  </td>
                </tr>
              ))}
              {activity.length === 0 && (
                <tr>
                  <td colSpan={6} className="club-admin-table-empty">No recent activity.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          <button type="button" className="club-admin-btn-secondary" style={{ marginTop: 12 }}>Show More Activity</button>
        </div>

        <div className="club-admin-tip-card">
          <IconBulb />
          <p>Recruitment for the Spring Semester closes in 14 days. Make sure to review all pending applications by Friday.</p>
        </div>

        <div className="club-admin-status-card">
          <p><span className="club-admin-status-dot club-admin-status-dot--green" /> All services operational</p>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e0f2fe' }} />
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ddd6fe' }} />
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fce7f3' }} />
            <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#e2e8f0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>+4</span>
          </div>
        </div>
      </div>
    </>
  )
}

export default ClubAdminDashboard
