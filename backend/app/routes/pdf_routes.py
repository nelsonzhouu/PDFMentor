"""
PDF upload and processing routes

Handles:
- PDF file upload
- Document deletion
"""
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
import uuid
from app.utils.validators import validate_pdf_file, sanitize_filename
from app.services.pdf_processor import PDFProcessor
from app.services.gemini_client import gemini_client
from app.services.vector_store import VectorStore

# Create blueprint for PDF routes
bp = Blueprint('pdf', __name__, url_prefix='/api')

@bp.route('/upload', methods=['POST'])
def upload_pdf():
    """
    Handle PDF file upload and processing
    
    Process:
    1. Validate uploaded file
    2. Save file temporarily
    3. Extract text from PDF
    4. Chunk text into segments
    5. Generate embeddings for chunks
    6. Create and save vector store
    7. Return document metadata
    
    Returns:
        JSON response with document ID and metadata
    """
    try:
        # Validate file presence in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        # Validate PDF file
        is_valid, error_message = validate_pdf_file(file)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        # Generate unique document ID
        document_id = str(uuid.uuid4())
        
        # Save file securely
        filename = sanitize_filename(file.filename)
        safe_filename = f"{document_id}_{filename}"
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], safe_filename)
        file.save(filepath)
        
        try:
            # Extract text from PDF
            pdf_processor = PDFProcessor()
            text = pdf_processor.extract_text(filepath)
            page_count = pdf_processor.get_page_count(filepath)
            
            # Check if PDF contains extractable text
            if not text.strip():
                os.remove(filepath)
                return jsonify({'error': 'PDF contains no extractable text'}), 400
            
            # Chunk text for embedding
            chunks = pdf_processor.chunk_text(text)
            
            # Generate embeddings using Gemini
            embeddings = gemini_client.get_embeddings(chunks)
            
            # Create and save vector store
            vector_store = VectorStore(document_id)
            vector_store.create_index(chunks, embeddings)
            vector_store.save()

            # Delete the uploaded PDF file (no longer needed after processing)
            # We only need the vector embeddings, not the original file
            os.remove(filepath)

            # Return success response
            return jsonify({
                'success': True,
                'documentId': document_id,
                'filename': filename,
                'pageCount': page_count,
                'message': 'PDF processed successfully'
            }), 200
        
        except Exception as e:
            # Clean up on error
            if os.path.exists(filepath):
                os.remove(filepath)
            raise e
    
    except Exception as e:
        current_app.logger.error(f"Upload error: {str(e)}")
        return jsonify({
            'error': 'Failed to process PDF',
            'details': str(e)
        }), 500

@bp.route('/documents/<document_id>', methods=['DELETE'])
def delete_document(document_id):
    """
    Delete document's vector store

    Removes:
    - Vector store index
    - Vector store chunks

    Note: Uploaded PDF files are deleted immediately after processing,
    so only vector store files need to be cleaned up.

    Args:
        document_id: ID of document to delete

    Returns:
        JSON response with success status
    """
    try:
        # Remove vector store files
        data_folder = current_app.config['DATA_FOLDER']
        index_path = os.path.join(data_folder, f"{document_id}.index")
        chunks_path = os.path.join(data_folder, f"{document_id}.chunks")

        if os.path.exists(index_path):
            os.remove(index_path)
        if os.path.exists(chunks_path):
            os.remove(chunks_path)

        return jsonify({'success': True}), 200

    except Exception as e:
        current_app.logger.error(f"Delete error: {str(e)}")
        return jsonify({'error': 'Failed to delete document'}), 500
