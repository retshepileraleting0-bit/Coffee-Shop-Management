// Staff authentication state context
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginStaff, verifyStaffSession } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('staff_token') || '');
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verify stored token on startup
  useEffect(() => {
    async function verify() {
      if (!token) {
        setIsStaffLoggedIn(false);
        setLoading(false);
        return;
      }

      try {
        await verifyStaffSession(token);
        setIsStaffLoggedIn(true);
      } catch (err) {
        console.warn('Staff token expired or invalid:', err.message);
        localStorage.removeItem('staff_token');
        setToken('');
        setIsStaffLoggedIn(false);
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [token]);

  /**
   * Log in staff member
   */
  const login = async (password) => {
    const res = await loginStaff(password);
    if (res.token) {
      localStorage.setItem('staff_token', res.token);
      setToken(res.token);
      setIsStaffLoggedIn(true);
      return { success: true };
    }
    return { success: false, message: 'No token received' };
  };

  /**
   * Log out staff member
   */
  const logout = () => {
    localStorage.removeItem('staff_token');
    setToken('');
    setIsStaffLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isStaffLoggedIn,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

