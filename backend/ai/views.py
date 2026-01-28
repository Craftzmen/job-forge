"""
AI Views for job recommendations and cover letter generation.
"""
import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from jobs.models import Job, Application
from resumes.models import Resume
from .serializers import (
    JobMatchSerializer,
    CoverLetterGenerateRequestSerializer,
    CoverLetterResponseSerializer,
    CoverLetterRegenerateRequestSerializer,
    MatchScoreRequestSerializer,
    MatchScoreResponseSerializer,
    BulkMatchScoreRequestSerializer,
    ResumeSummaryAssistRequestSerializer,
    ResumeSkillsAssistRequestSerializer,
    ResumeJobDescriptionAssistRequestSerializer,
    AssistanceResponseSerializer,
)
from .services import MatchingService, CoverLetterService, AssistanceService

logger = logging.getLogger(__name__)


class JobRecommendationsView(APIView):
    """
    GET /api/ai/recommendations/
    
    Returns ranked job recommendations for the authenticated user
    based on their active resume.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get user's active resume
        resume = Resume.objects.filter(user=request.user, is_active=True).first()
        
        if not resume:
            # Try to get any resume
            resume = Resume.objects.filter(user=request.user).first()
        
        if not resume:
            return Response({
                'recommendations': [],
                'resume_id': None,
                'total_jobs': 0,
                'message': 'No resume found. Please create a resume first.'
            }, status=status.HTTP_200_OK)
        
        # Get query parameters
        limit = int(request.query_params.get('limit', 20))
        experience_level = request.query_params.get('experience_level')
        location = request.query_params.get('location')
        min_score = float(request.query_params.get('min_score', 0))
        
        # Get all jobs (with optional filters)
        jobs_qs = Job.objects.all()
        
        if experience_level:
            jobs_qs = jobs_qs.filter(experience_level=experience_level)
        
        if location:
            jobs_qs = jobs_qs.filter(location__icontains=location)
        
        jobs = list(jobs_qs)
        
        if not jobs:
            return Response({
                'recommendations': [],
                'resume_id': resume.id,
                'total_jobs': 0
            })
        
        # Rank jobs using AI matching
        try:
            ranked_results = MatchingService.rank_jobs_for_resume(resume, jobs, limit=limit * 2)
        except Exception as e:
            logger.error(f"Error ranking jobs: {e}")
            return Response(
                {'error': 'Failed to compute job recommendations.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Filter by minimum score and format response
        recommendations = []
        for job, match_result in ranked_results:
            if match_result.overall_score < min_score:
                continue
            
            job_data = JobMatchSerializer(job).data
            job_data['match_score'] = match_result.overall_score
            job_data['semantic_score'] = match_result.semantic_score
            job_data['skill_score'] = match_result.skill_score
            job_data['experience_score'] = match_result.experience_score
            job_data['location_score'] = match_result.location_score
            job_data['matching_skills'] = match_result.matching_skills
            job_data['missing_skills'] = match_result.missing_skills
            job_data['match_explanation'] = MatchingService.get_match_explanation(match_result)
            
            recommendations.append(job_data)
            
            if len(recommendations) >= limit:
                break
        
        return Response({
            'recommendations': recommendations,
            'resume_id': resume.id,
            'resume_title': resume.title,
            'total_jobs': len(jobs),
            'matched_jobs': len(recommendations)
        })


class CoverLetterGenerateView(APIView):
    """
    POST /api/ai/generate-cover-letter/
    
    Generates an AI-powered cover letter for a specific job application.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CoverLetterGenerateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        job_id = serializer.validated_data['job_id']
        resume_id = serializer.validated_data.get('resume_id')
        custom_instructions = serializer.validated_data.get('custom_instructions', '')
        
        # Get job
        job = get_object_or_404(Job, id=job_id)
        
        # Get resume
        if resume_id:
            resume = get_object_or_404(Resume, id=resume_id, user=request.user)
        else:
            resume = Resume.objects.filter(user=request.user, is_active=True).first()
            if not resume:
                resume = Resume.objects.filter(user=request.user).first()
        
        if not resume:
            return Response(
                {'error': 'No resume found. Please create a resume first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate cover letter
        try:
            result = CoverLetterService.generate_cover_letter(
                resume=resume,
                job=job,
                custom_instructions=custom_instructions
            )
        except Exception as e:
            logger.error(f"Error generating cover letter: {e}")
            return Response(
                {'error': 'Failed to generate cover letter.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        response_data = {
            **result,
            'job_id': job.id,
            'resume_id': resume.id
        }
        
        return Response(CoverLetterResponseSerializer(response_data).data)


class CoverLetterRegenerateView(APIView):
    """
    POST /api/ai/regenerate-cover-letter/
    
    Regenerates a cover letter based on user feedback.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CoverLetterRegenerateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        job_id = serializer.validated_data['job_id']
        resume_id = serializer.validated_data.get('resume_id')
        previous_letter = serializer.validated_data['previous_letter']
        feedback = serializer.validated_data['feedback']
        
        # Get job and resume
        job = get_object_or_404(Job, id=job_id)
        
        if resume_id:
            resume = get_object_or_404(Resume, id=resume_id, user=request.user)
        else:
            resume = Resume.objects.filter(user=request.user, is_active=True).first()
        
        if not resume:
            return Response(
                {'error': 'No resume found.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Regenerate cover letter
        try:
            result = CoverLetterService.regenerate_cover_letter(
                resume=resume,
                job=job,
                feedback=feedback,
                previous_letter=previous_letter
            )
        except Exception as e:
            logger.error(f"Error regenerating cover letter: {e}")
            return Response(
                {'error': 'Failed to regenerate cover letter.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        response_data = {
            **result,
            'job_id': job.id,
            'resume_id': resume.id
        }
        
        return Response(CoverLetterResponseSerializer(response_data).data)


class MatchScoreView(APIView):
    """
    POST /api/ai/match-score/
    
    Computes the match score between a resume and a specific job.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = MatchScoreRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        job_id = serializer.validated_data['job_id']
        resume_id = serializer.validated_data.get('resume_id')
        
        # Get job
        job = get_object_or_404(Job, id=job_id)
        
        # Get resume
        if resume_id:
            resume = get_object_or_404(Resume, id=resume_id, user=request.user)
        else:
            resume = Resume.objects.filter(user=request.user, is_active=True).first()
            if not resume:
                resume = Resume.objects.filter(user=request.user).first()
        
        if not resume:
            return Response(
                {'error': 'No resume found.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Compute match score
        try:
            match_result = MatchingService.compute_match(resume, job)
        except Exception as e:
            logger.error(f"Error computing match score: {e}")
            return Response(
                {'error': 'Failed to compute match score.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        response_data = {
            'overall_score': match_result.overall_score,
            'semantic_score': match_result.semantic_score,
            'skill_score': match_result.skill_score,
            'experience_score': match_result.experience_score,
            'location_score': match_result.location_score,
            'matching_skills': match_result.matching_skills,
            'missing_skills': match_result.missing_skills,
            'explanation': MatchingService.get_match_explanation(match_result),
            'job': {
                'id': job.id,
                'title': job.title,
                'company': job.company,
            },
            'resume_id': resume.id
        }
        
        return Response(MatchScoreResponseSerializer(response_data).data)


class BulkMatchScoreView(APIView):
    """
    POST /api/ai/bulk-match-scores/
    
    Computes match scores for multiple jobs at once.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = BulkMatchScoreRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        job_ids = serializer.validated_data['job_ids']
        resume_id = serializer.validated_data.get('resume_id')
        
        # Get resume
        if resume_id:
            resume = get_object_or_404(Resume, id=resume_id, user=request.user)
        else:
            resume = Resume.objects.filter(user=request.user, is_active=True).first()
        
        if not resume:
            return Response(
                {'error': 'No resume found.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get jobs
        jobs = Job.objects.filter(id__in=job_ids)
        
        # Compute match scores
        results = []
        for job in jobs:
            try:
                match_result = MatchingService.compute_match(resume, job)
                results.append({
                    'job_id': job.id,
                    'overall_score': match_result.overall_score,
                    'matching_skills': match_result.matching_skills[:5],
                    'missing_skills': match_result.missing_skills[:3],
                })
            except Exception as e:
                logger.error(f"Error computing match for job {job.id}: {e}")
                results.append({
                    'job_id': job.id,
                    'overall_score': None,
                    'error': 'Failed to compute'
                })
        
        return Response({
            'scores': results,
            'resume_id': resume.id
        })


class ApplicationCoverLetterView(APIView):
    """
    GET /api/ai/applications/:id/cover-letter/
    
    Preview the cover letter for an application.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, application_id):
        application = get_object_or_404(
            Application,
            id=application_id,
            user=request.user
        )
        
        return Response({
            'id': application.id,
            'job_id': application.job.id,
            'job_title': application.job.title,
            'company': application.job.company,
            'cover_letter': application.cover_letter,
            'ai_generated_cover_letter': application.ai_generated_cover_letter,
            'match_score': application.match_score,
            'match_breakdown': application.match_breakdown,
            'status': application.status,
            'created_at': application.created_at
        })


class ResumeSummaryAssistView(APIView):
    """
    POST /api/ai/resume/summary-assist/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ResumeSummaryAssistRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = AssistanceService.generate_summary(
            title=serializer.validated_data['title'],
            skills=serializer.validated_data.get('skills', []),
            experience=serializer.validated_data.get('experience', [])
        )
        
        if 'error' in result:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response(AssistanceResponseSerializer(result).data)


class ResumeSkillsAssistView(APIView):
    """
    POST /api/ai/resume/skills-assist/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ResumeSkillsAssistRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = AssistanceService.suggest_skills(
            title=serializer.validated_data['title'],
            current_skills=serializer.validated_data.get('current_skills', [])
        )
        
        if 'error' in result:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response(AssistanceResponseSerializer(result).data)


class ResumeJobDescriptionAssistView(APIView):
    """
    POST /api/ai/resume/job-description-assist/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ResumeJobDescriptionAssistRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = AssistanceService.generate_job_description(
            title=serializer.validated_data['title'],
            company=serializer.validated_data['company'],
            context=serializer.validated_data.get('context', '')
        )
        
        if 'error' in result:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response(AssistanceResponseSerializer(result).data)
