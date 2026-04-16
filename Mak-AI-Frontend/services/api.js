import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSubjectCode } from '../utils/subjectMapping';

// Backend API base URL - Update this with your backend URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://mak-ai-server.onrender.com/api';

// Debug flag - Set to true to see detailed logs
const DEBUG_MODE = process.env.EXPO_PUBLIC_DEBUG_API === 'true' || false;

const CACHE_VERSION = 'v1';
const EXAM_CACHE_PREFIX = `@exam_cache_${CACHE_VERSION}`;

const buildQuestionsCacheKey = (subjectCode, level) =>
  `${EXAM_CACHE_PREFIX}:questions:${String(subjectCode)}:${String(level || 'all').replace(/\s+/g, '_').toLowerCase()}`;

const buildTopicQuestionsCacheKey = (subjectCode, level, topic) =>
  `${EXAM_CACHE_PREFIX}:questions_topic:${String(subjectCode)}:${String(level || 'all').replace(/\s+/g, '_').toLowerCase()}:${String(topic || 'all').trim().replace(/\s+/g, '_').toLowerCase()}`;

const buildYearsCacheKey = (subjectId, level) =>
  `${EXAM_CACHE_PREFIX}:years:${String(subjectId)}:${String(level || 'all').replace(/\s+/g, '_').toLowerCase()}`;

const buildTopicsCacheKey = (subjectId, level, paper) =>
  `${EXAM_CACHE_PREFIX}:topics:${String(subjectId)}:${String(level || 'all').replace(/\s+/g, '_').toLowerCase()}:${String(paper || 'all').replace(/\s+/g, '_').toLowerCase()}`;

const readCache = async (key) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Cache read failed for key ${key}:`, error?.message || error);
    return null;
  }
};

const writeCache = async (key, payload) => {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({
        ...payload,
        cachedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.warn(`Cache write failed for key ${key}:`, error?.message || error);
  }
};

if (DEBUG_MODE) {
  console.log('🔧 API Debug Mode Enabled');
  console.log('📍 Base URL:', API_BASE_URL);
}

//const API_BASE_URL = 'https://semibiological-implicitly-karan.ngrok-free.dev/api';


// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout (increased for cold starts)
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log(`🌐 [API] Requesting: ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`🔑 [API] Token present: ${token ? 'YES (Bearer ...)' : 'NO ❌'}`);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (DEBUG_MODE) {
        console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
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
    if (DEBUG_MODE) {
      console.log('✅ API Response:', response.status, response.config.url);
    }
    return response;
  },
  async (error) => {
    // Log detailed error information
    if (DEBUG_MODE || error.message.includes('Network')) {
      console.error('❌ API Error Details:');
      console.error('   Message:', error.message);
      console.error('   Status:', error.response?.status);
      console.error('   URL:', error.config?.url);
      console.error('   Timeout:', error.config?.timeout);
      if (error.response?.data) {
        console.error('   Response:', error.response.data);
      }
    }
    
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

// Push Notifications API methods
export const notificationsAPI = {
  /**
   * Saves the device's ExpoPushToken to the backend.
   * Must be called after login/signup while the user has a valid auth token.
   * @param {string} token    - ExpoPushToken string
   * @param {string} platform - 'ios' | 'android'
   */
  registerToken: async (token, platform) => {
    const response = await api.post('/notifications/token', { token, platform });
    return response.data;
  },

  /**
   * Deactivates the push token on logout so the user stops receiving notifications.
   * @param {string} token - ExpoPushToken string
   */
  deactivateToken: async (token) => {
    const response = await api.delete('/notifications/token', { data: { token } });
    return response.data;
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
    const cacheKey = buildQuestionsCacheKey(subjectCode, level);
    try {
      // Offline-first: use cached past papers first for this subject + level.
      const cached = await readCache(cacheKey);
      if (cached?.success && Array.isArray(cached?.data) && cached.data.length > 0) {
        if (DEBUG_MODE) {
          console.log(`📦 Using cached questions for ${subjectCode} (${level || 'all'})`);
        }
        return { ...cached, fromCache: true };
      }

      const params = level ? { level } : {};
      const response = await api.get(`/exams/questions/${subjectCode}`, { params });

      if (response?.data?.success && Array.isArray(response?.data?.data) && response.data.data.length > 0) {
        await writeCache(cacheKey, response.data);
      }

      // Returns { success: true, data: [questions...] }
      return response.data;
    } catch (error) {
      console.error(`Error fetching questions for ${subjectCode} (${level}):`, error);

      // Fallback if network fails but cache exists.
      const cached = await readCache(cacheKey);
      if (cached?.success && Array.isArray(cached?.data) && cached.data.length > 0) {
        return { ...cached, fromCache: true };
      }

      throw error;
    }
  },

  /**
   * Fetches questions for a specific subject + level + topic.
   * Uses topic-local cache first, then falls back to subject questions and filters by topic.
   * @param {string} subjectCode
   * @param {string} level
   * @param {string} topic
   */
  getQuestionsForTopic: async (subjectCode, level = null, topic) => {
    const normalizedTopic = String(topic || '').toLowerCase().trim();
    const cacheKey = buildTopicQuestionsCacheKey(subjectCode, level, normalizedTopic || 'all');

    try {
      const cached = await readCache(cacheKey);
      if (cached?.success && Array.isArray(cached?.data)) {
        if (DEBUG_MODE) {
          console.log(`📦 Using cached topic questions for ${subjectCode} (${level || 'all'}) -> ${normalizedTopic || 'all'}`);
        }
        return { ...cached, fromCache: true };
      }

      const baseResponse = await examAPI.getQuestions(subjectCode, level);
      const baseQuestions = Array.isArray(baseResponse?.data) ? baseResponse.data : [];

      const filteredQuestions = normalizedTopic
        ? baseQuestions.filter((q) =>
            q?.topic?.toString().toLowerCase().trim() === normalizedTopic
          )
        : baseQuestions;

      const topicPayload = {
        success: true,
        data: filteredQuestions,
        examInfo: baseResponse?.examInfo || null,
      };

      await writeCache(cacheKey, topicPayload);
      return topicPayload;
    } catch (error) {
      console.error(`Error fetching topic questions for ${subjectCode} (${level}) topic=${topic}:`, error);

      const cached = await readCache(cacheKey);
      if (cached?.success && Array.isArray(cached?.data)) {
        return { ...cached, fromCache: true };
      }

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
    const cacheKey = buildYearsCacheKey(subjectId, level);
    try {
      // Local-first to avoid loading the same past-paper years repeatedly.
      const cached = await readCache(cacheKey);
      if (cached?.success && Array.isArray(cached?.data) && cached.data.length > 0) {
        return { ...cached, fromCache: true };
      }

      const response = await api.get(`/exams/years/${subjectId}`, {
        params: { level },
        paramsSerializer: {
          indexes: null // Don't use array notation for params
        }
      });

      if (response?.data?.success && Array.isArray(response?.data?.data) && response.data.data.length > 0) {
        await writeCache(cacheKey, response.data);
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching years for subject ID ${subjectId} (${level}):`, error);
      if (error.response) {
        console.error('Response error:', error.response.data);
      }

      const cached = await readCache(cacheKey);
      if (cached?.success && Array.isArray(cached?.data) && cached.data.length > 0) {
        return { ...cached, fromCache: true };
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
    const cacheKey = buildTopicsCacheKey(subjectId, level, paper);
    try {
      // Local-first to avoid reloading topic-linked past papers.
      const cached = await readCache(cacheKey);
      if (cached?.success && Array.isArray(cached?.data) && cached.data.length > 0) {
        return { ...cached, fromCache: true };
      }

      const params = { level };
      if (paper) {
        params.paper = paper;
      }
      const response = await api.get(`/exams/topics/${subjectId}`, { params });

      if (response?.data?.success && Array.isArray(response?.data?.data) && response.data.data.length > 0) {
        await writeCache(cacheKey, response.data);
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching topics for subject ID ${subjectId} (${level}, ${paper || 'all papers'}):`, error);
      if (error.response) {
        console.error('Response error:', error.response.data);
      }

      const cached = await readCache(cacheKey);
      if (cached?.success && Array.isArray(cached?.data) && cached.data.length > 0) {
        return { ...cached, fromCache: true };
      }

      throw error;
    }
  },

  /**
   * Reads cached topics for a subject + level + paper without triggering a network request.
   * Returns null when nothing is cached yet.
   */
  getCachedTopicsBySubjectId: async (subjectId, level, paper = null) => {
    const cacheKey = buildTopicsCacheKey(subjectId, level, paper);
    const cached = await readCache(cacheKey);
    if (cached?.success && Array.isArray(cached?.data)) {
      return { ...cached, fromCache: true };
    }
    return null;
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
  },
  /**
   * Submits quiz results to the backend to be saved in Firestore
   * @param {Object} resultData - { subject, correct, total, durationInMinutes }
   */
  submitResults: async (resultData) => {
    try {
      // This sends a POST request to http://YOUR_IP:5000/api/exams/submit
      const response = await api.post('/exams/submit', resultData);
      return response.data;
    } catch (error) {
      console.error('Error submitting quiz results:', error);
      if (error.response) {
        console.error('Server Error Data:', error.response.data);
      }
      throw error;
    }
  },

  getStatsSummary: async () => {
    try {
      const response = await api.get('/exams/stats-summary');
      return response.data;
    } catch (error) {
      // This will tell you if it's a Timeout, a 404, or a 500
      if (error.response) {
        console.error("Server responded with:", error.response.status); // 404? 500?
      } else if (error.request) {
        console.error("No response received. Server might be down or timed out.");
      } else {
        console.error("Setup error:", error.message);
      }
      throw error;
    }
  },

  /**
   * Save a custom (AI-generated) exam to Firebase
   * POST /api/exams/custom
   * @param {Object} examData - Full exam data including questions array
   * @returns {Promise<Object>} { success, data: { firebaseExamId, questionCount } }
   */
  saveCustomExamToCloud: async (examData) => {
    try {
      if (DEBUG_MODE) {
        console.log('☁️ Saving exam to cloud...', {
          subject: examData.subject,
          numQuestions: examData.numQuestions,
          url: `${API_BASE_URL}/exams/custom`,
        });
      }
      
      const response = await api.post('/exams/custom', examData, {
        timeout: 30000, // 30 seconds for batch writes
      });
      
      if (DEBUG_MODE) {
        console.log('✅ Exam saved successfully:', response.data);
      }
      return response.data;
    } catch (error) {
      console.error('Error saving custom exam to cloud:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        isNetworkError: error.message === 'Network Error',
      });
      // Don't throw — this is a background sync, we don't want to break the UX
      return { success: false, error: error.message };
    }
  },

  /**
   * Fetch user-specific custom exams by subject
   * GET /api/exams/custom/user/:userId/subject/:subjectId
   * @param {string} userId - The user ID
   * @param {number} subjectId - The subject ID (1-8)
   * @returns {Promise<Object>} { success, data: [customExams...] }
   */
  getUserCustomExamsBySubject: async (userId, subjectId) => {
    try {
      const response = await api.get(`/exams/custom/user/${userId}/subject/${subjectId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching custom exams for user ${userId}, subject ${subjectId}:`, error);
      if (error.response?.status === 404) {
        // No custom exams found - return empty array
        return { success: true, data: [] };
      }
      throw error;
    }
  },

  /**
   * Fetch all custom exams for a specific user
   * GET /api/exams/custom/user/:userId
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} { success, data: [customExams...] }
   */
  getUserCustomExams: async (userId) => {
    try {
      const response = await api.get(`/exams/custom/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching custom exams for user ${userId}:`, error);
      if (error.response?.status === 404) {
        // No custom exams found - return empty array
        return { success: true, data: [] };
      }
      throw error;
    }
  },
};

/**
 * Financial / Payment API methods
 */
export const financialAPI = {
  /**
   * Create a deposit transaction
   * @param {Object} depositData - { amount, phone_number, provider }
   * @returns {Promise<Object>} { success, data: { deposit_id } }
   */
  createDeposit: async (depositData) => {
    try {
      const response = await api.post('/deposit', depositData);
      return response.data;
    } catch (error) {
      console.error('Error creating deposit:', error);
      throw error;
    }
  },
};

export default api;

