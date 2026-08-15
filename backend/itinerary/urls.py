from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, ItineraryViewSet

router = DefaultRouter()
router.register(r'list', ItineraryViewSet, basename='itinerary')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('', include(router.urls)),
]
