"""
PDF text extraction and chunking service

Handles extracting text from PDF files and splitting it into
manageable chunks for embedding and vector storage.
"""
import PyPDF2
from typing import List
from flask import current_app

class PDFProcessor:
    """
    Handle PDF text extraction and chunking
    
    Uses PyPDF2 to extract text from PDF files and provides
    intelligent chunking with overlap for better context preservation.
    """
    
    @staticmethod
    def extract_text(pdf_path: str) -> str:
        """
        Extract all text from PDF file
        
        Iterates through all pages and extracts text content.
        Handles errors gracefully by skipping problematic pages.
        
        Args:
            pdf_path: Path to PDF file on filesystem
        
        Returns:
            Extracted text as string with page markers
        
        Raises:
            Exception: If PDF cannot be read or contains no text
        """
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text_parts = []
                
                # Extract text from each page
                for page_num, page in enumerate(pdf_reader.pages):
                    try:
                        text = page.extract_text()
                        if text.strip():
                            # Add page marker for context
                            text_parts.append(f"[Page {page_num + 1}]\n{text}")
                    except Exception as e:
                        # Skip problematic pages but log error
                        print(f"Error extracting page {page_num + 1}: {e}")
                        continue
                
                return "\n\n".join(text_parts)
        
        except Exception as e:
            raise Exception(f"Failed to extract PDF text: {str(e)}")
    
    @staticmethod
    def get_page_count(pdf_path: str) -> int:
        """
        Get number of pages in PDF
        
        Args:
            pdf_path: Path to PDF file
        
        Returns:
            Number of pages in the PDF
        
        Raises:
            Exception: If PDF cannot be read
        """
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                return len(pdf_reader.pages)
        except Exception as e:
            raise Exception(f"Failed to read PDF: {str(e)}")
    
    @staticmethod
    def chunk_text(text: str, chunk_size: int = None, overlap: int = None) -> List[str]:
        """
        Split text into overlapping chunks
        
        Uses intelligent chunking that:
        - Respects chunk size limits
        - Creates overlap between chunks for context
        - Tries to break at sentence/paragraph boundaries
        
        Args:
            text: Text to chunk
            chunk_size: Maximum characters per chunk (default: from config)
            overlap: Characters to overlap between chunks (default: from config)
        
        Returns:
            List of text chunks
        """
        # Use config defaults if not provided
        if chunk_size is None:
            chunk_size = current_app.config['CHUNK_SIZE']
        if overlap is None:
            overlap = current_app.config['CHUNK_OVERLAP']
        
        # Handle edge cases
        if not text or chunk_size <= 0:
            return []
        
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            # Calculate end position
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence or paragraph boundary
            if end < text_length:
                # Look for sentence end (period followed by space/newline)
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                break_point = max(last_period, last_newline)
                
                # Only break if not too early (at least half the chunk size)
                if break_point > chunk_size // 2:
                    chunk = chunk[:break_point + 1]
                    end = start + break_point + 1
            
            # Add chunk if not empty
            if chunk.strip():
                chunks.append(chunk.strip())
            
            # Move start position with overlap
            start = end - overlap
        
        return chunks
