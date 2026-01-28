"""
Skill Extraction Service using spaCy NLP.

This service extracts skills, keywords, and entities from text
using Named Entity Recognition and pattern matching.
"""
import logging
import re
from typing import List, Set, Dict, Any

logger = logging.getLogger(__name__)

# Lazy loading of spaCy model
_nlp = None

# Common technical skills for pattern matching fallback
COMMON_SKILLS = {
    # Programming Languages
    'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'ruby', 'go', 'golang',
    'rust', 'swift', 'kotlin', 'scala', 'php', 'perl', 'r', 'matlab', 'julia',
    
    # Web Technologies
    'html', 'css', 'sass', 'less', 'react', 'reactjs', 'angular', 'vue', 'vuejs',
    'nextjs', 'next.js', 'nuxt', 'svelte', 'jquery', 'bootstrap', 'tailwind',
    'tailwindcss', 'webpack', 'vite', 'node', 'nodejs', 'express', 'fastapi',
    'django', 'flask', 'rails', 'spring', 'asp.net', 'laravel',
    
    # Databases
    'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'elasticsearch',
    'sqlite', 'oracle', 'dynamodb', 'cassandra', 'neo4j', 'graphql',
    
    # Cloud & DevOps
    'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s',
    'terraform', 'ansible', 'jenkins', 'gitlab', 'github actions', 'ci/cd',
    'linux', 'unix', 'bash', 'shell', 'nginx', 'apache',
    
    # Data Science & ML
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras',
    'scikit-learn', 'sklearn', 'pandas', 'numpy', 'scipy', 'matplotlib',
    'nlp', 'natural language processing', 'computer vision', 'opencv',
    'data analysis', 'data science', 'statistics', 'ai', 'artificial intelligence',
    
    # Tools & Others
    'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'slack',
    'agile', 'scrum', 'kanban', 'rest', 'restful', 'api', 'microservices',
    'testing', 'unit testing', 'tdd', 'bdd', 'selenium', 'cypress', 'jest',
    'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator',
}


def get_nlp():
    """Lazy load the spaCy model."""
    global _nlp
    if _nlp is None:
        try:
            import spacy
            try:
                _nlp = spacy.load("en_core_web_sm")
                logger.info("Loaded spaCy model: en_core_web_sm")
            except OSError:
                # Model not installed, try to download
                logger.warning("spaCy model not found. Using fallback extraction.")
                _nlp = "fallback"
        except ImportError:
            logger.warning("spaCy not installed. Using fallback skill extraction.")
            _nlp = "fallback"
    return _nlp


class SkillExtractionService:
    """Service for extracting skills and keywords from text."""
    
    @staticmethod
    def extract_skills(text: str) -> List[str]:
        """
        Extract skills from text using NLP and pattern matching.
        
        Args:
            text: Text to extract skills from
            
        Returns:
            List of extracted skills
        """
        if not text:
            return []
        
        text_lower = text.lower()
        found_skills: Set[str] = set()
        
        # Pattern matching for known skills
        for skill in COMMON_SKILLS:
            # Use word boundary matching
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.add(skill.title() if len(skill) > 3 else skill.upper())
        
        # Try NLP-based extraction
        nlp = get_nlp()
        if nlp != "fallback":
            try:
                doc = nlp(text)
                
                # Extract noun phrases that might be skills
                for chunk in doc.noun_chunks:
                    chunk_text = chunk.text.lower().strip()
                    if chunk_text in COMMON_SKILLS:
                        found_skills.add(chunk_text.title())
                
                # Extract named entities
                for ent in doc.ents:
                    if ent.label_ in ['ORG', 'PRODUCT']:
                        ent_lower = ent.text.lower()
                        if ent_lower in COMMON_SKILLS:
                            found_skills.add(ent.text)
            except Exception as e:
                logger.error(f"Error in NLP skill extraction: {e}")
        
        return sorted(list(found_skills))
    
    @staticmethod
    def extract_keywords(text: str, top_n: int = 20) -> List[str]:
        """
        Extract important keywords from text.
        
        Args:
            text: Text to extract keywords from
            top_n: Maximum number of keywords to return
            
        Returns:
            List of keywords
        """
        if not text:
            return []
        
        nlp = get_nlp()
        
        if nlp == "fallback":
            return SkillExtractionService._fallback_keywords(text, top_n)
        
        try:
            doc = nlp(text)
            
            # Extract meaningful words
            keywords = []
            for token in doc:
                if (not token.is_stop and 
                    not token.is_punct and 
                    not token.is_space and
                    len(token.text) > 2 and
                    token.pos_ in ['NOUN', 'PROPN', 'ADJ', 'VERB']):
                    keywords.append(token.lemma_.lower())
            
            # Count frequency
            from collections import Counter
            word_counts = Counter(keywords)
            
            return [word for word, _ in word_counts.most_common(top_n)]
        except Exception as e:
            logger.error(f"Error extracting keywords: {e}")
            return SkillExtractionService._fallback_keywords(text, top_n)
    
    @staticmethod
    def _fallback_keywords(text: str, top_n: int = 20) -> List[str]:
        """Fallback keyword extraction without NLP."""
        from collections import Counter
        
        # Simple tokenization
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        
        # Common stopwords
        stopwords = {
            'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can',
            'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been',
            'were', 'they', 'their', 'what', 'when', 'where', 'who', 'will',
            'with', 'would', 'there', 'this', 'that', 'from', 'your', 'which',
            'about', 'into', 'through', 'during', 'before', 'after', 'above',
        }
        
        filtered = [w for w in words if w not in stopwords]
        word_counts = Counter(filtered)
        
        return [word for word, _ in word_counts.most_common(top_n)]
    
    @staticmethod
    def calculate_skill_overlap(skills1: List[str], skills2: List[str]) -> Dict[str, Any]:
        """
        Calculate the overlap between two skill sets.
        
        Args:
            skills1: First skill set (e.g., resume skills)
            skills2: Second skill set (e.g., job required skills)
            
        Returns:
            Dictionary with matching skills and overlap score
        """
        if not skills1 or not skills2:
            return {
                'matching_skills': [],
                'missing_skills': list(skills2) if skills2 else [],
                'overlap_score': 0.0,
                'coverage_score': 0.0
            }
        
        # Normalize skills for comparison
        set1 = {s.lower().strip() for s in skills1}
        set2 = {s.lower().strip() for s in skills2}
        
        matching = set1.intersection(set2)
        missing = set2 - set1
        
        # Overlap score: Jaccard similarity
        union = set1.union(set2)
        overlap_score = len(matching) / len(union) if union else 0.0
        
        # Coverage score: How many required skills are matched
        coverage_score = len(matching) / len(set2) if set2 else 0.0
        
        return {
            'matching_skills': sorted(list(matching)),
            'missing_skills': sorted(list(missing)),
            'overlap_score': round(overlap_score, 3),
            'coverage_score': round(coverage_score, 3)
        }
    
    @staticmethod
    def infer_experience_years(experience: List[Dict]) -> int:
        """
        Infer total years of experience from experience entries.
        
        Args:
            experience: List of experience dictionaries
            
        Returns:
            Estimated years of experience
        """
        if not experience:
            return 0
        
        total_years = 0
        
        for exp in experience:
            if not isinstance(exp, dict):
                continue
            
            start_date = exp.get('start_date', exp.get('startDate', ''))
            end_date = exp.get('end_date', exp.get('endDate', ''))
            
            # Try to extract years
            try:
                start_year = None
                end_year = None
                
                # Extract year from various formats
                year_pattern = r'(19|20)\d{2}'
                
                if start_date:
                    match = re.search(year_pattern, str(start_date))
                    if match:
                        start_year = int(match.group())
                
                if end_date:
                    if 'present' in str(end_date).lower() or 'current' in str(end_date).lower():
                        from datetime import datetime
                        end_year = datetime.now().year
                    else:
                        match = re.search(year_pattern, str(end_date))
                        if match:
                            end_year = int(match.group())
                
                if start_year and end_year:
                    total_years += max(0, end_year - start_year)
                elif start_year:
                    # Assume still working or 1 year
                    from datetime import datetime
                    total_years += max(1, datetime.now().year - start_year)
            except Exception:
                # If parsing fails, assume 1-2 years per entry
                total_years += 1
        
        return total_years
