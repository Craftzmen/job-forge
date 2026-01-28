from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow admin and company users to edit objects.
    Read-only access is allowed for all authenticated users.
    """

    def has_permission(self, request, view):
        # Read permissions are allowed for any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are allowed to admin and company users
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'company']
        )
