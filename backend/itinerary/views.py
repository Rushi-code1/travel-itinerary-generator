from django.contrib.auth.models import User
from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from .models import Itinerary
from .serializers import UserSerializer, ItinerarySerializer
from .tasks import generate_travel_itinerary_task

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

class ItineraryViewSet(viewsets.ModelViewSet):
    serializer_class = ItinerarySerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        # Filter itineraries by current user
        return Itinerary.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Save itinerary and trigger async generation in Celery
        itinerary = serializer.save(user=self.request.user, status='PENDING')
        
        # Trigger Celery Task
        task = generate_travel_itinerary_task.delay(itinerary.id)
        
        # Save task ID to database
        itinerary.task_id = task.id
        itinerary.save()
