/**
 * ============================================================================
 * STAFF DASHBOARD MAIN WRAPPER
 * ============================================================================
 * Hosts the sub-views for staff:
 *   1. Orders Management (Kitchen Display)
 *   2. Menu Management (Add, Edit, Stock, Delete)
 *   3. Daily Summary & Analytics
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import StaffLogin from './StaffLogin';
import OrderManagement from './OrderManagement';
import MenuManagement from './MenuManagement';
import DailySummary from './DailySummary';

export default function StaffDashboard() {
  const { isStaffLoggedIn, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'menu' | 'summary'

  // If still checking token
  if (loading) {
    return (
      <div className="staff-loading-wrap">
        <div className="spinner"></div>
        <p>Verifying staff credentials...</p>
      </div>
    );
  }

  // If not authenticated, show login form
  if (!isStaffLoggedIn) {
    return <StaffLogin />;
  }

  return (
    <div className="staff-dashboard-container">
      {/* Dashboard Top Header */}
      <div className="staff-header-banner">
        <div className="staff-welcome-text">
          <h2>Barista & Manager Dashboard</h2>
          <span className="staff-badge">Staff Mode Active</span>
        </div>

        {/* Sub-navigation tabs */}
        <div className="staff-tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 Orders & Kitchen
          </button>
          <button
            className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            ☕ Menu & Prices
          </button>
          <button
            className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            📊 Daily Summary
          </button>
          <button className="tab-btn-logout" onClick={logout} title="Sign Out">
            Sign Out
          </button>
        </div>
      </div>

      {/* Render Active Sub-Panel */}
      <div className="staff-tab-content">
        {activeTab === 'orders' && <OrderManagement />}
        {activeTab === 'menu' && <MenuManagement />}
        {activeTab === 'summary' && <DailySummary />}
      </div>
    </div>
  );
}

