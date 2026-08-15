from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Itinerary

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class ItinerarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Itinerary
        fields = '__all__'
        read_only_fields = ('user', 'status', 'task_id', 'created_at', 'result_json', 'total_estimated_cost', 'flights_mock_price', 'hotels_mock_price')
