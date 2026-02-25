import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
)
const IconFolder = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)
const IconChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

export default function AdminSidebar({ searchKeyword, setSearchKeyword, categoryFilter, setCategoryFilter, locationFilter, setLocationFilter, onApplyFilters, categories = [] }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isDashboard = location.pathname === '/admin/lost-and-found' || location.pathname === '/admin/lost-and-found/'
  const isItemDetail = location.pathname.match(/^\/admin\/lost-and-found\/item\/\d+$/)

  const navDashboardActive = isDashboard && !isItemDetail
  const navAllItemsActive = false

  return (
    <aside className="lf-admin-sidebar">
      <div className="lf-admin-sidebar-logo">
        <div className="lf-admin-logo-icon" />
        <span>Admin Hub</span>
      </div>
      <nav className="lf-admin-nav">
        <button
          type="button"
          className={`lf-admin-nav-item ${navDashboardActive ? 'lf-admin-nav-item--active' : ''}`}
          onClick={() => navigate('/admin/lost-and-found')}
        >
          <IconDashboard />
          Dashboard
        </button>
        <button
          type="button"
          className={`lf-admin-nav-item ${navAllItemsActive ? 'lf-admin-nav-item--active' : ''}`}
          onClick={() => navigate('/admin/lost-and-found')}
        >
          <IconFolder />
          All Items
        </button>
        <button type="button" className="lf-admin-nav-item">
          <IconChart />
          Reports
        </button>
      </nav>
      {categories.length > 0 && (
        <div className="lf-admin-filters">
          <h3 className="lf-admin-filters-title">INVENTORY FILTERS</h3>
          <input
            type="text"
            className="lf-admin-input"
            placeholder="Search keyword..."
            value={searchKeyword ?? ''}
            onChange={(e) => setSearchKeyword?.(e.target.value)}
          />
          <select
            className="lf-admin-input"
            value={categoryFilter ?? 'All Categories'}
            onChange={(e) => setCategoryFilter?.(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="lf-admin-input"
            value={locationFilter ?? 'Main Campus'}
            onChange={(e) => setLocationFilter?.(e.target.value)}
          >
            <option value="Main Campus">Main Campus</option>
            <option value="North Campus">North Campus</option>
            <option value="South Campus">South Campus</option>
          </select>
          <button type="button" className="lf-admin-btn-apply" onClick={onApplyFilters}>
            Apply Filters
          </button>
        </div>
      )}
    </aside>
  )
}
