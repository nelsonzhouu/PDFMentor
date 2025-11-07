/**
 * PDFUploader Component
 *
 * Provides a drag-and-drop interface for uploading PDF files.
 * Features:
 * - Drag and drop support
 * - Click to browse files
 * - Visual feedback during drag operations
 * - Client-side file validation
 * - Loading state during upload
 */

import React, { useCallback, useState } from 'react';
import { validatePDFFile } from '../utils/validators';

interface PDFUploaderProps {
  onFileUpload: (file: File) => void;  // Callback when valid file is selected
  isUploading: boolean;                // Whether upload is in progress
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onFileUpload, isUploading }) => {
  // Track whether user is currently dragging over the drop zone
  const [dragActive, setDragActive] = useState(false);
  // Track validation errors to display to user
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles drag events (enter, over, leave)
   * Provides visual feedback when user drags files over the drop zone
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  /**
   * Handles file drop event
   * Validates the dropped file and calls onFileUpload if valid
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    // Check if files were dropped
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]; // Only take first file
      const validation = validatePDFFile(file);

      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      // File is valid, call parent callback
      onFileUpload(file);
    }
  }, [onFileUpload]);

  /**
   * Handles file selection via file input (click to browse)
   * Validates the selected file and calls onFileUpload if valid
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validation = validatePDFFile(file);

      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      // File is valid, call parent callback
      onFileUpload(file);
    }
  }, [onFileUpload]);

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <form
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className="relative"
      >
        {/* Hidden file input - triggered when user clicks on label */}
        <input
          type="file"
          id="pdf-upload"
          accept=".pdf,application/pdf"
          onChange={handleChange}
          disabled={isUploading}
          className="hidden"
        />

        {/* Drop zone label - acts as upload button and drop target */}
        <label
          htmlFor="pdf-upload"
          className={`
            flex flex-col items-center justify-center
            w-full h-64 border-2 border-dashed rounded-lg
            cursor-pointer transition-all duration-200
            ${dragActive ? 'border-primary bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-blue-500'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {/* Upload icon */}
            <svg
              className="w-12 h-12 mb-4 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>

            {/* Upload text */}
            {isUploading ? (
              <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Uploading...</p>
            ) : (
              <>
                <p className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
                  Drop your PDF here or click to browse
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Only PDF files up to 1MB are supported
                </p>
              </>
            )}
          </div>
        </label>
      </form>

      {/* Error message display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
};

export default PDFUploader;
