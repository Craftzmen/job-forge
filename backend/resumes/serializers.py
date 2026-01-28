from rest_framework import serializers
from .models import Resume


class ResumeSerializer(serializers.ModelSerializer):
    """Serializer for Resume model with all CRUD operations."""
    
    class Meta:
        model = Resume
        fields = (
            'id',
            'title',
            'name',
            'email',
            'phone',
            'location',
            'links',
            'summary',
            'experience',
            'education',
            'skills',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_links(self, value):
        """Validate links is a list of objects with label and url."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Links must be a list.")
        
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError("Each link entry must be an object.")
            required_fields = ['label', 'url']
            for field in required_fields:
                if field not in item:
                    raise serializers.ValidationError(f"Each link entry must have a '{field}' field.")
        return value

    def validate_experience(self, value):
        """Validate experience is a list of objects with required fields."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Experience must be a list.")
        
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError("Each experience entry must be an object.")
            required_fields = ['title', 'company']
            for field in required_fields:
                if field not in item:
                    raise serializers.ValidationError(f"Each experience entry must have a '{field}' field.")
        return value

    def validate_education(self, value):
        """Validate education is a list of objects with required fields."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Education must be a list.")
        
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError("Each education entry must be an object.")
            required_fields = ['degree', 'institution']
            for field in required_fields:
                if field not in item:
                    raise serializers.ValidationError(f"Each education entry must have a '{field}' field.")
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
        """Create resume with the current user from context."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
