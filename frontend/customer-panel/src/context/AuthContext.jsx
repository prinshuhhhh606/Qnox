import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  fetchCurrentUser,
  getStoredUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await fetchCurrentUser();
        if (user) {
          setCurrentUser(user);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('[AuthContext] Session restore failed:', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    const res = await loginUser(credentials);
    if (res?.user) {
      setCurrentUser(res.user);
    }
    return res;
  };

  const register = async (payload) => {
    const res = await registerUser(payload);
    if (res?.user) {
      setCurrentUser(res.user);
    }
    return res;
  };

  const logout = () => {
    logoutUser();
    setCurrentUser(null);
    sessionStorage.removeItem('qnox_view_mode');
    window.location.hash = '';
  };

  const isAdmin = currentUser && ['Admin', 'Super Admin'].includes(currentUser.role);
  const isTrainer = currentUser && currentUser.role === 'Trainer';
  const isCustomer = currentUser && ['Member', 'Gym Member'].includes(currentUser.role);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        loading,
        login,
        register,
        logout,
        isAdmin,
        isTrainer,
        isCustomer,
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

export default AuthContext;
