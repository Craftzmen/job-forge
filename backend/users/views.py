from rest_framework import generics, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import UserSerializer, CustomTokenObtainPairSerializer
from .permissions import IsAdmin

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

class MeView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Admin to manage users.
    Company role cannot access this endpoint.
    """
    serializer_class = UserSerializer
    permission_classes = (IsAdmin,)
    from jobs.views import JobPagination
    pagination_class = JobPagination

    def get_queryset(self):
        """
        Admin can see all users.
        This endpoint is blocked for company role via IsAdmin permission.
        """
        return User.objects.all()
