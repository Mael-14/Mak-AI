import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@auth_token';
const USER_DATA_KEY = '@user_data';
const PERSIST_LOGIN_KEY = '@persist_login_enabled';

/**
 * Store authentication credentials persistently
 * @param {string} token - Auth token
 * @param {object} userData - User data object
 * @returns {Promise<void>}
 */
export const saveLoginData = async (token, userData) => {
  try {
    if (token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    }
    if (userData) {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    }
    // Enable persistent login
    await AsyncStorage.setItem(PERSIST_LOGIN_KEY, 'true');
  } catch (error) {
    console.error('Error saving login data:', error);
  }
};

/**
 * Retrieve stored authentication credentials
 * @returns {Promise<{token: string|null, userData: object|null}>}
 */
export const getLoginData = async () => {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const userDataStr = await AsyncStorage.getItem(USER_DATA_KEY);
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    
    return { token, userData };
  } catch (error) {
    console.error('Error retrieving login data:', error);
    return { token: null, userData: null };
  }
};

/**
 * Check if persistent login is enabled
 * @returns {Promise<boolean>}
 */
export const isPersistentLoginEnabled = async () => {
  try {
    const value = await AsyncStorage.getItem(PERSIST_LOGIN_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking persistent login:', error);
    return false;
  }
};

/**
 * Clear all stored login data
 * @returns {Promise<void>}
 */
export const clearLoginData = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_DATA_KEY);
    await AsyncStorage.removeItem(PERSIST_LOGIN_KEY);
  } catch (error) {
    console.error('Error clearing login data:', error);
  }
};

/**
 * Update stored user data
 * @param {object} userData - Updated user data
 * @returns {Promise<void>}
 */
export const updateStoredUserData = async (userData) => {
  try {
    if (userData) {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    }
  } catch (error) {
    console.error('Error updating stored user data:', error);
  }
};

/**
 * Get only stored user data
 * @returns {Promise<object|null>}
 */
export const getStoredUserData = async () => {
  try {
    const userDataStr = await AsyncStorage.getItem(USER_DATA_KEY);
    return userDataStr ? JSON.parse(userDataStr) : null;
  } catch (error) {
    console.error('Error retrieving stored user data:', error);
    return null;
  }
};

/**
 * Get only stored auth token
 * @returns {Promise<string|null>}
 */
export const getStoredAuthToken = async () => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving stored auth token:', error);
    return null;
  }
};
