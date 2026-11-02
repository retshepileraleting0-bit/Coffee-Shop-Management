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
          <div className="brand-icon">☕</div>
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
            📋 Menu
          </button>
          <button
            className={`nav-link ${currentView === 'track' ? 'active' : ''}`}
            onClick={() => setCurrentView('track')}
          >
            🔍 Track Order
          </button>
          <button
            className={`nav-link ${currentView === 'staff' ? 'active' : ''}`}
            onClick={() => setCurrentView('staff')}
          >
            🔐 Staff {isStaffLoggedIn ? 'Dashboard' : 'Portal'}
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
            <span className="cart-icon">🛒</span>
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
