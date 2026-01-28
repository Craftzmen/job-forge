from rest_framework import serializers
from .models import Job, Application
from resumes.models import Resume


class JobSerializer(serializers.ModelSerializer):
    """Serializer for Job model with CRUD operations."""
    
    posted_by_name = serializers.CharField(source='posted_by.name', read_only=True)
    
    class Meta:
        model = Job
        fields = (
            'id',
            'title',
            'company',
            'location',
            'description',
            'requirements',
            'skills',
            'experience_level',
            'posted_by',
            'posted_by_name',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'posted_by', 'posted_by_name', 'created_at', 'updated_at')

    def validate_requirements(self, value):
        """Validate requirements is a list of strings."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Requirements must be a list.")
        
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError("Each requirement must be a string.")
        return value

    def validate_skills(self, value):
        """Validate skills is a list of strings."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Skills must be a list.")
        
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError("Each skill must be a string.")
        return value

    def create(self, validated_data):
        """Create job with the current user from context."""
        validated_data['posted_by'] = self.context['request'].user
        return super().create(validated_data)


class ApplicationSerializer(serializers.ModelSerializer):
    """Serializer for job applications."""
    username = serializers.CharField(source='user.username', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    company = serializers.CharField(source='job.company', read_only=True)
    resume_title = serializers.CharField(source='resume.title', read_only=True, allow_null=True)

    class Meta:
        model = Application
        fields = (
            'id', 'job', 'job_title', 'company', 'user', 'username', 'user_name',
            'resume', 'resume_title', 'status', 'cover_letter',
            'ai_generated_cover_letter', 'match_score', 'match_breakdown',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'ai_generated_cover_letter', 'match_score', 'match_breakdown', 'created_at', 'updated_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class BulkApplicationSerializer(serializers.Serializer):
    """
    Serializer for bulk job applications.
    Accepts multiple job IDs and a single resume ID.
    """
    job_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text="List of job IDs to apply to"
    )
    resume_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Resume ID to use for all applications"
    )
    cover_letter = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Optional custom cover letter (if not provided, auto-generated)"
    )

    def validate_job_ids(self, value):
        """Validate all job IDs exist."""
        existing_ids = set(Job.objects.filter(id__in=value).values_list('id', flat=True))
        missing_ids = set(value) - existing_ids
        if missing_ids:
            raise serializers.ValidationError(f"Jobs not found: {list(missing_ids)}")
        return value

    def validate_resume_id(self, value):
        """Validate resume belongs to the current user."""
        if value is None:
            return value
        user = self.context['request'].user
        try:
            Resume.objects.get(id=value, user=user)
        except Resume.DoesNotExist:
            raise serializers.ValidationError("Resume not found or doesn't belong to you.")
        return value

    def validate(self, attrs):
        """Check for duplicate applications."""
        user = self.context['request'].user
        job_ids = attrs['job_ids']
        
        existing_applications = Application.objects.filter(
            user=user,
            job_id__in=job_ids
        ).values_list('job_id', flat=True)
        
        if existing_applications:
            raise serializers.ValidationError({
                'job_ids': f"You have already applied to jobs: {list(existing_applications)}"
            })
        
        return attrs

    def create(self, validated_data):
        """Create multiple applications with AI cover letters and match scores."""
        from .views import generate_cover_letter
        import logging
        
        logger = logging.getLogger(__name__)
        
        user = self.context['request'].user
        job_ids = validated_data['job_ids']
        resume_id = validated_data.get('resume_id')
        custom_cover_letter = validated_data.get('cover_letter', '')
        
        resume = None
        if resume_id:
            resume = Resume.objects.get(id=resume_id)
        
        jobs = Job.objects.filter(id__in=job_ids)
        applications = []
        
        # Try to import AI services
        CoverLetterService = None
        MatchingService = None
        try:
            from ai.services import CoverLetterService, MatchingService
        except ImportError:
            logger.warning("AI services not available")
        
        for job in jobs:
            ai_generated_cover_letter = ''
            match_score = None
            match_breakdown = {}
            
            # Generate AI cover letter and match score if resume is available
            if resume and CoverLetterService and MatchingService:
                try:
                    # Generate cover letter
                    result = CoverLetterService.generate_cover_letter(resume, job)
                    ai_generated_cover_letter = result['cover_letter']
                    
                    # Compute match score
                    match_result = MatchingService.compute_match(resume, job)
                    match_score = match_result.overall_score
                    match_breakdown = match_result.breakdown
                except Exception as e:
                    logger.warning(f"AI processing failed for job {job.id}: {e}")
            
            # Determine cover letter to use
            if custom_cover_letter:
                cover_letter = custom_cover_letter
            elif ai_generated_cover_letter:
                cover_letter = ai_generated_cover_letter
            else:
                cover_letter = generate_cover_letter(user, job, resume)
            
            application = Application.objects.create(
                user=user,
                job=job,
                resume=resume,
                cover_letter=cover_letter,
                ai_generated_cover_letter=ai_generated_cover_letter,
                match_score=match_score,
                match_breakdown=match_breakdown,
                status='pending'
            )
            applications.append(application)
        
        return applications
