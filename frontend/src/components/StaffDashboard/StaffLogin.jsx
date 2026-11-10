// Staff login component
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
        <div className="login-badge-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h2>Staff Portal Access</h2>
        <p>Restricted to coffee shop baristas and store managers.</p>

        {error && <div className="login-error-banner">{error}</div>}

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

