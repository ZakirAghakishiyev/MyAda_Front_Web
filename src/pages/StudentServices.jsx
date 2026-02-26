import React, { useState } from 'react'
import './StudentServices.css'

const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const IconClubs = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="7" height="7" rx="1" />
    <rect x="14" y="4" width="7" height="7" rx="1" />
    <rect x="3" y="15" width="7" height="7" rx="1" />
    <rect x="14" y="15" width="7" height="7" rx="1" />
  </svg>
)

const IconEvents = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const IconStaff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
  </svg>
)

const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.45a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.27 15 1.65 1.65 0 0 0 2 14H2a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3.55 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 3.27 1.65 1.65 0 0 0 9 2h.09a2 2 0 0 1 4 0H13a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.73 9H21a2 2 0 0 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15Z" />
  </svg>
)

const StudentServices = () => {
  const [section, setSection] = useState('command')

  const renderHeader = (title, subtitle) => (
    <header className="ss-main-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="ss-main-header-actions">
        <input
          className="ss-search"
          placeholder="Search clubs, students, or events..."
          type="text"
        />
        <div className="ss-main-profile">
          <div className="ss-main-avatar">A</div>
          <div className="ss-main-profile-text">
            <span className="ss-main-profile-name">Admin User</span>
            <span className="ss-main-profile-role">Student Services Office</span>
          </div>
        </div>
      </div>
    </header>
  )

  const renderCommandCenter = () => (
    <>
      {renderHeader('Central Command Dashboard', 'Review clubs, events, and student engagement at a glance.')}

        <header className="ss-main-header">
      </header>

      <section className="ss-kpis">
          <div className="ss-kpi">
            <div className="ss-kpi-label">Total Active Clubs</div>
            <div className="ss-kpi-value">142</div>
            <div className="ss-kpi-trend ss-kpi-trend--up">+3% vs last term</div>
          </div>
          <div className="ss-kpi">
            <div className="ss-kpi-label">Pending Proposals</div>
            <div className="ss-kpi-value">12</div>
            <div className="ss-kpi-trend ss-kpi-trend--up">+12% this week</div>
          </div>
          <div className="ss-kpi">
            <div className="ss-kpi-label">Approved Events</div>
            <div className="ss-kpi-value">45</div>
            <div className="ss-kpi-trend ss-kpi-trend--down">-2% vs last month</div>
          </div>
          <div className="ss-kpi">
            <div className="ss-kpi-label">Registered Students</div>
            <div className="ss-kpi-value">8,400</div>
            <div className="ss-kpi-trend ss-kpi-trend--up">+5% engagement</div>
          </div>
      </section>

      <div className="ss-main-grid">
          <section className="ss-column-left">
            <div className="ss-card ss-card--alerts">
              <h2>Priority Alerts</h2>
              <div className="ss-alert ss-alert--red">
                <div>
                  <div className="ss-alert-title">High-risk event request: Annual Gala</div>
                  <div className="ss-alert-body">
                    Review required for safety protocol compliance. Overdue by 2 hours.
                  </div>
                </div>
                <button type="button" className="ss-btn-primary">
                  Review now
                </button>
              </div>
              <div className="ss-alert ss-alert--yellow">
                <div>
                  <div className="ss-alert-title">Proposal deadline approaching</div>
                  <div className="ss-alert-body">
                    8 new club proposals awaiting initial staff screening by 5:00 PM today.
                  </div>
                </div>
                <button type="button" className="ss-btn-link">
                  View all
                </button>
              </div>
            </div>

            <div className="ss-card">
              <div className="ss-card-header">
                <h2>Recent Club Proposals</h2>
                <button type="button" className="ss-btn-link">
                  View directory
                </button>
              </div>
              <table className="ss-table">
                <thead>
                  <tr>
                    <th>Club Name</th>
                    <th>Category</th>
                    <th>Submitted</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Robotics Association</td>
                    <td>Science &amp; Tech</td>
                    <td>Oct 24, 2023</td>
                    <td><span className="ss-pill ss-pill--warning">Under Review</span></td>
                  </tr>
                  <tr>
                    <td>Campus Chess Masters</td>
                    <td>Recreation</td>
                    <td>Oct 23, 2023</td>
                    <td><span className="ss-pill ss-pill--success">Approved</span></td>
                  </tr>
                  <tr>
                    <td>Urban Gardening Initiative</td>
                    <td>Environment</td>
                    <td>Oct 22, 2023</td>
                    <td><span className="ss-pill ss-pill--info">New</span></td>
                  </tr>
                  <tr>
                    <td>Film Noir Society</td>
                    <td>Arts</td>
                    <td>Oct 21, 2023</td>
                    <td><span className="ss-pill ss-pill--muted">Pending Finance</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <aside className="ss-column-right">
            <div className="ss-card">
              <h2>Today&apos;s Approvals</h2>
              <div className="ss-approvals-list">
                <div className="ss-approval-item">
                  <div className="ss-approval-date">
                    <span className="ss-approval-day">OCT</span>
                    <span className="ss-approval-num">25</span>
                  </div>
                  <div className="ss-approval-body">
                    <div className="ss-approval-title">Outdoor Movie Night</div>
                    <div className="ss-approval-meta">7:00 PM • Main Quad</div>
                  </div>
                </div>
                <div className="ss-approval-item">
                  <div className="ss-approval-date">
                    <span className="ss-approval-day">OCT</span>
                    <span className="ss-approval-num">26</span>
                  </div>
                  <div className="ss-approval-body">
                    <div className="ss-approval-title">Entrepreneur Workshop</div>
                    <div className="ss-approval-meta">2:00 PM • Hall B</div>
                  </div>
                </div>
              </div>
              <button type="button" className="ss-btn-secondary ss-btn-full">
                Open event calendar
              </button>
            </div>

            <div className="ss-card">
              <h2>Resources</h2>
              <ul className="ss-resource-list">
                <li>University Policy Manual</li>
                <li>Safety Protocols 2024</li>
                <li>Staff Duty Roster</li>
                <li>Club Funding Guidelines</li>
              </ul>
            </div>

            <div className="ss-card">
              <h2>Engagement Trend</h2>
              <div className="ss-engagement-chart">
                <div className="ss-engagement-bar ss-engagement-bar--1" />
                <div className="ss-engagement-bar ss-engagement-bar--2" />
                <div className="ss-engagement-bar ss-engagement-bar--3" />
                <div className="ss-engagement-bar ss-engagement-bar--4" />
              </div>
              <p className="ss-engagement-caption">Student registrations over last 6 months</p>
            </div>
          </aside>
      </div>
    </>
  )

  const renderClubProposals = () => (
    <>
      {renderHeader('Club Proposal Review', 'Review and manage new campus organization submissions.')}
      <div className="ss-main-grid ss-main-grid--wide">
        <section className="ss-column-full">
          <div className="ss-card ss-card--proposal-main">
            <div className="ss-proposal-header">
              <div>
                <h2>Robotics &amp; Autonomous Systems Society</h2>
                <p>ID: STU-90210 • Submitted Oct 12, 2023</p>
              </div>
              <span className="ss-pill ss-pill--info">Reviewing</span>
            </div>

            <div className="ss-stepper">
              <div className="ss-stepper-item ss-stepper-item--done">1. Details</div>
              <div className="ss-stepper-item ss-stepper-item--done">2. Leadership</div>
              <div className="ss-stepper-item ss-stepper-item--done">3. Alignment</div>
              <div className="ss-stepper-item ss-stepper-item--active">4. Constitution</div>
            </div>

            <div className="ss-proposal-grid">
              <div className="ss-card ss-card--sub">
                <h3>Step 1 · Basic Information</h3>
                <p className="ss-muted-label">Mission Statement</p>
                <p className="ss-text">
                  To foster a community of students interested in robotics through workshops, competitions, and collaborative building projects using open-source hardware.
                </p>
                <div className="ss-inline-grid">
                  <div>
                    <p className="ss-muted-label">Category</p>
                    <p className="ss-text">STEM / Technical</p>
                  </div>
                  <div>
                    <p className="ss-muted-label">Expected Members</p>
                    <p className="ss-text">35–50 students</p>
                  </div>
                </div>
              </div>

              <div className="ss-card ss-card--sub">
                <h3>Step 2 · Leadership Roster</h3>
                <table className="ss-table ss-table--compact">
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Student ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>President</td>
                      <td>STU-90210</td>
                      <td><span className="ss-pill ss-pill--success">Verified</span></td>
                    </tr>
                    <tr>
                      <td>Treasurer</td>
                      <td>STU-44712</td>
                      <td><span className="ss-pill ss-pill--success">Verified</span></td>
                    </tr>
                    <tr>
                      <td>Secretary</td>
                      <td>STU-88320</td>
                      <td><span className="ss-pill ss-pill--success">Verified</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="ss-card ss-card--sub">
                <h3>Step 3 · University Alignment</h3>
                <p className="ss-muted-label">How does this club support university values?</p>
                <p className="ss-text">
                  The club promotes innovation and academic excellence by providing hands‑on experience that complements the engineering curriculum.
                </p>
                <p className="ss-muted-label">Community impact statement</p>
                <p className="ss-text">
                  We plan to host outreach events for local high schools to spark interest in robotics and STEM careers.
                </p>
              </div>

              <div className="ss-card ss-card--sub">
                <h3>Step 4 · Constitution &amp; Docs</h3>
                <div className="ss-doc-row">
                  <div className="ss-doc-icon" />
                  <div className="ss-doc-body">
                    <div className="ss-doc-name">Robotics_Constitution_v1.pdf</div>
                    <div className="ss-doc-meta">Uploaded Oct 12, 11:45 AM • 2.4 MB</div>
                  </div>
                  <button type="button" className="ss-btn-secondary">View</button>
                </div>
              </div>
            </div>

            <div className="ss-admin-decision">
              <label>Administrative Decision</label>
              <textarea rows={3} placeholder="Add private administrator notes or instructions for the students here..." />
              <div className="ss-admin-actions">
                <button type="button" className="ss-btn-secondary">Reject</button>
                <button type="button" className="ss-btn-secondary">Request Changes</button>
                <button type="button" className="ss-btn-primary">Approve &amp; Activate</button>
              </div>
            </div>
          </div>

          <div className="ss-card ss-card--queue">
            <h3>Other Proposals in Queue</h3>
            <ul className="ss-queue-list">
              <li>
                <div>
                  <div className="ss-queue-title">Digital Arts Guild</div>
                  <div className="ss-queue-meta">ID: STU-44560 • Submitted Oct 14, 2023</div>
                </div>
                <span className="ss-pill ss-pill--info">Reviewing</span>
              </li>
              <li>
                <div>
                  <div className="ss-queue-title">Campus Gardeners Network</div>
                  <div className="ss-queue-meta">ID: STU-41223 • Submitted Oct 15, 2023</div>
                </div>
                <span className="ss-pill ss-pill--warning">Needs Revision</span>
              </li>
              <li>
                <div>
                  <div className="ss-queue-title">E‑Sports Coalition</div>
                  <div className="ss-queue-meta">ID: STU-55443 • Submitted Oct 16, 2023</div>
                </div>
                <span className="ss-pill ss-pill--muted">Pending</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </>
  )

  const renderEventApprovals = () => (
    <>
      {renderHeader('Event Approval Queue', 'Review club event proposals across the semester calendar.')}
      <div className="ss-main-grid ss-main-grid--events">
        <section className="ss-column-left">
          <div className="ss-card ss-card--events-list">
            <h2>Approval Queue</h2>
            <ul className="ss-queue-list">
              <li>
                <div>
                  <div className="ss-queue-title">Annual Jazz Night</div>
                  <div className="ss-queue-meta">Music &amp; Arts Club • Oct 24, 2023 • 7:00 PM</div>
                </div>
                <span className="ss-pill ss-pill--info">Low Risk</span>
              </li>
              <li>
                <div>
                  <div className="ss-queue-title">Night Hiking Expedition</div>
                  <div className="ss-queue-meta">Outdoor Adventure • Oct 26, 2023 • 6:00 PM</div>
                </div>
                <span className="ss-pill ss-pill--warning">Med Risk</span>
              </li>
              <li>
                <div>
                  <div className="ss-queue-title">Campus Debate Series</div>
                  <div className="ss-queue-meta">Political Science Soc. • Oct 28, 2023 • 5:00 PM</div>
                </div>
                <span className="ss-pill ss-pill--success">Low Risk</span>
              </li>
            </ul>
          </div>
        </section>

        <aside className="ss-column-right ss-column-right--events">
          <div className="ss-card ss-card--calendar">
            <h2>October 2023</h2>
            <div className="ss-calendar-grid">
              {[1,2,3,4,5,6,7].map((d) => (
                <div key={d} className="ss-calendar-day">
                  <span>{d}</span>
                  {d === 3 && <span className="ss-pill ss-pill--success ss-calendar-pill">Approved</span>}
                  {d === 5 && <span className="ss-pill ss-pill--info ss-calendar-pill">Pending</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="ss-card ss-card--event-detail">
            <h2>Annual Jazz Night</h2>
            <p className="ss-muted-label">Venue</p>
            <p className="ss-text">North Campus Hall</p>
            <p className="ss-muted-label">Expected Attendance</p>
            <p className="ss-text">220 – 300 People</p>
            <p className="ss-muted-label">Risk Assessment</p>
            <p className="ss-text ss-text--success">Safety Compliant • Security plan approved by campus police.</p>
            <p className="ss-muted-label">Event Description</p>
            <p className="ss-text">
              The Annual Jazz Night is the signature event for the Music &amp; Arts club. It brings professional musicians and talented students together for an evening of acoustic performances.
            </p>
            <div className="ss-admin-actions">
              <button type="button" className="ss-btn-secondary">Deny Request</button>
              <button type="button" className="ss-btn-primary">Approve Event</button>
            </div>
          </div>
        </aside>
      </div>
    </>
  )

  const renderStaffManagement = () => (
    <>
      {renderHeader('Club Ecosystem & Staff Manager', 'View active clubs, advisors, and officer rosters.')}
      <div className="ss-main-grid ss-main-grid--staff">
        <section className="ss-column-left">
          <div className="ss-card">
            <h2>Clubs Overview</h2>
            <section className="ss-kpis ss-kpis--mini">
              <div className="ss-kpi">
                <div className="ss-kpi-label">Active Clubs</div>
                <div className="ss-kpi-value">142</div>
              </div>
              <div className="ss-kpi">
                <div className="ss-kpi-label">Pending Advisors</div>
                <div className="ss-kpi-value">8</div>
              </div>
              <div className="ss-kpi">
                <div className="ss-kpi-label">On Probation</div>
                <div className="ss-kpi-value">12</div>
              </div>
            </section>

            <table className="ss-table">
              <thead>
                <tr>
                  <th>Club Name</th>
                  <th>Category</th>
                  <th>Members</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="ss-row-active">
                  <td>Robotics Society</td>
                  <td>STEM</td>
                  <td>45</td>
                  <td><span className="ss-pill ss-pill--success">Active</span></td>
                </tr>
                <tr>
                  <td>Debate Club</td>
                  <td>Arts &amp; Humanities</td>
                  <td>32</td>
                  <td><span className="ss-pill ss-pill--warning">Probation</span></td>
                </tr>
                <tr>
                  <td>Student Government</td>
                  <td>Governance</td>
                  <td>15</td>
                  <td><span className="ss-pill ss-pill--success">Active</span></td>
                </tr>
                <tr>
                  <td>Chess Club</td>
                  <td>Recreation</td>
                  <td>22</td>
                  <td><span className="ss-pill ss-pill--muted">Suspended</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <aside className="ss-column-right ss-column-right--staff">
          <div className="ss-card">
            <h2>Club Details</h2>
            <div className="ss-club-detail-header">
              <div className="ss-club-avatar">R</div>
              <div>
                <div className="ss-club-name">Robotics Society</div>
                <div className="ss-club-tag">Active Member</div>
              </div>
            </div>

            <div className="ss-club-section">
              <div className="ss-muted-label">Staff Advisor</div>
              <div className="ss-staff-row">
                <div className="ss-staff-avatar" />
                <div>
                  <div className="ss-staff-name">Dr. Sarah Jenkins</div>
                  <div className="ss-staff-meta">Engineering Dept.</div>
                </div>
              </div>
              <button type="button" className="ss-btn-link">Change Advisor</button>
            </div>

            <div className="ss-club-section">
              <div className="ss-muted-label">Club Officers</div>
              <ul className="ss-officer-list">
                <li>
                  <span>Alex Rivera</span>
                  <span className="ss-officer-meta">2023–2024 • President</span>
                </li>
                <li>
                  <span>Jamie Chen</span>
                  <span className="ss-officer-meta">2023–2024 • Vice Pres.</span>
                </li>
                <li>
                  <span>Jordan Smith</span>
                  <span className="ss-officer-meta">2023–2024 • Treasurer</span>
                </li>
                <li>
                  <span>Taylor Wong</span>
                  <span className="ss-officer-meta">2023–2024 • Secretary</span>
                </li>
              </ul>
            </div>

            <button type="button" className="ss-btn-primary ss-btn-full">Save Club Changes</button>
          </div>
        </aside>
      </div>
    </>
  )

  const renderContent = () => {
    if (section === 'clubs') return renderClubProposals()
    if (section === 'events') return renderEventApprovals()
    if (section === 'staff') return renderStaffManagement()
    return renderCommandCenter()
  }

  return (
    <div className="ss-layout">
      <aside className="ss-sidebar">
        <div className="ss-sidebar-header">
          <div className="ss-sidebar-logo">UN</div>
          <div className="ss-sidebar-text">
            <span className="ss-sidebar-title">Student Services</span>
            <span className="ss-sidebar-subtitle">Admin Portal</span>
          </div>
        </div>

        <nav className="ss-nav">
          <div className="ss-nav-section-label">Navigation</div>
          <button className={`ss-nav-item ${section === 'command' ? 'ss-nav-item--active' : ''}`} type="button" onClick={() => setSection('command')}>
            <IconHome />
            <span>Command Center</span>
          </button>
          <button className={`ss-nav-item ${section === 'clubs' ? 'ss-nav-item--active' : ''}`} type="button" onClick={() => setSection('clubs')}>
            <IconClubs />
            <span>Club Proposals</span>
          </button>
          <button className={`ss-nav-item ${section === 'events' ? 'ss-nav-item--active' : ''}`} type="button" onClick={() => setSection('events')}>
            <IconEvents />
            <span>Event Approvals</span>
          </button>
          <button className={`ss-nav-item ${section === 'staff' ? 'ss-nav-item--active' : ''}`} type="button" onClick={() => setSection('staff')}>
            <IconStaff />
            <span>Staff Management</span>
          </button>
          <button className="ss-nav-item" type="button">
            <IconSettings />
            <span>Policy Settings</span>
          </button>
        </nav>

        <div className="ss-sidebar-footer">
          <button className="ss-help-link" type="button">
            Help &amp; Support
          </button>
          <button className="ss-logout" type="button">
            Logout
          </button>
        </div>
      </aside>

      <main className="ss-main">
        {renderContent()}
      </main>
    </div>
  )
}

export default StudentServices

