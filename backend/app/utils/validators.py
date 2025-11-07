"""
File validation utilities

Provides server-side validation for uploaded files to ensure security.
Validates file extensions, MIME types, and file sizes.
"""
import os
from werkzeug.utils import secure_filename
from flask import current_app

def allowed_file(filename: str) -> bool:
    """
    Check if file extension is allowed
    
    Args:
        filename: Name of the file to check
    
    Returns:
        True if file extension is in ALLOWED_EXTENSIONS, False otherwise
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def validate_pdf_file(file) -> tuple[bool, str]:
    """
    Validate uploaded PDF file with multiple security checks

    Performs the following validations:
    1. File existence check
    2. Filename validation
    3. File extension check
    4. File size check
    5. PDF header validation (magic bytes)

    Args:
        file: FileStorage object from Flask request

    Returns:
        Tuple of (is_valid, error_message)
        - is_valid: True if file passes all validations
        - error_message: Description of error if validation fails
    """
    # Check if file exists
    if not file:
        return False, "No file provided"

    # Check filename
    if file.filename == '':
        return False, "No file selected"

    # Check file extension
    if not allowed_file(file.filename):
        return False, "Only PDF files are allowed"

    # Read first few bytes to check file size and magic number
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    # Check file size
    if file_size == 0:
        return False, "File is empty"

    if file_size > current_app.config['MAX_FILE_SIZE']:
        max_mb = current_app.config['MAX_FILE_SIZE'] / (1024 * 1024)
        return False, f"File size exceeds {max_mb:.0f}MB limit"

    # Validate PDF header (magic bytes)
    # PDF files must start with %PDF-
    header = file.read(5)
    file.seek(0)

    if header != b'%PDF-':
        return False, "File is not a valid PDF"

    return True, ""

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks
    
    Uses werkzeug's secure_filename which:
    - Removes path components (../, etc.)
    - Removes special characters
    - Converts to ASCII
    
    Args:
        filename: Original filename
    
    Returns:
        Sanitized filename safe for filesystem use
    """
    return secure_filename(filename)
