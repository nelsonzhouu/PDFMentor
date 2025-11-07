"""
FAISS vector store for semantic search

Manages vector embeddings and similarity search using FAISS.
Stores document chunks as vectors for efficient retrieval.
"""
import faiss
import numpy as np
import pickle
import os
from typing import List, Tuple
from flask import current_app

class VectorStore:
    """
    FAISS-based vector store for document chunks
    
    Provides methods to:
    - Create index from embeddings
    - Search for similar chunks
    - Save/load index to/from disk
    """
    
    def __init__(self, document_id: str):
        """
        Initialize vector store for a document

        Args:
            document_id: Unique identifier for the document
        """
        self.document_id = document_id
        self.index = None
        self.chunks = []
        self.dimension = 3072  # Gemini gemini-embedding-001 dimension
    
    def create_index(self, chunks: List[str], embeddings: List[List[float]]):
        """
        Create FAISS index from chunks and embeddings
        
        Builds a flat L2 (Euclidean distance) index for similarity search.
        This is simple and accurate, suitable for small to medium datasets.
        
        Args:
            chunks: List of text chunks
            embeddings: Corresponding embedding vectors
        
        Raises:
            ValueError: If chunks or embeddings are empty
        """
        if not chunks or not embeddings:
            raise ValueError("Chunks and embeddings cannot be empty")

        self.chunks = chunks
        # Convert to numpy array with float32 (required by FAISS)
        embeddings_array = np.array(embeddings).astype('float32')

        # Create FAISS index using L2 (Euclidean) distance
        # IndexFlatL2 performs exact nearest neighbor search
        self.index = faiss.IndexFlatL2(self.dimension)
        self.index.add(embeddings_array)
    
    def search(self, query_embedding: List[float], k: int = None) -> List[Tuple[str, float]]:
        """
        Search for most similar chunks using vector similarity
        
        Performs k-nearest neighbor search to find chunks most
        semantically similar to the query.
        
        Args:
            query_embedding: Query embedding vector
            k: Number of results to return (default: from config)
        
        Returns:
            List of (chunk_text, distance) tuples, sorted by similarity
            Lower distance = more similar
        
        Raises:
            ValueError: If index not initialized
        """
        if k is None:
            k = current_app.config['TOP_K_RESULTS']
        
        if self.index is None:
            raise ValueError("Index not initialized")
        
        # Convert query to numpy array
        query_array = np.array([query_embedding]).astype('float32')
        
        # Search for k nearest neighbors
        # distances: L2 distances to nearest neighbors
        # indices: indices of nearest neighbors in the index
        distances, indices = self.index.search(query_array, k)
        
        # Build result list
        results = []
        for idx, distance in zip(indices[0], distances[0]):
            if idx < len(self.chunks):
                results.append((self.chunks[idx], float(distance)))
        
        return results
    
    def save(self):
        """
        Save index and chunks to disk
        
        Persists the FAISS index and chunks so they can be
        reloaded later without re-embedding the document.
        
        Raises:
            ValueError: If index not initialized
        """
        if self.index is None:
            raise ValueError("Index not initialized")
        
        data_folder = current_app.config['DATA_FOLDER']
        index_path = os.path.join(data_folder, f"{self.document_id}.index")
        chunks_path = os.path.join(data_folder, f"{self.document_id}.chunks")
        
        # Save FAISS index
        faiss.write_index(self.index, index_path)
        
        # Save chunks using pickle
        with open(chunks_path, 'wb') as f:
            pickle.dump(self.chunks, f)
    
    def load(self):
        """
        Load index and chunks from disk
        
        Restores a previously saved vector store.
        
        Raises:
            FileNotFoundError: If vector store files don't exist
        """
        data_folder = current_app.config['DATA_FOLDER']
        index_path = os.path.join(data_folder, f"{self.document_id}.index")
        chunks_path = os.path.join(data_folder, f"{self.document_id}.chunks")
        
        if not os.path.exists(index_path) or not os.path.exists(chunks_path):
            raise FileNotFoundError(f"Vector store not found for document {self.document_id}")
        
        # Load FAISS index
        self.index = faiss.read_index(index_path)
        
        # Load chunks from pickle
        with open(chunks_path, 'rb') as f:
            self.chunks = pickle.load(f)
    
    @staticmethod
    def exists(document_id: str) -> bool:
        """
        Check if vector store exists for document
        
        Args:
            document_id: Document ID to check
        
        Returns:
            True if vector store files exist, False otherwise
        """
        data_folder = current_app.config['DATA_FOLDER']
        index_path = os.path.join(data_folder, f"{document_id}.index")
        return os.path.exists(index_path)
