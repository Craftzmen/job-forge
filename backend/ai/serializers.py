"""
Serializers for AI endpoints.
"""
from rest_framework import serializers
from jobs.models import Job, Application


class JobMatchSerializer(serializers.ModelSerializer):
    """Serializer for job recommendations with match score."""
    match_score = serializers.FloatField(read_only=True)
    semantic_score = serializers.FloatField(read_only=True)
    skill_score = serializers.FloatField(read_only=True)
    experience_score = serializers.FloatField(read_only=True)
    location_score = serializers.FloatField(read_only=True)
    matching_skills = serializers.ListField(child=serializers.CharField(), read_only=True)
    missing_skills = serializers.ListField(child=serializers.CharField(), read_only=True)
    match_explanation = serializers.CharField(read_only=True)
    
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'company', 'location', 'description',
            'requirements', 'skills', 'experience_level',
            'created_at', 'updated_at',
            # AI match fields
            'match_score', 'semantic_score', 'skill_score',
            'experience_score', 'location_score',
            'matching_skills', 'missing_skills', 'match_explanation'
        ]


class CoverLetterGenerateRequestSerializer(serializers.Serializer):
    """Request serializer for cover letter generation."""
    resume_id = serializers.IntegerField(required=False, help_text="Resume ID to use. If not provided, uses active resume.")
    job_id = serializers.IntegerField(required=True, help_text="Job ID to generate cover letter for.")
    custom_instructions = serializers.CharField(required=False, allow_blank=True, help_text="Custom instructions for the AI.")


class CoverLetterResponseSerializer(serializers.Serializer):
    """Response serializer for generated cover letter."""
    cover_letter = serializers.CharField()
    generated_by = serializers.CharField()
    model = serializers.CharField(allow_null=True)
    editable = serializers.BooleanField()
    job_id = serializers.IntegerField()
    resume_id = serializers.IntegerField()


class CoverLetterRegenerateRequestSerializer(serializers.Serializer):
    """Request serializer for cover letter regeneration with feedback."""
    resume_id = serializers.IntegerField(required=False)
    job_id = serializers.IntegerField(required=True)
    previous_letter = serializers.CharField(required=True)
    feedback = serializers.CharField(required=True, help_text="User's feedback for improvement.")


class MatchScoreRequestSerializer(serializers.Serializer):
    """Request serializer for computing match score."""
    resume_id = serializers.IntegerField(required=False, help_text="Resume ID. If not provided, uses active resume.")
    job_id = serializers.IntegerField(required=True, help_text="Job ID to compute match score for.")


class MatchScoreResponseSerializer(serializers.Serializer):
    """Response serializer for match score computation."""
    overall_score = serializers.FloatField()
    semantic_score = serializers.FloatField()
    skill_score = serializers.FloatField()
    experience_score = serializers.FloatField()
    location_score = serializers.FloatField()
    matching_skills = serializers.ListField(child=serializers.CharField())
    missing_skills = serializers.ListField(child=serializers.CharField())
    explanation = serializers.CharField()
    job = serializers.DictField()
    resume_id = serializers.IntegerField()


class BulkMatchScoreRequestSerializer(serializers.Serializer):
    """Request serializer for bulk match score computation."""
    resume_id = serializers.IntegerField(required=False)
    job_ids = serializers.ListField(child=serializers.IntegerField(), required=True)


class ApplicationWithMatchSerializer(serializers.ModelSerializer):
    """Extended application serializer with match details."""
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_company = serializers.CharField(source='job.company', read_only=True)
    job_location = serializers.CharField(source='job.location', read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'id', 'job', 'job_title', 'job_company', 'job_location',
            'user', 'resume', 'status', 'cover_letter',
            'ai_generated_cover_letter', 'match_score', 'match_breakdown',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']


# ============================================
# Assistance Serializers
# ============================================

class ResumeSummaryAssistRequestSerializer(serializers.Serializer):
    title = serializers.CharField(required=True)
    skills = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    experience = serializers.ListField(child=serializers.DictField(), required=False, default=list)


class ResumeSkillsAssistRequestSerializer(serializers.Serializer):
    title = serializers.CharField(required=True)
    current_skills = serializers.ListField(child=serializers.CharField(), required=False, default=list)


class ResumeJobDescriptionAssistRequestSerializer(serializers.Serializer):
    title = serializers.CharField(required=True)
    company = serializers.CharField(required=True)
    context = serializers.CharField(required=False, allow_blank=True)


class AssistanceResponseSerializer(serializers.Serializer):
    content = serializers.CharField()
    generated_by = serializers.CharField()
    error = serializers.CharField(required=False, allow_null=True)
