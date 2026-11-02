/**
 * ============================================================================
 * NAVBAR COMPONENT
 * ============================================================================
 * Top navigation bar featuring the Coffee Shop branding, section switches,
 * live backend status indicator, and cart toggle badge.
 */

import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { checkBackendHealth } from '../services/api';

export default function Navbar({ currentView, setCurrentView, openCart }) {
  const { totalCount } = useCart();
  const { isStaffLoggedIn, logout } = useAuth();
  const [isBackendHealthy, setIsBackendHealthy] = useState(null);

  // Poll health on mount
  useEffect(() => {
    checkBackendHealth()
      .then(() => setIsBackendHealthy(true))
      .catch(() => setIsBackendHealthy(false));
  }, []);

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Brand / Logo */}
        <div className="navbar-brand" onClick={() => setCurrentView('menu')}>
          <div className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="1" x2="6" y2="4"></line>
              <line x1="10" y1="1" x2="10" y2="4"></line>
              <line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-title">AromaCraft</span>
            <span className="brand-subtitle">Artisanal Coffee & Kitchen</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="navbar-nav">
          <button
            className={`nav-link ${currentView === 'menu' ? 'active' : ''}`}
            onClick={() => setCurrentView('menu')}
          >
            Menu
          </button>
          <button
            className={`nav-link ${currentView === 'track' ? 'active' : ''}`}
            onClick={() => setCurrentView('track')}
          >
            Track Order
          </button>
          <button
            className={`nav-link ${currentView === 'staff' ? 'active' : ''}`}
            onClick={() => setCurrentView('staff')}
          >
            Staff {isStaffLoggedIn ? 'Dashboard' : 'Portal'}
          </button>
        </nav>

        {/* Right side actions */}
        <div className="navbar-actions">
          {/* Health indicator */}
          <div
            className="health-badge"
            title={
              isBackendHealthy === true
                ? 'Backend REST API connected'
                : isBackendHealthy === false
                ? 'Backend offline or unreachable'
                : 'Checking backend...'
            }
          >
            <span className={`status-dot ${isBackendHealthy ? 'online' : 'offline'}`}></span>
            <span className="status-label">{isBackendHealthy ? 'API Online' : 'Connecting...'}</span>
          </div>

          {/* Cart Trigger Button */}
          <button className="cart-button" onClick={openCart} aria-label="View Cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span className="cart-text">Cart</span>
            {totalCount > 0 && <span className="cart-count-badge">{totalCount}</span>}
          </button>

          {/* Staff Logout Button if on staff dashboard */}
          {isStaffLoggedIn && currentView === 'staff' && (
            <button className="logout-button" onClick={logout} title="Sign out of staff mode">
              Log Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

