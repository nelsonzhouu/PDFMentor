/**
 * ChatBox Component
 *
 * Interactive chat interface for asking questions about the PDF.
 * Features:
 * - Message history display
 * - User and assistant message styling
 * - Auto-scroll to latest message
 * - Input field with send button
 * - Loading state with typing indicator
 * - Disabled state when rate limit exceeded
 */

import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';

interface ChatBoxProps {
  messages: Message[];                   // Array of chat messages to display
  onSendMessage: (message: string) => void;  // Callback when user sends a message
  isLoading: boolean;                    // Whether waiting for AI response
  disabled?: boolean;                    // Whether chat input is disabled
}

const ChatBox: React.FC<ChatBoxProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading,
  disabled = false 
}) => {
  // Track current input value
  const [input, setInput] = useState('');
  // Reference to bottom of messages for auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Scrolls chat to the bottom to show latest message
   * Uses smooth scrolling for better UX
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Auto-scroll whenever messages change
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Handles form submission (Enter key or Send button click)
   * Validates input and calls parent callback
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Only send if input is not empty and not loading
    if (input.trim() && !isLoading && !disabled) {
      onSendMessage(input.trim());
      setInput(''); // Clear input after sending
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Ask Questions</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Ask anything about your PDF document</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          /* Empty State - shown when no messages */
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <p>No messages yet. Start by asking a question!</p>
          </div>
        ) : (
          /* Message List */
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary dark:bg-blue-600 text-white'           // User messages: blue background
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'       // Assistant messages: gray background
                }`}
              >
                {/* Message content */}
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                {/* Timestamp */}
                <p className="text-xs mt-1 opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}

        {/* Loading Indicator - shown while waiting for response */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
              <div className="flex space-x-2">
                {/* Animated typing dots */}
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor - always at the bottom */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex gap-2">
          {/* Text input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={disabled ? "Upload a PDF to start asking questions" : "Type your question..."}
            disabled={isLoading || disabled}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            maxLength={500} // Limit question length
          />
          {/* Send button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading || disabled}
            className="px-6 py-3 bg-primary dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
