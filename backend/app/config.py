"""
Configuration settings for PDFMentor backend

This module contains all configuration variables for the application,
loaded from environment variables with sensible defaults.
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration class with all settings"""
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Google Gemini API Configuration
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    GEMINI_EMBEDDING_MODEL = 'models/gemini-embedding-001'  # Free tier embedding model
    GEMINI_LLM_MODEL = 'gemini-2.0-flash-lite'  # Free tier LLM model (fast and efficient)
    
    # File Upload Configuration
    MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', 1 * 1024 * 1024))  # 1MB default
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    DATA_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    ALLOWED_EXTENSIONS = {'pdf'}  # Only PDF files allowed
    
    # Rate Limiting Configuration
    RATE_LIMIT_QUESTIONS = int(os.getenv('RATE_LIMIT_QUESTIONS', 40))  # 40 questions
    RATE_LIMIT_WINDOW = int(os.getenv('RATE_LIMIT_WINDOW', 3600))  # 1 hour in seconds
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # Vector Store Configuration
    CHUNK_SIZE = 1000  # Characters per text chunk
    CHUNK_OVERLAP = 200  # Overlap between chunks for context
    TOP_K_RESULTS = 3  # Number of similar chunks to retrieve
    
    @staticmethod
    def init_app(app):
        """
        Initialize application directories
        
        Creates necessary directories if they don't exist:
        - uploads: for temporary PDF storage
        - data: for vector store persistence
        """
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(Config.DATA_FOLDER, exist_ok=True)
