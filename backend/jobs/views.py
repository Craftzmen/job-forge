from rest_framework import viewsets, filters, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
import logging

from rest_framework.permissions import IsAuthenticated
from .models import Job, Application
from .serializers import JobSerializer, ApplicationSerializer, BulkApplicationSerializer
from .permissions import IsAdminOrReadOnly

logger = logging.getLogger(__name__)


def generate_cover_letter(user, job, resume=None):
    """
    Generate a cover letter using AI service.
    Falls back to template if AI is unavailable.
    """
    try:
        from ai.services import CoverLetterService
        if resume:
            result = CoverLetterService.generate_cover_letter(resume, job)
            return result['cover_letter']
    except Exception as e:
        logger.warning(f"AI cover letter generation failed, using template: {e}")
    
    # Fallback template
    user_name = user.name or user.username
    return f"""Dear {job.company} Hiring Team,

I am writing to express my strong interest in the {job.title} position at {job.company}. I am confident that my skills and experience make me an excellent candidate for this role.

Please find my resume attached for your review. I am excited about the opportunity to contribute to your team and would welcome the chance to discuss how my background aligns with your needs.

Thank you for considering my application. I look forward to hearing from you.

Best regards,
{user_name}"""


class JobPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class JobViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Job CRUD operations.
    Admin users can create/update/delete.
    All authenticated users can read.
    """
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = (IsAdminOrReadOnly,)
    pagination_class = JobPagination

    def get_queryset(self):
        """Filter jobs based on query parameters and user role."""
        user = self.request.user
        
        # Base queryset
        if user.role == 'company':
            queryset = Job.objects.filter(posted_by=user)
        else:
            queryset = Job.objects.all()
        
        # Search by title or company
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(company__icontains=search)
            )
        
        # Filter by location
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        # Filter by experience level
        experience_level = self.request.query_params.get('experience_level', None)
        if experience_level:
            queryset = queryset.filter(experience_level=experience_level)
        
        # Filter by skills (comma-separated)
        skills = self.request.query_params.get('skills', None)
        if skills:
            skill_list = [s.strip() for s in skills.split(',')]
            for skill in skill_list:
                queryset = queryset.filter(skills__contains=[skill])
        
        return queryset

    @action(detail=False, methods=['get'])
    def company_stats(self, request):
        """Get statistics for company users."""
        user = request.user
        if user.role != 'company':
            return Response({'error': 'Only company users can access this endpoint'}, status=403)
        
        from django.db.models import Count
        from django.utils import timezone
        from datetime import timedelta
        
        # Get jobs posted by this company
        company_jobs = Job.objects.filter(posted_by=user)
        
        # Active jobs count
        active_jobs = company_jobs.count()
        
        # Total applications for company's jobs
        total_applications = Application.objects.filter(job__posted_by=user).count()
        
        # Applications this week
        week_ago = timezone.now() - timedelta(days=7)
        weekly_applications = Application.objects.filter(
            job__posted_by=user,
            created_at__gte=week_ago
        ).count()
        
        return Response({
            'active_jobs': active_jobs,
            'total_applications': total_applications,
            'weekly_applications': weekly_applications,
        })


class ApplicationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Job Applications.
    Admin can see all applications.
    Users can see only their own applications.
    """
    serializer_class = ApplicationSerializer
    permission_classes = (IsAuthenticated,)
    pagination_class = JobPagination

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Application.objects.all().select_related('job', 'user', 'resume')
        elif user.role == 'company':
            # Company users can see applications for jobs they posted
            return Application.objects.filter(job__posted_by=user).select_related('job', 'user', 'resume')
        return Application.objects.filter(user=user).select_related('job', 'user', 'resume')

    def get_serializer_class(self):
        if self.action == 'create' and 'job_ids' in self.request.data:
            return BulkApplicationSerializer
        return ApplicationSerializer

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent applications for company users."""
        user = request.user
        if user.role != 'company':
            return Response({'error': 'Only company users can access this endpoint'}, status=403)
        
        from django.utils import timezone
        from datetime import timedelta
        
        # Get applications from the last 30 days for company's jobs
        month_ago = timezone.now() - timedelta(days=30)
        recent_applications = Application.objects.filter(
            job__posted_by=user,
            created_at__gte=month_ago
        ).select_related('job', 'user', 'resume').order_by('-created_at')[:10]
        
        serializer = self.get_serializer(recent_applications, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """
        Handle both single and bulk application creation.
        If 'job_ids' is provided, creates multiple applications.
        Otherwise, falls back to standard single application creation.
        """
        if 'job_ids' in request.data:
            serializer = BulkApplicationSerializer(
                data=request.data,
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            applications = serializer.save()
            
            # Serialize the created applications for response
            response_serializer = ApplicationSerializer(applications, many=True)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        # Standard single application creation
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        """Auto-generate cover letter and compute match score if not provided."""
        job = serializer.validated_data.get('job')
        resume = serializer.validated_data.get('resume')
        cover_letter = serializer.validated_data.get('cover_letter', '')
        
        ai_generated_cover_letter = ''
        match_score = None
        match_breakdown = {}
        
        # Generate AI cover letter if resume is provided
        if resume and job:
            try:
                from ai.services import CoverLetterService, MatchingService
                
                # Generate cover letter
                result = CoverLetterService.generate_cover_letter(resume, job)
                ai_generated_cover_letter = result['cover_letter']
                
                # Compute match score
                match_result = MatchingService.compute_match(resume, job)
                match_score = match_result.overall_score
                match_breakdown = match_result.breakdown
            except Exception as e:
                logger.warning(f"AI processing failed: {e}")
        
        # Use AI-generated cover letter if user didn't provide one
        if not cover_letter and ai_generated_cover_letter:
            cover_letter = ai_generated_cover_letter
        elif not cover_letter and job:
            cover_letter = generate_cover_letter(self.request.user, job, resume)
        
        serializer.save(
            user=self.request.user,
            cover_letter=cover_letter,
            ai_generated_cover_letter=ai_generated_cover_letter,
            match_score=match_score,
            match_breakdown=match_breakdown
        )

    @action(detail=False, methods=['get'], url_path='check-applied')
    def check_applied(self, request):
        """
        Check if the current user has already applied to specific jobs.
        Query param: job_ids (comma-separated)
        Returns: dict of job_id -> application_id (or null)
        """
        job_ids_param = request.query_params.get('job_ids', '')
        if not job_ids_param:
            return Response({})
        
        try:
            job_ids = [int(id.strip()) for id in job_ids_param.split(',') if id.strip()]
        except ValueError:
            return Response({'error': 'Invalid job_ids format'}, status=status.HTTP_400_BAD_REQUEST)
        
        applications = Application.objects.filter(
            user=request.user,
            job_id__in=job_ids
        ).values('job_id', 'id')
        
        result = {str(app['job_id']): app['id'] for app in applications}
        return Response(result)
