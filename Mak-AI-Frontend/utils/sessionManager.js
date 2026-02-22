import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getLoginData, clearLoginData, saveLoginData } from './loginStorage';
import { authAPI } from '../services/api';

/**
 * Attempts to restore user session using stored authentication data
 * @returns {Promise<{success: boolean, user?: object, userData?: object}>}
 */
export const restoreUserSession = async () => {
  try {
    console.log('Attempting to restore user session...');
    
    // Get stored authentication data
    const { token, userData } = await getLoginData();
    
    if (!token || !userData) {
      console.log('No stored authentication data found');
      return { success: false };
    }

    console.log('Found stored authentication data, verifying with backend...');

    // Verify stored token is still valid with backend
    try {
      // Temporarily store token for the API call
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('authToken', token);
      
      const response = await authAPI.getCurrentUser();
      
      if (response && response.data) {
        console.log('Backend token verification successful');
        
        // Token is valid, update stored user data with fresh info
        const freshUserData = {
          uid: response.data.uid,
          email: response.data.email,
          name: response.data.name,
          emailVerified: response.data.emailVerified
        };
        
        await saveLoginData(token, freshUserData);
        
        return { 
          success: true, 
          userData: freshUserData,
          token: token
        };
      } else {
        throw new Error('Invalid response from backend');
      }
    } catch (backendError) {
      console.log('Backend token verification failed:', backendError.message);
      
      // Token might be expired, clear stored data
      await clearLoginData();
      return { success: false };
    }
    
  } catch (error) {
    console.error('Error restoring session:', error);
    // Clear potentially corrupted data
    await clearLoginData();
    return { success: false };
  }
};

/**
 * Validates if the current stored session is still valid
 * @returns {Promise<boolean>}
 */
export const isStoredSessionValid = async () => {
  try {
    const { token, userData } = await getLoginData();
    
    if (!token || !userData) {
      return false;
    }

    // Check if token is still valid with backend
    try {
      // Temporarily store token for the API call
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('authToken', token);
      
      const response = await authAPI.getCurrentUser();
      return !!(response && response.data);
    } catch (error) {
      console.log('Stored session validation failed:', error.message);
      return false;
    }
  } catch (error) {
    console.error('Error validating stored session:', error);
    return false;
  }
};

/**
 * Creates a temporary authenticated state for immediate UI rendering
 * @returns {Promise<{isAuthenticated: boolean, userData?: object}>}
 */
export const getTemporaryAuthState = async () => {
  try {
    const { token, userData } = await getLoginData();
    
    if (token && userData) {
      console.log('Returning temporary authenticated state');
      return { 
        isAuthenticated: true, 
        userData 
      };
    }
    
    return { isAuthenticated: false };
  } catch (error) {
    console.error('Error getting temporary auth state:', error);
    return { isAuthenticated: false };
  }
};