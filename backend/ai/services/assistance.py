"""
AI Assistance Service for Resume Creation.
"""
import logging
import os
import random
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# Try to import OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Try to import Hugging Face
try:
    from huggingface_hub import InferenceClient
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False


class AssistanceService:
    """Service for providing AI assistance in resume creation."""

    @classmethod
    def generate_summary(cls, title: str, skills: List[str], experience: List[Dict] = None) -> Dict[str, Any]:
        """Generate a professional summary."""
        openai_key = os.environ.get('OPENAI_API_KEY')
        hf_token = os.environ.get('HF_TOKEN')

        prompt = f"Write a professional summary for a {title}. "
        if skills:
            prompt += f"Key skills: {', '.join(skills)}. "
        if experience:
            prompt += f"Experience includes roles like: {', '.join([e.get('title', '') for e in experience[:2]])}. "
        prompt += "Keep it concise (2-3 sentences), professional, and impactful. Return ONLY the summary text. No introductions, no 'Here is a...', no conversational filler."

        if OPENAI_AVAILABLE and openai_key:
            return cls._call_openai(prompt, "You are an expert resume writer. Return only the requested content.")
        elif hf_token:
            return cls._call_huggingface(prompt, "You are an expert resume writer. Return only the requested content.")
        else:
            return {
                'content': f"Experienced {title} with expertise in {', '.join(skills[:3]) if skills else 'various technologies'}. Committed to delivering high-quality results and continuous professional growth.",
                'generated_by': 'template'
            }

    @classmethod
    def suggest_skills(cls, title: str, current_skills: List[str] = None) -> Dict[str, Any]:
        """Suggest relevant skills."""
        openai_key = os.environ.get('OPENAI_API_KEY')
        hf_token = os.environ.get('HF_TOKEN')

        prompt = f"Suggest 10 relevant technical and soft skills for a {title}. "
        if current_skills:
            prompt += f"Current skills include: {', '.join(current_skills)}. Provide new suggestions. "
        prompt += "Return ONLY a comma-separated list of skills. No introductory text, no conversational filler."

        if OPENAI_AVAILABLE and openai_key:
            return cls._call_openai(prompt, "You are a recruitment expert. Return only the requested content.")
        elif hf_token:
            return cls._call_huggingface(prompt, "You are a recruitment expert. Return only the requested content.")
        else:
            # Very basic fallback
            return {
                'content': "Communication, Teamwork, Problem Solving, Adaptability, Leadership",
                'generated_by': 'template'
            }

    @classmethod
    def generate_job_description(cls, title: str, company: str, context: str = None) -> Dict[str, Any]:
        """Generate a job description or bullet points."""
        openai_key = os.environ.get('OPENAI_API_KEY')
        hf_token = os.environ.get('HF_TOKEN')

        prompt = f"Write 3-4 professional bullet points for the role of {title} at {company}. "
        if context:
            prompt += f"Context/Responsibilities: {context}. "
        prompt += "Focus on achievements and impact. Use action verbs. Return ONLY the bullet points. No introductions, no 'Here is a...', no conversational filler."

        if OPENAI_AVAILABLE and openai_key:
            return cls._call_openai(prompt, "You are an expert career coach. Return only the requested content.")
        elif hf_token:
            return cls._call_huggingface(prompt, "You are an expert career coach. Return only the requested content.")
        else:
            return {
                'content': f"• Led key projects at {company} as a {title}.\n• Collaborated with cross-functional teams to deliver high-quality solutions.\n• Improved process efficiency and mentored junior team members.",
                'generated_by': 'template'
            }

    @classmethod
    def _call_openai(cls, prompt: str, system_prompt: str) -> Dict[str, Any]:
        try:
            client = OpenAI()
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            return {
                'content': response.choices[0].message.content.strip(),
                'generated_by': 'openai'
            }
        except Exception as e:
            logger.error(f"OpenAI call failed: {e}")
            return {'error': str(e)}

    @classmethod
    def _call_huggingface(cls, prompt: str, system_prompt: str) -> Dict[str, Any]:
        try:
            hf_token = os.environ.get('HF_TOKEN')
            client = InferenceClient(token=hf_token)
            model_id = "meta-llama/Llama-3.2-3B-Instruct"
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
            response = client.chat_completion(
                model=model_id,
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            return {
                'content': response.choices[0].message.content.strip(),
                'generated_by': 'huggingface'
            }
        except Exception as e:
            logger.error(f"Hugging Face call failed: {e}")
            return {'error': str(e)}
