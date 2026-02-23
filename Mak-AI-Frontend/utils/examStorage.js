import AsyncStorage from '@react-native-async-storage/async-storage';
import { examAPI } from '../services/api';

const CUSTOM_EXAMS_KEY = '@MAK_AI_CUSTOM_EXAMS';

/**
 * Exam Storage Schema:
 * {
 *   id: string (unique exam ID),
 *   subject: string,
 *   subjectId: number,
 *   level: string,
 *   difficulty: string,
 *   duration: number (in minutes),
 *   questionType: string,
 *   topics: string[],
 *   numQuestions: number,
 *   totalMarks: number,
 *   questions: object[] (full question data for replay),
 *   createdAt: string (ISO timestamp),
 *   status: string ('completed' | 'in-progress' | 'saved'),
 *   userAnswers?: object (optional, for tracking user responses),
 * }
 */

/**
 * Save a custom exam to history
 * @param {Object} examData - Exam data to save
 * @returns {Promise<Object>} Saved exam with ID
 */
export const saveCustomExam = async (examData) => {
  try {
    const exams = await getAllCustomExams();

    // Create exam record with unique ID
    const examId = `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const examRecord = {
      id: examId,
      ...examData,
      createdAt: new Date().toISOString(),
      status: examData.status || 'saved',
    };

    // Add to exams array
    const updatedExams = [examRecord, ...exams]; // Most recent first

    // Save to AsyncStorage
    await AsyncStorage.setItem(CUSTOM_EXAMS_KEY, JSON.stringify(updatedExams));

    console.log('✅ Exam saved locally:', examId);

    // ── Cloud sync (fire-and-forget) ──────────────────────
    // This runs in the background — it won't block the UI or
    // cause an error if the network is unavailable.
    examAPI.saveCustomExamToCloud({
      ...examData,
      localExamId: examId,
    }).then((result) => {
      if (result?.success) {
        console.log('☁️ Exam synced to Firebase:', result.data?.firebaseExamId);
      } else {
        console.warn('☁️ Cloud sync skipped or failed (exam is still saved locally)');
      }
    }).catch(() => {
      // Silently ignore — local save already succeeded
    });

    return examRecord;
  } catch (error) {
    console.error('❌ Error saving exam:', error);
    throw error;
  }
};

/**
 * Get all custom exams from history
 * @returns {Promise<Object[]>} Array of exam records
 */
export const getAllCustomExams = async () => {
  try {
    const examsJSON = await AsyncStorage.getItem(CUSTOM_EXAMS_KEY);

    if (!examsJSON) {
      return [];
    }

    const exams = JSON.parse(examsJSON);
    return Array.isArray(exams) ? exams : [];
  } catch (error) {
    console.error('❌ Error retrieving exams:', error);
    return [];
  }
};

/**
 * Get a specific exam by ID
 * @param {string} examId - Exam ID to retrieve
 * @returns {Promise<Object|null>} Exam record or null if not found
 */
export const getCustomExamById = async (examId) => {
  try {
    const exams = await getAllCustomExams();
    return exams.find(exam => exam.id === examId) || null;
  } catch (error) {
    console.error('❌ Error retrieving exam:', error);
    return null;
  }
};

/**
 * Update exam record (e.g., mark as completed, save user answers)
 * @param {string} examId - Exam ID to update
 * @param {Object} updates - Data to update
 * @returns {Promise<Object|null>} Updated exam record or null if not found
 */
export const updateCustomExam = async (examId, updates) => {
  try {
    const exams = await getAllCustomExams();
    const index = exams.findIndex(exam => exam.id === examId);

    if (index === -1) {
      console.warn('⚠️ Exam not found:', examId);
      return null;
    }

    // Update exam record
    const updatedExam = {
      ...exams[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    exams[index] = updatedExam;

    // Save to AsyncStorage
    await AsyncStorage.setItem(CUSTOM_EXAMS_KEY, JSON.stringify(exams));

    console.log('✅ Exam updated successfully:', examId);
    return updatedExam;
  } catch (error) {
    console.error('❌ Error updating exam:', error);
    throw error;
  }
};

/**
 * Delete a specific exam by ID
 * @param {string} examId - Exam ID to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteCustomExam = async (examId) => {
  try {
    const exams = await getAllCustomExams();
    const filteredExams = exams.filter(exam => exam.id !== examId);

    await AsyncStorage.setItem(CUSTOM_EXAMS_KEY, JSON.stringify(filteredExams));

    console.log('✅ Exam deleted successfully:', examId);
    return true;
  } catch (error) {
    console.error('❌ Error deleting exam:', error);
    throw error;
  }
};

/**
 * Clear all custom exam history
 * @returns {Promise<boolean>} Success status
 */
export const clearAllCustomExams = async () => {
  try {
    await AsyncStorage.removeItem(CUSTOM_EXAMS_KEY);
    console.log('✅ All exams cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing exams:', error);
    throw error;
  }
};

/**
 * Get exams filtered by subject
 * @param {number} subjectId - Subject ID to filter by
 * @returns {Promise<Object[]>} Array of exam records for that subject
 */
export const getExamsBySubject = async (subjectId) => {
  try {
    const exams = await getAllCustomExams();
    return exams.filter(exam => exam.subjectId === subjectId);
  } catch (error) {
    console.error('❌ Error filtering exams by subject:', error);
    return [];
  }
};

/**
 * Get exams filtered by difficulty
 * @param {string} difficulty - Difficulty level to filter by
 * @returns {Promise<Object[]>} Array of exam records for that difficulty
 */
export const getExamsByDifficulty = async (difficulty) => {
  try {
    const exams = await getAllCustomExams();
    return exams.filter(exam => exam.difficulty === difficulty);
  } catch (error) {
    console.error('❌ Error filtering exams by difficulty:', error);
    return [];
  }
};

/**
 * Get exam count statistics
 * @returns {Promise<Object>} Stats object with counts
 */
export const getExamStats = async () => {
  try {
    const exams = await getAllCustomExams();

    const stats = {
      total: exams.length,
      completed: exams.filter(e => e.status === 'completed').length,
      inProgress: exams.filter(e => e.status === 'in-progress').length,
      saved: exams.filter(e => e.status === 'saved').length,
    };

    return stats;
  } catch (error) {
    console.error('❌ Error getting exam stats:', error);
    return { total: 0, completed: 0, inProgress: 0, saved: 0 };
  }
};

/**
 * Search exams by subject name
 * @param {string} searchTerm - Search term to match
 * @returns {Promise<Object[]>} Array of matching exam records
 */
export const searchExams = async (searchTerm) => {
  try {
    const exams = await getAllCustomExams();
    const term = searchTerm.toLowerCase();

    return exams.filter(exam =>
      exam.subject.toLowerCase().includes(term) ||
      exam.topics.some(t => t.toLowerCase().includes(term))
    );
  } catch (error) {
    console.error('❌ Error searching exams:', error);
    return [];
  }
};
