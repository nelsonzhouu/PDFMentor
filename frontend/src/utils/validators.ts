/**
 * File Validation Utilities for PDFMentor
 *
 * Provides client-side validation for PDF file uploads to ensure
 * security and proper file handling before sending to backend.
 */

// Maximum allowed file size: 1MB (in bytes)
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

// Allowed MIME type for uploads
const ALLOWED_MIME_TYPE = 'application/pdf';

/**
 * Result of file validation
 */
interface ValidationResult {
  valid: boolean;      // Whether the file passed validation
  error?: string;      // Error message if validation failed
}

/**
 * Validates a PDF file before upload
 *
 * Checks:
 * - File type matches PDF MIME type
 * - File has .pdf extension
 * - File size is within limits
 * - File is not empty
 *
 * @param file - The File object to validate
 * @returns Validation result with success status and error message if any
 */
export const validatePDFFile = (file: File): ValidationResult => {
  // Check file type using MIME type
  if (file.type !== ALLOWED_MIME_TYPE) {
    return {
      valid: false,
      error: 'Only PDF files are allowed'
    };
  }

  // Check file extension as additional validation
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return {
      valid: false,
      error: 'File must have .pdf extension'
    };
  }

  // Check file size doesn't exceed maximum
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  // Check for empty file
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty'
    };
  }

  // All validations passed
  return { valid: true };
};

/**
 * Sanitizes a filename by removing potentially dangerous characters
 *
 * This is a basic sanitization - the backend will do more thorough
 * sanitization for security.
 *
 * @param filename - The original filename
 * @returns Sanitized filename safe for display
 */
export const sanitizeFilename = (filename: string): string => {
  // Remove path traversal attempts and special characters
  // Replace unsafe characters with underscores
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
};
