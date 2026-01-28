from django.db import models
from django.conf import settings


class Job(models.Model):
    """
    Job model for storing job postings.
    Only admin users can create/edit/delete jobs.
    """
    EXPERIENCE_CHOICES = (
        ('entry', 'Entry Level'),
        ('mid', 'Mid Level'),
        ('senior', 'Senior Level'),
    )

    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    description = models.TextField()
    
    # JSON fields for flexible structured data
    # Requirements format: ["Requirement 1", "Requirement 2", ...]
    requirements = models.JSONField(default=list, blank=True)
    
    # Skills format: ["Python", "React", "Django"]
    skills = models.JSONField(default=list, blank=True)
    
    experience_level = models.CharField(
        max_length=20, 
        choices=EXPERIENCE_CHOICES, 
        default='mid'
    )
    
    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posted_jobs'
    )
    
    # AI embedding vector for semantic matching (stored as JSON array)
    embedding = models.JSONField(default=list, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} at {self.company}"


class Application(models.Model):
    """
    Model for job applications.
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('reviewing', 'Reviewing'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    )

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    resume = models.ForeignKey('resumes.Resume', on_delete=models.SET_NULL, null=True, blank=True, related_name='applications')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    cover_letter = models.TextField(blank=True)
    
    # AI-generated fields
    ai_generated_cover_letter = models.TextField(blank=True, default='')
    match_score = models.FloatField(null=True, blank=True, help_text='AI-computed match score (0-100)')
    match_breakdown = models.JSONField(default=dict, blank=True, help_text='Detailed match score breakdown')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('job', 'user')

    def __str__(self):
        return f"{self.user.username} - {self.job.title}"
