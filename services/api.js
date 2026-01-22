import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSubjectCode } from '../utils/subjectMapping';

// Backend API base URL - Update this with your backend URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.209.114.254:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle token expiration
    if (error.response?.status === 401) {
      try {
        // Clear stored token
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userData');
      } catch (storageError) {
        // Silently handle storage errors
      }
    }
    // Return error without throwing to prevent call stack display
    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  // Sign up new user
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  // Login user
  login: async (idToken) => {
    const response = await api.post('/auth/login', { idToken });
    return response.data;
  },

  // Get current user profile
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (updates) => {
    const response = await api.put('/auth/profile', updates);
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Google OAuth
  getGoogleAuthUrl: async () => {
    const response = await api.get('/auth/google');
    return response.data; // Return response data
  },
};

export const examAPI = {
  /**
   * Fetches questions for a specific exam code and level
   * Example: getQuestions('0570', 'Ordinary Level')
   * @param {string} subjectCode - The subject code (e.g., '0570')
   * @param {string} level - The level ('Ordinary Level' or 'Advance Level')
   */
  getQuestions: async (subjectCode, level = null) => {
    try {
      const params = level ? { level } : {};
      const response = await api.get(`/exams/questions/${subjectCode}`, { params });
      // Returns { success: true, data: [questions...] }
      return response.data;
    } catch (error) {
      console.error(`Error fetching questions for ${subjectCode} (${level}):`, error);
      throw error;
    }
  },

  /**
   * Fetches questions using subject ID and level (converts ID to code automatically)
   * Example: getQuestionsBySubjectId(1, 'Ordinary Level')
   * @param {number} subjectId - The subject ID (1-8)
   * @param {string} level - The level ('Ordinary Level' or 'Advance Level')
   */
  getQuestionsBySubjectId: async (subjectId, level) => {
    try {
      const subjectCode = getSubjectCode(subjectId, level);
      if (!subjectCode) {
        throw new Error(`Invalid subject ID (${subjectId}) or level (${level})`);
      }
      return await examAPI.getQuestions(subjectCode, level);
    } catch (error) {
      console.error(`Error fetching questions for subject ID ${subjectId} (${level}):`, error);
      throw error;
    }
  },

  /**
   * Fetches metadata for all available exams
   */
  getExams: async () => {
    const response = await api.get('/exams');
    return response.data;
  },

  /**
   * Fetches available years and papers for a subject
   * Example: getYearsBySubjectId(1, 'Ordinary Level')
   * @param {number} subjectId - The subject ID (1-8)
   * @param {string} level - The level ('Ordinary Level' or 'Advance Level')
   */
  getYearsBySubjectId: async (subjectId, level) => {
    try {
      const response = await api.get(`/exams/years/${subjectId}`, {
        params: { level },
        paramsSerializer: {
          indexes: null // Don't use array notation for params
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching years for subject ID ${subjectId} (${level}):`, error);
      if (error.response) {
        console.error('Response error:', error.response.data);
      }
      throw error;
    }
  },

  /**
   * Fetches topics for a subject with question counts
   * Example: getTopicsBySubjectId(1, 'Ordinary Level', 'Paper 1')
   * @param {number} subjectId - The subject ID (1-8)
   * @param {string} level - The level ('Ordinary Level' or 'Advance Level')
   * @param {string} paper - Optional paper type (e.g., 'Paper 1', 'Paper 2')
   */
  getTopicsBySubjectId: async (subjectId, level, paper = null) => {
    try {
      const params = { level };
      if (paper) {
        params.paper = paper;
      }
      const response = await api.get(`/exams/topics/${subjectId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching topics for subject ID ${subjectId} (${level}, ${paper || 'all papers'}):`, error);
      if (error.response) {
        console.error('Response error:', error.response.data);
      }
      throw error;
    }
  }
};

export default api;

