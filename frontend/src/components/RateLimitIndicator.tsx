/**
 * RateLimitIndicator Component
 *
 * Displays the current rate limit status to the user.
 * Features:
 * - Shows questions remaining out of 40
 * - Visual progress bar
 * - Color-coded status (green, orange, red)
 * - Reset time display
 * - Warning when limit is low or exceeded
 */

import React from 'react';
import type { RateLimitInfo } from '../types';

interface RateLimitIndicatorProps {
  rateLimitInfo: RateLimitInfo | null;  // Current rate limit info (null if not yet fetched)
}

const RateLimitIndicator: React.FC<RateLimitIndicatorProps> = ({ rateLimitInfo }) => {
  // Don't render anything if no rate limit info available yet
  if (!rateLimitInfo) return null;

  // Calculate percentage for progress bar (0-100%)
  const percentage = (rateLimitInfo.questionsRemaining / 40) * 100;
  
  // Determine status level for color coding
  const isLow = rateLimitInfo.questionsRemaining <= 10;      // Warning threshold
  const isCritical = rateLimitInfo.questionsRemaining === 0;  // Limit exceeded

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      {/* Header with count */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Questions Remaining</span>
        <span className={`text-lg font-bold ${
          isCritical ? 'text-red-600 dark:text-red-400' :    // Red when limit exceeded
          isLow ? 'text-orange-600 dark:text-orange-400' :       // Orange when running low
          'text-green-600 dark:text-green-400'                  // Green when plenty remaining
        }`}>
          {rateLimitInfo.questionsRemaining} / 40
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${
            isCritical ? 'bg-red-600 dark:bg-red-500' :     // Red bar when limit exceeded
            isLow ? 'bg-orange-500 dark:bg-orange-400' :        // Orange bar when running low
            'bg-green-500 dark:bg-green-400'                   // Green bar when plenty remaining
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {/* Status message */}
      {isCritical ? (
        /* Critical state - rate limit exceeded */
        <p className="text-xs text-red-600 dark:text-red-400">
          Rate limit reached. Resets at {new Date(rateLimitInfo.resetTime).toLocaleTimeString()}
        </p>
      ) : (
        /* Normal state - show reset time */
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Resets at {new Date(rateLimitInfo.resetTime).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default RateLimitIndicator;
