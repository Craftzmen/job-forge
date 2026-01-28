"""
Job Matching Service for computing relevance scores.

This service combines multiple signals to compute an overall
match score between a resume and a job posting.
"""
import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass

from .embeddings import EmbeddingService
from .skill_extraction import SkillExtractionService

logger = logging.getLogger(__name__)


@dataclass
class MatchResult:
    """Result of a job matching computation."""
    overall_score: float
    semantic_score: float
    skill_score: float
    experience_score: float
    location_score: float
    matching_skills: List[str]
    missing_skills: List[str]
    breakdown: Dict[str, float]


class MatchingService:
    """Service for computing job-resume match scores."""
    
    # Weight configuration for different scoring components
    WEIGHTS = {
        'semantic': 0.35,      # Semantic similarity of full text
        'skills': 0.35,        # Skill overlap
        'experience': 0.20,    # Experience level match
        'location': 0.10,      # Location match
    }
    
    # Experience level mapping
    EXPERIENCE_LEVELS = {
        'entry': (0, 2),
        'mid': (2, 5),
        'senior': (5, 100),
    }
    
    @classmethod
    def compute_match(cls, resume, job, 
                      resume_embedding: Optional[List[float]] = None,
                      job_embedding: Optional[List[float]] = None) -> MatchResult:
        """
        Compute a comprehensive match score between a resume and job.
        
        Args:
            resume: Resume model instance
            job: Job model instance
            resume_embedding: Pre-computed resume embedding (optional)
            job_embedding: Pre-computed job embedding (optional)
            
        Returns:
            MatchResult with detailed scoring breakdown
        """
        # 1. Semantic Similarity Score
        semantic_score = cls._compute_semantic_score(
            resume, job, resume_embedding, job_embedding
        )
        
        # 2. Skill Overlap Score
        skill_result = cls._compute_skill_score(resume, job)
        skill_score = skill_result['coverage_score']
        
        # 3. Experience Level Score
        experience_score = cls._compute_experience_score(resume, job)
        
        # 4. Location Score
        location_score = cls._compute_location_score(resume, job)
        
        # Compute weighted overall score
        overall_score = (
            cls.WEIGHTS['semantic'] * semantic_score +
            cls.WEIGHTS['skills'] * skill_score +
            cls.WEIGHTS['experience'] * experience_score +
            cls.WEIGHTS['location'] * location_score
        )
        
        # Round to percentage
        overall_score = round(overall_score * 100, 1)
        
        return MatchResult(
            overall_score=overall_score,
            semantic_score=round(semantic_score * 100, 1),
            skill_score=round(skill_score * 100, 1),
            experience_score=round(experience_score * 100, 1),
            location_score=round(location_score * 100, 1),
            matching_skills=skill_result['matching_skills'],
            missing_skills=skill_result['missing_skills'],
            breakdown={
                'semantic': round(semantic_score * 100, 1),
                'skills': round(skill_score * 100, 1),
                'experience': round(experience_score * 100, 1),
                'location': round(location_score * 100, 1),
            }
        )
    
    @classmethod
    def _compute_semantic_score(cls, resume, job,
                                 resume_embedding: Optional[List[float]],
                                 job_embedding: Optional[List[float]]) -> float:
        """Compute semantic similarity between resume and job description."""
        try:
            # Use pre-computed embeddings if available
            if resume_embedding is None:
                resume_text = EmbeddingService.text_from_resume(resume)
                resume_embedding = EmbeddingService.generate_embedding(resume_text)
            
            if job_embedding is None:
                job_text = EmbeddingService.text_from_job(job)
                job_embedding = EmbeddingService.generate_embedding(job_text)
            
            return EmbeddingService.cosine_similarity(resume_embedding, job_embedding)
        except Exception as e:
            logger.error(f"Error computing semantic score: {e}")
            return 0.5  # Default middle score on error
    
    @classmethod
    def _compute_skill_score(cls, resume, job) -> Dict[str, Any]:
        """Compute skill overlap score."""
        resume_skills = resume.skills if resume.skills else []
        job_skills = job.skills if job.skills else []
        
        # If job has no skills listed, try to extract from description
        if not job_skills and job.description:
            job_skills = SkillExtractionService.extract_skills(job.description)
        
        return SkillExtractionService.calculate_skill_overlap(resume_skills, job_skills)
    
    @classmethod
    def _compute_experience_score(cls, resume, job) -> float:
        """Compute experience level match score."""
        # Get candidate's years of experience
        experience_years = SkillExtractionService.infer_experience_years(
            resume.experience if resume.experience else []
        )
        
        # Get job's required experience level
        job_level = job.experience_level if hasattr(job, 'experience_level') else 'entry'
        min_years, max_years = cls.EXPERIENCE_LEVELS.get(job_level, (0, 5))
        
        # Score based on how well experience matches
        if min_years <= experience_years <= max_years:
            return 1.0  # Perfect match
        elif experience_years < min_years:
            # Under-qualified
            diff = min_years - experience_years
            return max(0.3, 1.0 - (diff * 0.2))
        else:
            # Over-qualified (not as penalizing)
            diff = experience_years - max_years
            return max(0.6, 1.0 - (diff * 0.05))
    
    @classmethod
    def _compute_location_score(cls, resume, job) -> float:
        """Compute location match score."""
        resume_location = getattr(resume, 'location', '') or ''
        job_location = getattr(job, 'location', '') or ''
        
        if not resume_location or not job_location:
            return 0.7  # Neutral score if location unknown
        
        resume_loc_lower = resume_location.lower().strip()
        job_loc_lower = job_location.lower().strip()
        
        # Check for remote work
        remote_keywords = ['remote', 'anywhere', 'work from home', 'wfh']
        if any(kw in job_loc_lower for kw in remote_keywords):
            return 1.0  # Remote jobs match everyone
        
        # Exact or partial match
        if resume_loc_lower == job_loc_lower:
            return 1.0
        
        # Check if one contains the other (e.g., "New York" in "New York, NY")
        if resume_loc_lower in job_loc_lower or job_loc_lower in resume_loc_lower:
            return 0.9
        
        # Check for same country or region (basic check)
        resume_parts = set(resume_loc_lower.replace(',', ' ').split())
        job_parts = set(job_loc_lower.replace(',', ' ').split())
        
        overlap = resume_parts.intersection(job_parts)
        if overlap:
            return 0.7
        
        return 0.3  # Location doesn't match
    
    @classmethod
    def rank_jobs_for_resume(cls, resume, jobs: List, 
                              limit: int = 20) -> List[Tuple[Any, MatchResult]]:
        """
        Rank a list of jobs by match score for a given resume.
        
        Args:
            resume: Resume model instance
            jobs: List of Job model instances
            limit: Maximum number of results to return
            
        Returns:
            List of (job, match_result) tuples sorted by score
        """
        if not resume or not jobs:
            return []
        
        # Pre-compute resume embedding once
        resume_text = EmbeddingService.text_from_resume(resume)
        resume_embedding = EmbeddingService.generate_embedding(resume_text)
        
        # Compute match for each job
        results = []
        for job in jobs:
            try:
                job_text = EmbeddingService.text_from_job(job)
                job_embedding = EmbeddingService.generate_embedding(job_text)
                
                match_result = cls.compute_match(
                    resume, job,
                    resume_embedding=resume_embedding,
                    job_embedding=job_embedding
                )
                results.append((job, match_result))
            except Exception as e:
                logger.error(f"Error computing match for job {job.id}: {e}")
                continue
        
        # Sort by overall score descending
        results.sort(key=lambda x: x[1].overall_score, reverse=True)
        
        return results[:limit]
    
    @classmethod
    def get_match_explanation(cls, match_result: MatchResult) -> str:
        """
        Generate a human-readable explanation of the match.
        
        Args:
            match_result: The match result to explain
            
        Returns:
            Explanation string
        """
        explanations = []
        
        score = match_result.overall_score
        if score >= 80:
            explanations.append(f"Excellent match ({score}%)! Your profile aligns very well with this position.")
        elif score >= 60:
            explanations.append(f"Good match ({score}%). You have many of the qualifications for this role.")
        elif score >= 40:
            explanations.append(f"Moderate match ({score}%). Some qualifications align with this role.")
        else:
            explanations.append(f"Low match ({score}%). This role may require skills outside your current profile.")
        
        if match_result.matching_skills:
            skills_str = ", ".join(match_result.matching_skills[:5])
            explanations.append(f"Matching skills: {skills_str}")
        
        if match_result.missing_skills:
            missing_str = ", ".join(match_result.missing_skills[:3])
            explanations.append(f"Skills to develop: {missing_str}")
        
        return " ".join(explanations)
