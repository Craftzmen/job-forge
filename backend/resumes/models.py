from django.db import models
from django.conf import settings


class Resume(models.Model):
    """
    Resume model for storing user CVs.
    Uses JSON fields for flexible experience/education/skills data,
    designed to be compatible with future AI processing.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='resumes'
    )
    title = models.CharField(max_length=255)
    
    # Personal Information
    name = models.CharField(max_length=255, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=50, blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    
    # JSON fields for flexible structured data
    # Links format: [{"label": "LinkedIn", "url": "https://linkedin.com/in/username"}]
    links = models.JSONField(default=list, blank=True)
    summary = models.TextField(blank=True, default='')
    # Experience format: [{"title": "", "company": "", "startDate": "", "endDate": "", "description": ""}]
    experience = models.JSONField(default=list, blank=True)
    
    # Education format: [{"degree": "", "institution": "", "year": "", "field": ""}]
    education = models.JSONField(default=list, blank=True)
    
    # Skills format: ["Python", "React", "Django"]
    skills = models.JSONField(default=list, blank=True)
    
    # AI embedding vector for semantic matching (stored as JSON array)
    embedding = models.JSONField(default=list, blank=True, null=True)
    
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.email}"

    def save(self, *args, **kwargs):
        # If this resume is being set as active, deactivate all other resumes for this user
        if self.is_active:
            Resume.objects.filter(user=self.user, is_active=True).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)
