from django.contrib import admin
from .models import Job


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'location', 'experience_level', 'posted_by', 'created_at')
    list_filter = ('experience_level', 'location', 'created_at')
    search_fields = ('title', 'company', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
