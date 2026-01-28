"""
Embedding Service using Sentence Transformers for semantic similarity.

This service generates BERT-style embeddings for resumes and job descriptions
that can be used for computing semantic similarity scores.
"""
import logging
from typing import Optional, List, Dict, Any
import numpy as np

logger = logging.getLogger(__name__)

# Lazy loading of the model to avoid import-time overhead
_model = None
_model_name = 'all-MiniLM-L6-v2'  # Fast and good quality for semantic similarity


def get_model():
    """Lazy load the sentence transformer model."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer(_model_name)
            logger.info(f"Loaded embedding model: {_model_name}")
        except ImportError:
            logger.warning("sentence-transformers not installed. Using fallback embedding.")
            _model = "fallback"
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            _model = "fallback"
    return _model


class EmbeddingService:
    """Service for generating semantic embeddings from text."""
    
    EMBEDDING_DIM = 384  # Dimension for all-MiniLM-L6-v2
    
    @staticmethod
    def generate_embedding(text: str) -> List[float]:
        """
        Generate an embedding vector for the given text.
        
        Args:
            text: The text to embed
            
        Returns:
            A list of floats representing the embedding vector
        """
        if not text or not text.strip():
            return [0.0] * EmbeddingService.EMBEDDING_DIM
        
        model = get_model()
        
        if model == "fallback":
            # Fallback: Use simple TF-IDF-like approach
            return EmbeddingService._fallback_embedding(text)
        
        try:
            embedding = model.encode(text, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return EmbeddingService._fallback_embedding(text)
    
    @staticmethod
    def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts efficiently.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        model = get_model()
        
        if model == "fallback":
            return [EmbeddingService._fallback_embedding(t) for t in texts]
        
        try:
            # Filter empty texts
            valid_texts = [t if t and t.strip() else " " for t in texts]
            embeddings = model.encode(valid_texts, convert_to_numpy=True)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            return [EmbeddingService._fallback_embedding(t) for t in texts]
    
    @staticmethod
    def _fallback_embedding(text: str) -> List[float]:
        """
        Simple fallback embedding when ML model is unavailable.
        Uses character-based hashing to create a pseudo-embedding.
        """
        import hashlib
        
        # Create a deterministic pseudo-random embedding based on text hash
        text_hash = hashlib.sha256(text.encode()).hexdigest()
        
        # Convert hash to floats
        embedding = []
        for i in range(0, min(len(text_hash), EmbeddingService.EMBEDDING_DIM * 2), 2):
            val = int(text_hash[i:i+2], 16) / 255.0 - 0.5
            embedding.append(val)
        
        # Pad if necessary
        while len(embedding) < EmbeddingService.EMBEDDING_DIM:
            embedding.append(0.0)
        
        return embedding[:EmbeddingService.EMBEDDING_DIM]
    
    @staticmethod
    def text_from_resume(resume) -> str:
        """
        Extract text content from a resume for embedding.
        
        Args:
            resume: Resume model instance
            
        Returns:
            Combined text representation of the resume
        """
        parts = []
        
        if resume.summary:
            parts.append(f"Summary: {resume.summary}")
        
        if resume.skills:
            skills_text = ", ".join(resume.skills) if isinstance(resume.skills, list) else str(resume.skills)
            parts.append(f"Skills: {skills_text}")
        
        if resume.experience:
            for exp in resume.experience:
                if isinstance(exp, dict):
                    exp_text = f"{exp.get('title', '')} at {exp.get('company', '')}: {exp.get('description', '')}"
                    parts.append(exp_text)
        
        if resume.education:
            for edu in resume.education:
                if isinstance(edu, dict):
                    edu_text = f"{edu.get('degree', '')} from {edu.get('institution', '')}"
                    parts.append(edu_text)
        
        return " ".join(parts)
    
    @staticmethod
    def text_from_job(job) -> str:
        """
        Extract text content from a job for embedding.
        
        Args:
            job: Job model instance
            
        Returns:
            Combined text representation of the job
        """
        parts = [
            f"Title: {job.title}",
            f"Company: {job.company}",
            f"Location: {job.location}",
            f"Description: {job.description}",
        ]
        
        if job.skills:
            skills_text = ", ".join(job.skills) if isinstance(job.skills, list) else str(job.skills)
            parts.append(f"Required Skills: {skills_text}")
        
        if job.requirements:
            reqs_text = ", ".join(job.requirements) if isinstance(job.requirements, list) else str(job.requirements)
            parts.append(f"Requirements: {reqs_text}")
        
        if job.experience_level:
            parts.append(f"Experience Level: {job.experience_level}")
        
        return " ".join(parts)
    
    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """
        Compute cosine similarity between two vectors.
        
        Args:
            vec1: First embedding vector
            vec2: Second embedding vector
            
        Returns:
            Cosine similarity score between 0 and 1
        """
        if not vec1 or not vec2:
            return 0.0
        
        try:
            a = np.array(vec1)
            b = np.array(vec2)
            
            norm_a = np.linalg.norm(a)
            norm_b = np.linalg.norm(b)
            
            if norm_a == 0 or norm_b == 0:
                return 0.0
            
            similarity = np.dot(a, b) / (norm_a * norm_b)
            # Normalize to 0-1 range (cosine similarity is -1 to 1)
            return float((similarity + 1) / 2)
        except Exception as e:
            logger.error(f"Error computing cosine similarity: {e}")
            return 0.0
