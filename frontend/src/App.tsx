/**
 * PDFMentor - Main Application Component
 *
 * This is the root component that manages the entire application state and layout.
 * It handles:
 * - PDF file upload and processing
 * - Document state management
 * - Chat messages and Q&A functionality
 * - Rate limiting information
 * - Error handling
 */

import { useState, useCallback, useEffect } from 'react'
import PDFUploader from './components/PDFUploader'
import PDFViewer from './components/PDFViewer'
import ChatBox from './components/ChatBox'
import RateLimitIndicator from './components/RateLimitIndicator'
import { uploadPDF, askQuestion } from './services/api'
import type { Message, RateLimitInfo, PDFDocument } from './types'

function App() {
  // State for the uploaded PDF document
  const [document, setDocument] = useState<PDFDocument | null>(null)
  // URL for displaying the PDF in the viewer
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  // Chat messages between user and assistant
  const [messages, setMessages] = useState<Message[]>([])
  // Loading states for upload and chat operations
  const [isUploading, setIsUploading] = useState(false)
  const [isAsking, setIsAsking] = useState(false)
  // Rate limiting information (questions remaining, reset time)
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null)
  // Error messages to display to user
  const [error, setError] = useState<string | null>(null)
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false)

  /**
   * Apply dark mode class to document element
   */
  useEffect(() => {
    if (isDarkMode) {
      window.document.documentElement.classList.add('dark')
    } else {
      window.document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  /**
   * Handles PDF file upload
   * Uploads the file to backend, processes it, and updates state
   *
   * @param file - The PDF file to upload
   */
  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true)
    setError(null)

    try {
      // Upload PDF to backend for processing
      const response = await uploadPDF(file)

      // Create document object with metadata
      const newDoc: PDFDocument = {
        id: response.documentId,
        filename: response.filename,
        uploadedAt: new Date(),
        pageCount: response.pageCount,
      }

      setDocument(newDoc)
      // Create local URL for PDF viewer
      setFileUrl(URL.createObjectURL(file))
      // Clear previous chat messages
      setMessages([])

      // Show success message to user
      const successMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Successfully loaded "${response.filename}". You can now ask questions about this document!`,
        timestamp: new Date(),
      }
      setMessages([successMessage])
    } catch (err) {
      // Handle upload errors
      setError(err instanceof Error ? err.message : 'Failed to upload PDF')
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }, [])

  /**
   * Handles sending a question to the backend
   * Sends user question, receives AI-generated answer
   *
   * @param question - The user's question about the PDF
   */
  const handleSendMessage = useCallback(async (question: string) => {
    if (!document) return

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsAsking(true)
    setError(null)

    try {
      // Send question to backend API
      const response = await askQuestion(document.id, question)

      // Add assistant's answer to chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
      // Update rate limit information
      setRateLimitInfo(response.rateLimitInfo)
    } catch (err) {
      // Handle question errors
      setError(err instanceof Error ? err.message : 'Failed to get answer')

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsAsking(false)
    }
  }, [document])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-700 shadow-sm border-b dark:border-gray-600">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PDFMentor</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Your AI-powered PDF assistant</p>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              // Sun icon for light mode
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              // Moon icon for dark mode
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Error Banner - displayed when errors occur */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 p-4 rounded">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!document ? (
          /* Upload View - shown when no PDF is uploaded */
          <div className="flex items-center justify-center min-h-[60vh]">
            <PDFUploader onFileUpload={handleFileUpload} isUploading={isUploading} />
          </div>
        ) : (
          /* PDF + Chat View - shown after PDF is uploaded */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: PDF Viewer */}
            <div className="h-[80vh] flex flex-col gap-4">
              {/* Document Info Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex-shrink-0">
                <h3 className="font-semibold text-gray-800 dark:text-white truncate">{document.filename}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {document.pageCount} pages • Uploaded {document.uploadedAt.toLocaleTimeString()}
                </p>
                <button
                  onClick={() => {
                    // Reset all state to upload a new PDF
                    setDocument(null)
                    setFileUrl(null)
                    setMessages([])
                    setRateLimitInfo(null)
                  }}
                  className="mt-2 text-sm text-primary dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                >
                  Upload Different PDF
                </button>
              </div>

              {/* PDF Viewer Component - takes remaining height */}
              {fileUrl && <div className="flex-1 min-h-0"><PDFViewer fileUrl={fileUrl} /></div>}
            </div>

            {/* Right: Chat Interface */}
            <div className="h-[80vh] flex flex-col gap-4">
              {/* Rate Limit Indicator */}
              <RateLimitIndicator rateLimitInfo={rateLimitInfo} />

              {/* Chat Box */}
              <div className="flex-1 min-h-0">
                <ChatBox
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isAsking}
                  // Disable chat if rate limit is exceeded
                  disabled={rateLimitInfo?.questionsRemaining === 0}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
