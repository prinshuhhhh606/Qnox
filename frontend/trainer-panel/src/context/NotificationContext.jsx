import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((arg1, arg2) => {
    const id = Date.now() + Math.random();
    let type = 'info';
    let title = undefined;
    let message = '';

    if (typeof arg1 === 'object' && arg1 !== null) {
      type = arg1.type || 'info';
      title = arg1.title;
      const rawMsg = arg1.message !== undefined ? arg1.message : arg1;
      message = typeof rawMsg === 'object' && rawMsg !== null
        ? (rawMsg.message || JSON.stringify(rawMsg))
        : String(rawMsg || '');
    } else {
      message = String(arg1 || '');
      type = arg2 || 'info';
    }

    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showToast, dismissToast, toasts }}>
      {children}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
