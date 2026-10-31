import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('upi_sentinel_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const res = await apiClient.get('/api/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error('Failed to load authenticated user profile', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await apiClient.post('/api/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('upi_sentinel_token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const res = await apiClient.post('/api/auth/register', userData);
    const { access_token, user: registeredUser } = res.data;
    localStorage.setItem('upi_sentinel_token', access_token);
    setToken(access_token);
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = () => {
    localStorage.removeItem('upi_sentinel_token');
    setToken(null);
    setUser(null);
  };

  const updateBalance = (newBalance) => {
    if (user) {
      setUser({ ...user, wallet_balance: newBalance });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        fetchCurrentUser,
        updateBalance,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
