from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Resume
from .serializers import ResumeSerializer


class ResumeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Resume CRUD operations.
    Users can only access their own resumes.
    """
    serializer_class = ResumeSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Filter resumes to only return those owned by the current user, unless user is admin."""
        user = self.request.user
        if user.role == 'admin':
            return Resume.objects.all()
        return Resume.objects.filter(user=user)

    @action(detail=True, methods=['post'])
    def set_active(self, request, pk=None):
        """Set a specific resume as the active resume."""
        resume = self.get_object()
        resume.is_active = True
        resume.save()  # The model's save method handles deactivating others
        serializer = self.get_serializer(resume)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the user's currently active resume."""
        try:
            resume = Resume.objects.get(user=request.user, is_active=True)
            serializer = self.get_serializer(resume)
            return Response(serializer.data)
        except Resume.DoesNotExist:
            return Response(
                {'detail': 'No active resume found.'},
                status=status.HTTP_404_NOT_FOUND
            )
