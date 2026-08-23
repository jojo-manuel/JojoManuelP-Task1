import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('joineazy_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user profile on initial render if token exists
  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMe();
      setUser(data.user);
      setGroup(data.group);
    } catch (err) {
      console.error('[AUTH CONTEXT FETCH PROFILE FAILED]', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await api.login({ email, password });
      localStorage.setItem('joineazy_token', data.token);
      setToken(data.token);
      setUser(data.user);
      await fetchProfile();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (payload) => {
    setError(null);
    try {
      const data = await api.register(payload);
      localStorage.setItem('joineazy_token', data.token);
      setToken(data.token);
      setUser(data.user);
      await fetchProfile();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('joineazy_token');
    setToken(null);
    setUser(null);
    setGroup(null);
  };

  const refreshProfile = () => {
    if (token) {
      fetchProfile();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      group,
      token,
      loading,
      error,
      login,
      register,
      logout,
      refreshProfile,
      setGroup
    }}>
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
