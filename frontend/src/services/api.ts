/**
 * API Service for PDFMentor
 *
 * Provides a centralized service for all backend API communications.
 * Uses Axios for HTTP requests with proper error handling and type safety.
 */

import axios, { AxiosError } from 'axios';
import type { UploadResponse, ChatResponse, ApiError } from '../types';

// Base URL for all API requests (proxied by Vite in development)
const API_BASE_URL = '/api';

/**
 * Create axios instance with default configuration
 * - Sets base URL for all requests
 * - Sets default headers
 * - Sets timeout to prevent hanging requests
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

/**
 * Response interceptor for consistent error handling
 * Extracts error messages from API responses and converts them to Error objects
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Extract error message from response or use default
    const errorMessage = error.response?.data?.error || 'An unexpected error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

/**
 * Uploads a PDF file to the backend for processing
 *
 * The backend will:
 * 1. Validate the PDF file
 * 2. Extract text content
 * 3. Generate embeddings
 * 4. Store in vector database
 *
 * @param file - The PDF File object to upload
 * @returns Promise with upload response containing document ID and metadata
 * @throws Error if upload fails or file is invalid
 */
export const uploadPDF = async (file: File): Promise<UploadResponse> => {
  // Create FormData to send file as multipart/form-data
  const formData = new FormData();
  formData.append('file', file);

  // Send POST request with file
  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Asks a question about an uploaded PDF document
 *
 * The backend will:
 * 1. Check rate limits
 * 2. Generate embedding for the question
 * 3. Search vector store for relevant context
 * 4. Generate answer using Gemini LLM
 *
 * @param documentId - Unique ID of the uploaded document
 * @param question - User's question about the document
 * @returns Promise with AI-generated answer and updated rate limit info
 * @throws Error if question fails or rate limit exceeded
 */
export const askQuestion = async (
  documentId: string,
  question: string
): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>('/chat', {
    document_id: documentId,
    question: question.trim(),
  });

  return response.data;
};

/**
 * Gets current rate limit status for the user
 *
 * @returns Promise with questions remaining and reset time
 * @throws Error if request fails
 */
export const getRateLimitInfo = async (): Promise<{ questionsRemaining: number; resetTime: string }> => {
  const response = await api.get('/rate-limit');
  return response.data;
};

// Export the configured axios instance for custom requests if needed
export default api;
