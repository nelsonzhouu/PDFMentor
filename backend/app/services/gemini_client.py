"""
Google Gemini API client for embeddings and chat

Provides a wrapper around the Gemini API for:
- Generating text embeddings for semantic search
- Generating answers using the LLM

Uses free tier models: embedding-001 and gemini-pro
"""
import google.generativeai as genai
from typing import List
from flask import current_app

class GeminiClient:
    """
    Wrapper for Gemini API operations
    
    Handles lazy initialization and provides methods for
    embeddings and text generation using Gemini's free tier models.
    """
    
    def __init__(self):
        self._initialized = False
    
    def _ensure_initialized(self):
        """
        Lazy initialization of Gemini API
        
        Only configures the API when first used to avoid
        unnecessary initialization if API key is not set.
        
        Raises:
            ValueError: If GEMINI_API_KEY is not configured
        """
        if not self._initialized:
            api_key = current_app.config['GEMINI_API_KEY']
            if not api_key:
                raise ValueError("GEMINI_API_KEY not configured")
            
            genai.configure(api_key=api_key)
            self._initialized = True
    
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for list of texts using Gemini

        Uses the free embedding-001 model to convert text into
        768-dimensional vectors for semantic search.

        Batches requests to avoid rate limits - sends up to 50 texts
        per API call instead of one-by-one.

        Args:
            texts: List of text strings to embed

        Returns:
            List of embedding vectors (each is a list of floats)

        Raises:
            Exception: If embedding generation fails
        """
        self._ensure_initialized()

        try:
            embeddings = []
            model = current_app.config['GEMINI_EMBEDDING_MODEL']
            batch_size = 50  # Batch size under API limit of 100

            current_app.logger.info(f"Processing {len(texts)} texts in batches of {batch_size}")

            # Process texts in batches to avoid rate limits
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                current_app.logger.info(f"Batch {i//batch_size + 1}: Processing {len(batch)} texts")

                # Send batch as single API request
                result = genai.embed_content(
                    model=model,
                    content=batch,
                    task_type="retrieval_document"  # Optimized for document retrieval
                )
                current_app.logger.info(f"Batch {i//batch_size + 1}: Successfully received embeddings")

                # Extract embeddings from batch result
                # API returns a list of embeddings when given a list of texts
                batch_embeddings = result.get('embedding', result)

                # Handle both single embedding and list of embeddings
                if isinstance(batch_embeddings, list) and len(batch_embeddings) > 0:
                    # Check if first element is itself a list (multiple embeddings)
                    if isinstance(batch_embeddings[0], list):
                        # Multiple embeddings returned
                        embeddings.extend(batch_embeddings)
                    else:
                        # Single embedding returned (batch size was 1)
                        embeddings.append(batch_embeddings)
                else:
                    # Fallback for unexpected format
                    embeddings.append(batch_embeddings)

            return embeddings

        except Exception as e:
            raise Exception(f"Failed to generate embeddings: {str(e)}")
    
    def get_query_embedding(self, query: str) -> List[float]:
        """
        Generate embedding for search query
        
        Uses task_type="retrieval_query" which is optimized
        for query embeddings (different from document embeddings).
        
        Args:
            query: Search query text
        
        Returns:
            Embedding vector (list of floats)
        
        Raises:
            Exception: If embedding generation fails
        """
        self._ensure_initialized()
        
        try:
            model = current_app.config['GEMINI_EMBEDDING_MODEL']
            result = genai.embed_content(
                model=model,
                content=query,
                task_type="retrieval_query"  # Optimized for queries
            )
            return result['embedding']
        
        except Exception as e:
            raise Exception(f"Failed to generate query embedding: {str(e)}")
    
    def generate_answer(self, question: str, context: str) -> str:
        """
        Generate answer using Gemini LLM
        
        Uses the free gemini-pro model to generate an answer
        based on the provided context from the PDF.
        
        Args:
            question: User's question
            context: Relevant context from PDF (retrieved chunks)
        
        Returns:
            Generated answer as string
        
        Raises:
            Exception: If answer generation fails
        """
        self._ensure_initialized()
        
        try:
            model = genai.GenerativeModel(current_app.config['GEMINI_LLM_MODEL'])
            
            # Craft prompt with context and question
            prompt = f"""You are a helpful assistant that answers questions based on the provided PDF document context.

Context from the PDF:
{context}

Question: {question}

Please provide a clear, accurate answer based solely on the context provided. If the answer cannot be found in the context, say so politely."""

            # Generate response
            response = model.generate_content(prompt)
            return response.text
        
        except Exception as e:
            raise Exception(f"Failed to generate answer: {str(e)}")

# Global client instance
gemini_client = GeminiClient()
