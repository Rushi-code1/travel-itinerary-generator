import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from .models import Itinerary
from .tasks import generate_travel_itinerary_task

@pytest.mark.django_db
def test_travel_user_auth_flow():
    client = APIClient()
    # Test Register
    response = client.post('/api/itineraries/register/', {
        'username': 'traveler1',
        'password': 'travelpassword123',
        'email': 'traveler1@example.com'
    })
    assert response.status_code == 201

    # Test Login
    response = client.post('/api/token/', {
        'username': 'traveler1',
        'password': 'travelpassword123'
    })
    assert response.status_code == 200
    assert 'access' in response.data

@pytest.mark.django_db
def test_create_itinerary_api():
    client = APIClient()
    user = User.objects.create_user(username='traveler2', password='password123')
    client.force_authenticate(user=user)

    # Post to create itinerary
    response = client.post('/api/itineraries/list/', {
        'destination': 'Paris, France',
        'days': 4,
        'budget': '1200.00',
        'style': 'Culinary',
        'currency': 'EUR'
    })
    
    assert response.status_code == 201
    assert response.data['destination'] == 'Paris, France'
    assert response.data['currency'] == 'EUR'
    assert response.data['status'] == 'PENDING'
    assert response.data['task_id'] is not None

@pytest.mark.django_db
def test_celery_itinerary_generation_task():
    # Setup database record
    user = User.objects.create_user(username='traveler3', password='password123')
    itinerary = Itinerary.objects.create(
        user=user,
        destination='Tokyo, Japan',
        days=3,
        budget=1500.00,
        style='Adventure',
        currency='USD',
        status='PENDING',
        task_id='mock-task-uuid-12345'
    )

    # Execute celery task synchronously (in-thread)
    generate_travel_itinerary_task(itinerary.id)

    # Reload itinerary from database
    itinerary.refresh_from_db()
    
    assert itinerary.status == 'COMPLETED'
    assert itinerary.flights_mock_price > 0
    assert itinerary.hotels_mock_price > 0
    assert itinerary.total_estimated_cost > 0
    assert itinerary.result_json is not None
    
    days_data = itinerary.result_json['days'] if isinstance(itinerary.result_json, dict) else itinerary.result_json
    assert len(days_data) == 3
    assert days_data[0]['day'] == 1
    assert len(days_data[0]['activities']) > 0
