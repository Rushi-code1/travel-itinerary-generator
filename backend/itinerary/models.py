from django.db import models
from django.contrib.auth.models import User

class Itinerary(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='itineraries')
    destination = models.CharField(max_length=255)
    days = models.IntegerField(default=3)
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    style = models.CharField(max_length=100)
    currency = models.CharField(max_length=10, default='USD')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    task_id = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    result_json = models.JSONField(blank=True, null=True)
    
    total_estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    flights_mock_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    hotels_mock_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.destination} ({self.days} days, {self.currency}) by {self.user.username}'
