"""
Chat and Q&A routes

Handles:
- Question answering
- Rate limit checking
"""
from flask import Blueprint, request, jsonify, session, current_app
from app.services.vector_store import VectorStore
from app.services.gemini_client import gemini_client
from app.services.rate_limiter import rate_limiter
from datetime import datetime

# Create blueprint for chat routes
bp = Blueprint('chat', __name__, url_prefix='/api')

def get_client_identifier():
    """
    Get unique identifier for rate limiting
    
    Uses Flask sessions to track users. In production, you might
    want to use IP addresses or authenticated user IDs instead.
    
    Returns:
        Unique client identifier string
    """
    if 'client_id' not in session:
        import uuid
        session['client_id'] = str(uuid.uuid4())
    return session['client_id']

@bp.route('/chat', methods=['POST'])
def ask_question():
    """
    Handle question answering requests
    
    Process:
    1. Validate input
    2. Check rate limit
    3. Load vector store for document
    4. Generate query embedding
    5. Search for relevant chunks
    6. Generate answer using LLM
    7. Return answer and updated rate limit info
    
    Returns:
        JSON response with answer and rate limit information
    """
    try:
        data = request.get_json()
        
        # Validate request data
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        document_id = data.get('document_id')
        question = data.get('question', '').strip()
        
        # Validate inputs
        if not document_id:
            return jsonify({'error': 'Document ID required'}), 400
        
        if not question:
            return jsonify({'error': 'Question required'}), 400
        
        if len(question) > 500:
            return jsonify({'error': 'Question too long (max 500 characters)'}), 400
        
        # Check rate limit
        client_id = get_client_identifier()
        is_allowed, remaining, reset_time = rate_limiter.check_rate_limit(client_id)
        
        if not is_allowed:
            return jsonify({
                'error': 'Rate limit exceeded',
                'rateLimitInfo': {
                    'questionsRemaining': 0,
                    'resetTime': reset_time.isoformat()
                }
            }), 429
        
        # Load vector store for document
        if not VectorStore.exists(document_id):
            return jsonify({'error': 'Document not found'}), 404
        
        vector_store = VectorStore(document_id)
        vector_store.load()
        
        # Generate embedding for the question
        query_embedding = gemini_client.get_query_embedding(question)
        
        # Search for relevant chunks using semantic similarity
        results = vector_store.search(query_embedding)
        
        # Combine context from top results
        # Each result is (chunk_text, distance)
        context = "\n\n".join([chunk for chunk, _ in results])
        
        # Generate answer using Gemini LLM
        answer = gemini_client.generate_answer(question, context)
        
        # Return answer with rate limit info
        return jsonify({
            'answer': answer,
            'rateLimitInfo': {
                'questionsRemaining': remaining,
                'resetTime': reset_time.isoformat()
            }
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"Chat error: {str(e)}")
        return jsonify({
            'error': 'Failed to process question',
            'details': str(e)
        }), 500

@bp.route('/rate-limit', methods=['GET'])
def get_rate_limit():
    """
    Get current rate limit status
    
    Returns current rate limit information without consuming
    a request from the quota.
    
    Returns:
        JSON response with questions remaining and reset time
    """
    try:
        client_id = get_client_identifier()
        remaining, reset_time = rate_limiter.get_remaining(client_id)
        
        return jsonify({
            'questionsRemaining': remaining,
            'resetTime': reset_time.isoformat()
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"Rate limit check error: {str(e)}")
        return jsonify({'error': 'Failed to check rate limit'}), 500
