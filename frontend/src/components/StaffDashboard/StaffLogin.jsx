/**
 * ============================================================================
 * STAFF LOGIN COMPONENT
 * ============================================================================
 * Staff authentication screen protecting all administrative and barista features.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function StaffLogin() {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter the staff password.');
      return;
    }

    setLoading(true);
    try {
      await login(password);
    } catch (err) {
      setError(err.message || 'Incorrect staff password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-login-container">
      <div className="staff-login-card">
        <div className="login-badge-icon">☕🔐</div>
        <h2>Staff Portal Access</h2>
        <p>Restricted to coffee shop baristas and store managers.</p>

        {error && <div className="login-error-banner">⚠️ {error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="staffPassword">Staff Password</label>
            <input
              id="staffPassword"
              type="password"
              placeholder="Enter staff password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
            <small className="password-hint">
              Default password for evaluation: <code>barista2024</code>
            </small>
          </div>

          <button type="submit" className="btn-staff-login" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
