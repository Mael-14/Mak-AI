import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext({});

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success',
    duration: 4000,
    actionText: null,
    onActionPress: null,
  });

  const showToast = useCallback(({
    message,
    type = 'success',
    duration = 4000,
    actionText = null,
    onActionPress = null,
  }) => {
    setToast({
      visible: true,
      message,
      type,
      duration,
      actionText,
      onActionPress,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  // Convenience methods for different toast types
  const showSuccess = useCallback((message, options = {}) => {
    showToast({
      message,
      type: 'success',
      ...options,
    });
  }, [showToast]);

  const showError = useCallback((message, options = {}) => {
    showToast({
      message,
      type: 'error',
      duration: 5000, // Error messages stay longer
      ...options,
    });
  }, [showToast]);

  const showWarning = useCallback((message, options = {}) => {
    showToast({
      message,
      type: 'warning',
      ...options,
    });
  }, [showToast]);

  const showInfo = useCallback((message, options = {}) => {
    showToast({
      message,
      type: 'info',
      ...options,
    });
  }, [showToast]);

  // Special method to replace Alert.alert with OK button
  const showAlert = useCallback((title, message, options = {}) => {
    const combinedMessage = title && message ? `${title}\n${message}` : title || message;
    showToast({
      message: combinedMessage,
      type: options.type || 'info',
      duration: options.duration || 5000,
      actionText: options.actionText || 'OK',
      onActionPress: options.onActionPress || hideToast,
      ...options,
    });
  }, [showToast, hideToast]);

  const value = {
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showAlert,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        actionText={toast.actionText}
        onActionPress={toast.onActionPress}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
};

export default ToastContext;