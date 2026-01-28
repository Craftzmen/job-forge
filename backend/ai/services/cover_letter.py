"""
Cover Letter Generation Service using LLM/AI.

This service generates personalized cover letters using either
OpenAI API, Hugging Face models, or a sophisticated template fallback.
"""
import logging
import os
import random
import requests
from typing import Optional, Dict, Any, List
from string import Template

logger = logging.getLogger(__name__)

# Try to import OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.info("OpenAI not installed. Using template-based generation.")

# Try to import Hugging Face
try:
    from huggingface_hub import InferenceClient
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False
    logger.info("Hugging Face Hub not installed.")


class CoverLetterService:
    """Service for generating personalized cover letters."""
    
    # Templates for fallback generation
    COVER_LETTER_TEMPLATES = [
        Template("""Dear $company Hiring Team,

I am writing to express my strong interest in the $job_title position at $company. With my background in $primary_skills and $experience_years years of relevant experience, I am confident in my ability to contribute meaningfully to your team.

$experience_paragraph

$skills_paragraph

$motivation_paragraph

I am particularly drawn to $company because of the opportunity to work on $job_focus. My experience with $matching_skills aligns well with your requirements, and I am eager to bring my expertise to your team.

Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experience can contribute to $company's continued success.

Best regards,
$candidate_name
$candidate_email
$candidate_phone"""),
        Template("""To the hiring manager at $company,

I was excited to see the opening for $job_title. Having spent $experience_years years honing my skills in $primary_skills, I believe I could be a great asset to your team.

$experience_paragraph

$skills_paragraph

$motivation_paragraph

What interests me most about $company is your focus on $job_focus. With my background in $matching_skills, I am ready to hit the ground running and help you reach your goals.

I would appreciate the chance to discuss my qualifications further in an interview.

Sincerely,
$candidate_name
$candidate_email
$candidate_phone"""),
        Template("""Dear $company Team,

Please accept this letter and the enclosed resume for the $job_title position. My $experience_years years of experience in $primary_skills have prepared me well for this challenge.

$experience_paragraph

$skills_paragraph

$motivation_paragraph

The work $company is doing in $job_focus is truly inspiring. I am confident that my expertise in $matching_skills would allow me to make immediate contributions to your success.

Thank you for your time and consideration.

Best,
$candidate_name
$candidate_email
$candidate_phone""")
    ]

    @classmethod
    def generate_cover_letter(cls, resume, job, 
                               custom_instructions: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a personalized cover letter for a job application.
        
        Args:
            resume: Resume model instance
            job: Job model instance
            custom_instructions: Optional custom instructions for the AI
            
        Returns:
            Dictionary with cover_letter text and metadata
        """
        # Check if OpenAI is available and configured
        openai_key = os.environ.get('OPENAI_API_KEY')
        hf_token = os.environ.get('HF_TOKEN')
        
        print(f"DEBUG: openai_key present: {bool(openai_key)}")
        print(f"DEBUG: hf_token present: {bool(hf_token)}")
        
        if OPENAI_AVAILABLE and openai_key:
            print("DEBUG: Using OpenAI")
            return cls._generate_with_openai(resume, job, custom_instructions)
        elif hf_token:
            print("DEBUG: Using Hugging Face")
            return cls._generate_with_huggingface(resume, job, custom_instructions)
        else:
            print("DEBUG: Using Template Fallback")
            return cls._generate_with_template(resume, job)
    
    @classmethod
    def _generate_with_huggingface(cls, resume, job, 
                                   custom_instructions: Optional[str] = None) -> Dict[str, Any]:
        """Generate cover letter using Hugging Face Inference API."""
        try:
            if not HF_AVAILABLE:
                raise ImportError("huggingface_hub not installed")
                
            hf_token = os.environ.get('HF_TOKEN')
            if not hf_token:
                raise ValueError("HF_TOKEN not found in environment")
            
            # Use InferenceClient with Llama model
            client = InferenceClient(token=hf_token)
            model_id = "meta-llama/Llama-3.2-3B-Instruct"
            
            # Build the prompt
            resume_info = cls._format_resume_for_prompt(resume)
            job_info = cls._format_job_for_prompt(job)
            
            system_instruction = (
                "You are an expert career coach and professional writer. "
                "Write a compelling, personalized cover letter that: "
                "1. Highlights relevant experience and skills. "
                "2. Shows genuine interest in the company and role. "
                "3. Is professional yet personable. "
                "4. Is concise (300-400 words). "
                "5. Includes specific examples. "
                "6. Avoids generic phrases and clichés. "
                "7. Uses a unique tone each time. "
                "Do not include any placeholders - use the actual information provided."
            )

            user_content = f"""Write a personalized cover letter for this job application.

CANDIDATE INFORMATION:
{resume_info}

JOB POSTING:
{job_info}

{f"ADDITIONAL INSTRUCTIONS: {custom_instructions}" if custom_instructions else ""}

Write the cover letter now:"""

            messages = [
                {"role": "user", "content": f"{system_instruction}\n\n{user_content}"}
            ]
            
            # Use chat completion
            response = client.chat_completion(
                model=model_id,
                messages=messages,
                max_tokens=1000,
                temperature=0.7
            )
            
            cover_letter = response.choices[0].message.content.strip()

            if not cover_letter:
                raise ValueError("Empty response from Hugging Face")
            
            return {
                'cover_letter': cover_letter,
                'generated_by': 'huggingface',
                'model': model_id,
                'editable': True
            }
            
        except Exception as e:
            logger.error(f"Hugging Face generation failed: {e}")
            print(f"DEBUG: Hugging Face Error: {e}")
            # Fallback to template
            return cls._generate_with_template(resume, job)
    
    @classmethod
    def _generate_with_openai(cls, resume, job, 
                               custom_instructions: Optional[str] = None) -> Dict[str, Any]:
        """Generate cover letter using OpenAI API."""
        try:
            client = OpenAI()
            
            # Build the prompt
            resume_info = cls._format_resume_for_prompt(resume)
            job_info = cls._format_job_for_prompt(job)
            
            system_prompt = """You are an expert career coach and professional writer. 
Your task is to write compelling, personalized cover letters that:
1. Highlight the candidate's relevant experience and skills
2. Show genuine interest in the company and role
3. Are professional yet personable
4. Are concise (300-400 words)
5. Include specific examples from the candidate's experience
6. Avoid generic phrases and clichés
7. Use a unique and engaging tone each time. Do not follow a fixed structure.

Do not include any placeholders - use the actual information provided."""

            user_prompt = f"""Write a personalized cover letter for this job application.

CANDIDATE INFORMATION:
{resume_info}

JOB POSTING:
{job_info}

{f"ADDITIONAL INSTRUCTIONS: {custom_instructions}" if custom_instructions else ""}

Write the cover letter now:"""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=1000,
                temperature=0.8
            )
            
            cover_letter = response.choices[0].message.content
            
            return {
                'cover_letter': cover_letter,
                'generated_by': 'openai',
                'model': 'gpt-4o-mini',
                'editable': True
            }
            
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            # Fallback to template
            return cls._generate_with_template(resume, job)
    
    @classmethod
    def _generate_with_template(cls, resume, job) -> Dict[str, Any]:
        """Generate cover letter using template-based approach."""
        # Extract relevant information
        candidate_name = resume.name if hasattr(resume, 'name') else "Candidate"
        candidate_email = resume.email if hasattr(resume, 'email') else ""
        candidate_phone = resume.phone if hasattr(resume, 'phone') else ""
        
        # Get skills
        resume_skills = resume.skills if resume.skills else []
        job_skills = job.skills if job.skills else []
        
        # Find matching skills
        resume_skills_lower = {s.lower() for s in resume_skills}
        job_skills_lower = {s.lower() for s in job_skills}
        matching = resume_skills_lower.intersection(job_skills_lower)
        
        primary_skills = ", ".join(resume_skills[:3]) if resume_skills else "technology"
        matching_skills = ", ".join(list(matching)[:3]) if matching else primary_skills
        
        # Calculate experience years
        experience_years = cls._calculate_experience_years(resume.experience if resume.experience else [])
        
        # Generate experience paragraph
        experience_paragraph = cls._generate_experience_paragraph(resume, job)
        
        # Generate skills paragraph
        skills_paragraph = cls._generate_skills_paragraph(resume, job, matching)
        
        # Generate motivation paragraph
        motivation_paragraph = cls._generate_motivation_paragraph(job)
        
        # Extract job focus from description
        job_focus = cls._extract_job_focus(job.description)
        
        # Pick a random template
        template = random.choice(cls.COVER_LETTER_TEMPLATES)
        
        # Fill template
        cover_letter = template.substitute(
            company=job.company,
            job_title=job.title,
            primary_skills=primary_skills,
            experience_years=experience_years,
            experience_paragraph=experience_paragraph,
            skills_paragraph=skills_paragraph,
            motivation_paragraph=motivation_paragraph,
            job_focus=job_focus,
            matching_skills=matching_skills,
            candidate_name=candidate_name,
            candidate_email=candidate_email,
            candidate_phone=candidate_phone
        )
        
        return {
            'cover_letter': cover_letter,
            'generated_by': 'template',
            'model': None,
            'editable': True
        }
    
    @classmethod
    def _format_resume_for_prompt(cls, resume) -> str:
        """Format resume information for the AI prompt."""
        parts = []
        
        if hasattr(resume, 'name') and resume.name:
            parts.append(f"Name: {resume.name}")
        
        if resume.summary:
            parts.append(f"Professional Summary: {resume.summary}")
        
        if resume.skills:
            skills_str = ", ".join(resume.skills)
            parts.append(f"Skills: {skills_str}")
        
        if resume.experience:
            parts.append("Work Experience:")
            for exp in resume.experience[:3]:  # Limit to recent 3
                if isinstance(exp, dict):
                    title = exp.get('title', 'Role')
                    company = exp.get('company', 'Company')
                    desc = exp.get('description', '')
                    parts.append(f"  - {title} at {company}: {desc[:200]}")
        
        if resume.education:
            parts.append("Education:")
            for edu in resume.education[:2]:
                if isinstance(edu, dict):
                    degree = edu.get('degree', '')
                    institution = edu.get('institution', '')
                    parts.append(f"  - {degree} from {institution}")
        
        return "\n".join(parts)
    
    @classmethod
    def _format_job_for_prompt(cls, job) -> str:
        """Format job information for the AI prompt."""
        parts = [
            f"Title: {job.title}",
            f"Company: {job.company}",
            f"Location: {job.location}",
            f"Description: {job.description[:1000]}",  # Limit description length
        ]
        
        if job.skills:
            parts.append(f"Required Skills: {', '.join(job.skills)}")
        
        if job.requirements:
            parts.append(f"Requirements: {', '.join(job.requirements)}")
        
        if job.experience_level:
            parts.append(f"Experience Level: {job.experience_level}")
        
        return "\n".join(parts)
    
    @classmethod
    def _calculate_experience_years(cls, experience: list) -> int:
        """Calculate total years of experience."""
        if not experience:
            return 1
        
        # Rough estimate: 1-2 years per position
        return max(1, min(len(experience) * 2, 15))
    
    @classmethod
    def _generate_experience_paragraph(cls, resume, job) -> str:
        """Generate a paragraph about relevant experience."""
        if not resume.experience:
            return "Throughout my career, I have developed a strong foundation in this field and am eager to apply my knowledge in a practical setting."
        
        # Find most relevant experience
        recent_exp = resume.experience[0] if resume.experience else {}
        if isinstance(recent_exp, dict):
            title = recent_exp.get('title', 'my previous role')
            company = recent_exp.get('company', 'my previous company')
            desc = recent_exp.get('description', '')
            
            variations = [
                f"In my role as {title} at {company}, I gained valuable experience that directly relates to this position. {desc[:200] if desc else 'I developed skills that would be valuable in this new role.'}",
                f"During my time as {title} with {company}, I focused on major projects that align with the requirements for this role. {desc[:150] if desc else 'My contributions there were instrumental in our team goals.'}",
                f"Working as {title} at {company} allowed me to sharpen my expertise. {desc[:180] if desc else 'I am eager to apply the lessons learned there to your team.'}"
            ]
            return random.choice(variations)
        
        return random.choice([
            "My professional background has equipped me with the skills and experience necessary to excel in this role.",
            "Having worked in various capacities, I have a well-rounded professional history that makes me a strong fit.",
            "My diverse experience across different projects gives me a unique perspective that I'm eager to bring to your company."
        ])
    
    @classmethod
    def _generate_skills_paragraph(cls, resume, job, matching_skills: set) -> str:
        """Generate a paragraph highlighting relevant skills."""
        if matching_skills:
            skills_list = list(matching_skills)
            random.shuffle(skills_list)
            skills_to_show = skills_list[:4]
            
            variations = [
                f"My expertise in {', '.join(skills_to_show)} directly aligns with your requirements. I have applied these skills in real-world projects and am confident in my ability to deliver results.",
                f"Technical skills like {', '.join(skills_to_show)} have been central to my success in previous roles, and I look forward to leveraging them at {job.company}.",
                f"I am well-versed in {', '.join(skills_to_show)}, and I believe these competencies will allow me to contribute effectively from day one."
            ]
            return random.choice(variations)
        
        if resume.skills:
            skills_list = resume.skills[:]
            random.shuffle(skills_list)
            skills_to_show = skills_list[:4]
            variations = [
                f"My skill set, including {', '.join(skills_to_show)}, would be valuable in this role. I am also a quick learner and am committed to developing any additional skills needed.",
                f"I bring a diverse range of skills such as {', '.join(skills_to_show)}, which I have developed through various professional challenges.",
                f"With a strong foundation in {', '.join(skills_to_show)}, I am confident that I can quickly adapt and thrive in your environment."
            ]
            return random.choice(variations)
        
        return random.choice([
            "I am committed to continuous learning and professional development, and I am confident in my ability to quickly acquire any new skills required for this position.",
            "My adaptability and passion for growth make me a quick learner, ready to master the tools and technologies used at your firm.",
            "I possess a strong appetite for learning and am dedicated to personal and professional excellence in all my tasks."
        ])
    
    @classmethod
    def _generate_motivation_paragraph(cls, job) -> str:
        """Generate a paragraph about motivation for applying."""
        variations = [
            f"I am excited about the opportunity to join {job.company} and contribute to your team's success. The {job.title} role represents an excellent opportunity to grow professionally while making meaningful contributions.",
            f"Joining {job.company} as a {job.title} is a prospect I find incredibly compelling. Your reputation for excellence in the industry makes this an ideal place for me to apply my dedication.",
            f"I have followed {job.company}'s work with great interest, and I am eager to bring my passion and skills to the {job.title} team."
        ]
        return random.choice(variations)
    
    @classmethod
    def _extract_job_focus(cls, description: str) -> str:
        """Extract the main focus/theme of the job from description."""
        if not description:
            return "innovative projects and professional growth"
        
        # Simple extraction: first meaningful sentence or phrase
        sentences = description.split('.')
        for sentence in sentences[:3]:
            sentence = sentence.strip()
            if len(sentence) > 20 and len(sentence) < 100:
                return sentence.lower()
        
        return "challenging projects and professional development"
    
    @classmethod
    def regenerate_cover_letter(cls, resume, job, 
                                 feedback: str,
                                 previous_letter: str) -> Dict[str, Any]:
        """
        Regenerate a cover letter based on user feedback.
        
        Args:
            resume: Resume model instance
            job: Job model instance
            feedback: User's feedback on what to change
            previous_letter: The previous cover letter to improve
            
        Returns:
            Dictionary with new cover_letter text and metadata
        """
        openai_key = os.environ.get('OPENAI_API_KEY')
        hf_token = os.environ.get('HF_TOKEN')
        
        if OPENAI_AVAILABLE and openai_key:
            return cls._regenerate_with_openai(resume, job, feedback, previous_letter)
        elif hf_token:
            return cls._regenerate_with_huggingface(resume, job, feedback, previous_letter)
        else:
            # Can't regenerate without AI - return modified template
            return cls._generate_with_template(resume, job)

    @classmethod
    def _regenerate_with_openai(cls, resume, job, feedback, previous_letter) -> Dict[str, Any]:
        """Regenerate using OpenAI."""
        try:
            client = OpenAI()
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system", 
                        "content": "You are an expert cover letter writer. Revise the cover letter based on the user's feedback while maintaining professionalism and relevance."
                    },
                    {
                        "role": "user", 
                        "content": f"""Please revise this cover letter based on the following feedback:

PREVIOUS LETTER:
{previous_letter}

USER FEEDBACK:
{feedback}

Please provide the revised cover letter:"""
                    }
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            return {
                'cover_letter': response.choices[0].message.content,
                'generated_by': 'openai',
                'model': 'gpt-4o-mini',
                'editable': True,
                'revision': True
            }
        except Exception as e:
            logger.error(f"OpenAI regeneration failed: {e}")
            return cls._generate_with_template(resume, job)

    @classmethod
    def _regenerate_with_huggingface(cls, resume, job, feedback, previous_letter) -> Dict[str, Any]:
        """Regenerate using Hugging Face."""
        try:
            if not HF_AVAILABLE:
                raise ImportError("huggingface_hub not installed")
                
            hf_token = os.environ.get('HF_TOKEN')
            if not hf_token:
                raise ValueError("HF_TOKEN not found in environment")
            
            client = InferenceClient(token=hf_token)
            model_id = "meta-llama/Llama-3.2-3B-Instruct"
            model_id = "mistralai/Mistral-7B-Instruct-v0.3"
            
            messages = [
                {
                    "role": "user",
                    "content": f"""You are an expert cover letter writer. Revise the following cover letter based on user feedback.

PREVIOUS LETTER:
{previous_letter}

USER FEEDBACK:
{feedback}

Please provide only the revised cover letter text:"""
                }
            ]
            
            response = client.chat_completion(
                model=model_id,
                messages=messages,
                max_tokens=1000,
                temperature=0.7
            )

            cover_letter = response.choices[0].message.content.strip()

            return {
                'cover_letter': cover_letter,
                'generated_by': 'huggingface',
                'model': model_id,
                'editable': True,
                'revision': True
            }
        except Exception as e:
            logger.error(f"Hugging Face regeneration failed: {e}")
            return cls._generate_with_template(resume, job)
