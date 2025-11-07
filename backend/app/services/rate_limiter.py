"""
Rate limiting service for question requests

Implements a simple in-memory rate limiter to restrict users to
40 questions per hour. Uses session-based tracking.
"""
from datetime import datetime, timedelta
from typing import Dict, Tuple, List
from flask import current_app

class RateLimiter:
    """
    Simple in-memory rate limiter
    
    Tracks request timestamps for each user/session and enforces
    a sliding window rate limit (40 requests per hour by default).
    """
    
    def __init__(self):
        # Dictionary mapping identifier -> list of request timestamps
        self._requests: Dict[str, List[datetime]] = {}
    
    def check_rate_limit(self, identifier: str) -> Tuple[bool, int, datetime]:
        """
        Check if request is within rate limit
        
        Uses a sliding window approach - removes requests older than
        the time window and checks if under the limit.
        
        Args:
            identifier: Unique identifier (e.g., session_id, IP address)
        
        Returns:
            Tuple of (is_allowed, questions_remaining, reset_time)
            - is_allowed: True if request is allowed
            - questions_remaining: Number of requests left in window
            - reset_time: When the oldest request expires
        """
        now = datetime.utcnow()
        window = timedelta(seconds=current_app.config['RATE_LIMIT_WINDOW'])
        max_requests = current_app.config['RATE_LIMIT_QUESTIONS']
        
        # Initialize or clean old requests
        if identifier not in self._requests:
            self._requests[identifier] = []
        
        # Remove requests outside the time window (sliding window)
        self._requests[identifier] = [
            req_time for req_time in self._requests[identifier]
            if now - req_time < window
        ]
        
        # Calculate reset time (when oldest request expires)
        if self._requests[identifier]:
            reset_time = self._requests[identifier][0] + window
        else:
            reset_time = now + window
        
        # Check if under limit
        current_count = len(self._requests[identifier])
        questions_remaining = max(0, max_requests - current_count)
        
        if current_count < max_requests:
            # Allow request and add to tracking
            self._requests[identifier].append(now)
            return True, questions_remaining - 1, reset_time
        
        # Rate limit exceeded
        return False, 0, reset_time
    
    def get_remaining(self, identifier: str) -> Tuple[int, datetime]:
        """
        Get remaining questions for identifier without consuming a request
        
        Args:
            identifier: Unique identifier to check
        
        Returns:
            Tuple of (questions_remaining, reset_time)
        """
        now = datetime.utcnow()
        window = timedelta(seconds=current_app.config['RATE_LIMIT_WINDOW'])
        max_requests = current_app.config['RATE_LIMIT_QUESTIONS']
        
        if identifier not in self._requests:
            return max_requests, now + window
        
        # Clean old requests
        self._requests[identifier] = [
            req_time for req_time in self._requests[identifier]
            if now - req_time < window
        ]
        
        current_count = len(self._requests[identifier])
        questions_remaining = max(0, max_requests - current_count)
        
        if self._requests[identifier]:
            reset_time = self._requests[identifier][0] + window
        else:
            reset_time = now + window
        
        return questions_remaining, reset_time

# Global rate limiter instance
# In production, use Redis or similar for distributed rate limiting
rate_limiter = RateLimiter()
