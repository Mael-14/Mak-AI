import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSubjectCode } from '../utils/subjectMapping';

// Backend API base URL - Update this with your backend URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://mak-ai-carb.onrender.com/api'

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

// Multi-modal Chat API methods
export const multiModalAPI = {
  // Upload and analyze image
  analyzeImage: async (imageUri, message, sessionId, userId) => {
    try {
      const formData = new FormData();
      
      // Convert image URI to blob for upload
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      formData.append('image', blob, 'image.jpg');
      formData.append('message', message || 'Analyze this image');
      formData.append('sessionId', sessionId);
      formData.append('userId', userId);
      
      const apiResponse = await api.post('/chat/analyze-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for image analysis
      });
      
      return apiResponse.data;
    } catch (error) {
      console.error('Image analysis API error:', error);
      throw error;
    }
  },

  // Upload and analyze document
  analyzeDocument: async (documentUri, documentName, message, sessionId, userId) => {
    try {
      const formData = new FormData();
      
      // Read document file
      const response = await fetch(documentUri);
      const blob = await response.blob();
      
      formData.append('document', blob, documentName);
      formData.append('message', message || 'Analyze this document');
      formData.append('sessionId', sessionId);
      formData.append('userId', userId);
      
      const apiResponse = await api.post('/chat/analyze-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes for document analysis
      });
      
      return apiResponse.data;
    } catch (error) {
      console.error('Document analysis API error:', error);
      throw error;
    }
  },

  // Convert speech to text
  speechToText: async (audioUri, sessionId, userId) => {
    try {
      const formData = new FormData();
      
      // Read audio file
      const response = await fetch(audioUri);
      const blob = await response.blob();
      
      formData.append('audio', blob, 'recording.m4a');
      formData.append('sessionId', sessionId);
      formData.append('userId', userId);
      
      const apiResponse = await api.post('/chat/speech-to-text', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for transcription
      });
      
      return apiResponse.data;
    } catch (error) {
      console.error('Speech-to-text API error:', error);
      throw error;
    }
  },

  // Send multi-modal message (text + attachments)
  sendMultiModalMessage: async (message, attachments, sessionId, userId, level) => {
    try {
      const formData = new FormData();
      
      formData.append('message', message);
      formData.append('sessionId', sessionId);
      formData.append('userId', userId);
      formData.append('level', level);
      
      // Add attachments if any
      if (attachments && attachments.length > 0) {
        attachments.forEach((attachment, index) => {
          if (attachment.type === 'image') {
            // Handle image attachment
            fetch(attachment.uri)
              .then(response => response.blob())
              .then(blob => {
                formData.append(`attachment_${index}`, blob, `image_${index}.jpg`);
                formData.append(`attachment_${index}_type`, 'image');
              });
          } else if (attachment.type === 'document') {
            // Handle document attachment
            fetch(attachment.uri)
              .then(response => response.blob())
              .then(blob => {
                formData.append(`attachment_${index}`, blob, attachment.name);
                formData.append(`attachment_${index}_type`, 'document');
              });
          } else if (attachment.type === 'audio') {
            // Handle audio attachment
            fetch(attachment.uri)
              .then(response => response.blob())
              .then(blob => {
                formData.append(`attachment_${index}`, blob, `audio_${index}.m4a`);
                formData.append(`attachment_${index}_type`, 'audio');
              });
          }
        });
        
        formData.append('attachments_count', attachments.length.toString());
      }
      
      const apiResponse = await api.post('/chat/multimodal', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes for multi-modal processing
      });
      
      return apiResponse.data;
    } catch (error) {
      console.error('Multi-modal chat API error:', error);
      throw error;
    }
  },

  // Fallback: Send to existing chat endpoint with base64 encoding
  sendToExistingEndpoint: async (message, imageUri, sessionId, userId, level) => {
    try {
      let requestBody = {
        message: message,
        sessionId: sessionId,
        userId: userId,
        level: level,
      };

      // If image is provided, convert to base64 and include
      if (imageUri) {
        try {
          // For demo purposes, we'll use a placeholder
          // In production, you'd convert the image to base64
          requestBody.image_data = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...'; // Placeholder
          requestBody.has_image = true;
          requestBody.image_analysis_request = true;
        } catch (imageError) {
          console.warn('Failed to process image:', imageError);
        }
      }

      const response = await api.post('/chat', requestBody, {
        timeout: 60000,
      });

      return response.data;
    } catch (error) {
      console.error('Fallback chat API error:', error);
      throw error;
    }
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
  },

  /**
   * Fetches questions by exam ID
   * Example: getQuestionsByExamId('0570_P1_2025', 'Algebra')
   * @param {string} examId - The exam ID (e.g., '0570_P1_2025')
   * @param {string} topic - Optional topic filter
   */
  getQuestionsByExamId: async (examId, topic = null) => {
    try {
      const params = topic ? { topic } : {};
      const response = await api.get(`/exams/exam/${examId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching questions for exam ID ${examId}${topic ? ` (topic: ${topic})` : ''}:`, error);
      if (error.response) {
        console.error('Response error:', error.response.data);
      }
      throw error;
    }
  }
};

export default api;

