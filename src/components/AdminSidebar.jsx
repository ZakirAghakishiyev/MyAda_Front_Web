import React from 'react'
import { useNavigate } from 'react-router-dom'
import adaLogo from '../assets/ada-logo.png'

export default function AdminSidebar({ searchKeyword, setSearchKeyword, categoryFilter, setCategoryFilter, locationFilter, setLocationFilter, onApplyFilters, categories = [] }) {
  const navigate = useNavigate()

  return (
    <aside className="lf-admin-sidebar">
      <button
        type="button"
        className="lf-admin-sidebar-logo lf-admin-sidebar-logo-btn"
        onClick={() => navigate('/')}
        aria-label="Go to home"
      >
        <img src={adaLogo} alt="ADA University" className="lf-admin-ada-logo" />
        <span>Admin Hub</span>
      </button>
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
