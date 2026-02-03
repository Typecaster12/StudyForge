import axios from 'axios';

// Base API URL - change in production
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds (AI generation can take time)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token if needed
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response.data, // Return only data
  (error) => {
    const message = error.response?.data?.error?.message || error.message || 'An error occurred';
    
    // You can show toast notification here
    console.error('API Error:', message);
    
    return Promise.reject({
      message,
      status: error.response?.status,
      details: error.response?.data?.error?.details,
    });
  }
);

// ==================== Health Check ====================
export const checkHealth = () => api.get('/health');

// ==================== Generation APIs ====================

/**
 * Generate a syllabus from document content
 * @param {string} content - Document text content
 * @returns {Promise} Syllabus object
 */
export const generateSyllabus = (content) => {
  return api.post('/api/generate/syllabus', { content });
};

/**
 * Generate quiz questions from document content
 * @param {string} content - Document text content
 * @param {Object} options - Quiz options
 * @param {string} options.topic - Optional specific topic
 * @param {string} options.difficulty - 'easy', 'medium', or 'hard'
 * @param {number} options.questionCount - Number of questions
 * @returns {Promise} Quiz object with questions
 */
export const generateQuiz = (content, options = {}) => {
  const { topic, difficulty = 'medium', questionCount = 5 } = options;
  return api.post('/api/generate/quiz', {
    content,
    topic,
    difficulty,
    questionCount,
  });
};

/**
 * Generate flashcards from document content
 * @param {string} content - Document text content
 * @param {number} cardCount - Number of flashcards to generate
 * @returns {Promise} Flashcard deck object
 */
export const generateFlashcards = (content, cardCount = 10) => {
  return api.post('/api/generate/flashcards', { content, cardCount });
};

// ==================== Progress Tracking ====================

/**
 * Save study progress
 * @param {Object} progress - Progress data
 * @param {string} progress.documentId - UUID of the document
 * @param {string} progress.type - 'quiz' or 'flashcard'
 * @param {number} progress.score - Score achieved
 * @param {number} progress.total - Total possible score
 * @param {Object} progress.metadata - Optional metadata
 * @returns {Promise} Saved progress entry
 */
export const saveProgress = (progress) => {
  return api.post('/api/progress/save', progress);
};

/**
 * Get progress for a specific document
 * @param {string} documentId - UUID of the document
 * @returns {Promise} Progress statistics
 */
export const getDocumentProgress = (documentId) => {
  return api.get(`/api/progress/${documentId}`);
};

/**
 * Get overall progress statistics
 * @returns {Promise} Overall statistics
 */
export const getOverallProgress = () => {
  return api.get('/api/progress/stats/overall');
};

/**
 * Clear progress for a document
 * @param {string} documentId - UUID of the document
 * @returns {Promise} Success message
 */
export const clearDocumentProgress = (documentId) => {
  return api.delete(`/api/progress/${documentId}`);
};

// ==================== Document Upload (Coming Soon) ====================

/**
 * Upload a PDF document
 * @param {File} file - PDF file to upload
 * @param {Function} onProgress - Progress callback
 * @returns {Promise} Upload result with documentId
 */
export const uploadDocument = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};

// ==================== Chat (Coming Soon) ====================

/**
 * Chat with a document using RAG
 * @param {string} documentId - UUID of the document
 * @param {string} question - User's question
 * @returns {Promise} AI response
 */
export const chatWithDocument = (documentId, question) => {
  return api.post('/api/chat', { documentId, question });
};

// Export the axios instance for custom requests
export default api;
