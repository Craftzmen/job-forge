"""
URL patterns for AI endpoints.
"""
from django.urls import path
from .views import (
    JobRecommendationsView,
    CoverLetterGenerateView,
    CoverLetterRegenerateView,
    MatchScoreView,
    BulkMatchScoreView,
    ApplicationCoverLetterView,
    ResumeSummaryAssistView,
    ResumeSkillsAssistView,
    ResumeJobDescriptionAssistView,
)

urlpatterns = [
    # Job recommendations
    path('recommendations/', JobRecommendationsView.as_view(), name='job-recommendations'),
    
    # Cover letter generation
    path('generate-cover-letter/', CoverLetterGenerateView.as_view(), name='generate-cover-letter'),
    path('regenerate-cover-letter/', CoverLetterRegenerateView.as_view(), name='regenerate-cover-letter'),
    
    # Match score computation
    path('match-score/', MatchScoreView.as_view(), name='match-score'),
    path('bulk-match-scores/', BulkMatchScoreView.as_view(), name='bulk-match-scores'),
    
    # Application cover letter preview
    path('applications/<int:application_id>/cover-letter/', ApplicationCoverLetterView.as_view(), name='application-cover-letter'),
    
    # Resume assistance
    path('resume/summary-assist/', ResumeSummaryAssistView.as_view(), name='resume-summary-assist'),
    path('resume/skills-assist/', ResumeSkillsAssistView.as_view(), name='resume-skills-assist'),
    path('resume/job-description-assist/', ResumeJobDescriptionAssistView.as_view(), name='resume-job-description-assist'),
]
