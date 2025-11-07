/**
 * Type Definitions for PDFMentor
 *
 * This file contains all TypeScript interfaces and types used throughout
 * the application for type safety and better developer experience.
 */

/**
 * Represents an uploaded PDF document
 */
export interface PDFDocument {
  id: string;              // Unique identifier from backend
  filename: string;        // Original filename
  uploadedAt: Date;        // Upload timestamp
  pageCount?: number;      // Number of pages in the PDF
}

/**
 * Represents a chat message (user question or assistant answer)
 */
export interface Message {
  id: string;              // Unique message identifier
  role: 'user' | 'assistant';  // Who sent the message
  content: string;         // Message text content
  timestamp: Date;         // When the message was created
}

/**
 * Rate limiting information
 */
export interface RateLimitInfo {
  questionsRemaining: number;  // How many questions left in current window
  resetTime: Date;             // When the rate limit resets
}

/**
 * Response from the chat API endpoint
 */
export interface ChatResponse {
  answer: string;              // AI-generated answer
  rateLimitInfo: RateLimitInfo;  // Updated rate limit info
}

/**
 * Response from the PDF upload API endpoint
 */
export interface UploadResponse {
  success: boolean;        // Whether upload was successful
  documentId: string;      // Unique ID for the uploaded document
  filename: string;        // Sanitized filename
  pageCount: number;       // Number of pages in PDF
  message: string;         // Success message
}

/**
 * Error response from API
 */
export interface ApiError {
  error: string;           // Error message
  details?: string;        // Additional error details (optional)
}
