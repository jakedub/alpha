from django.db import models

class User(models.Model):
    MOBILITY_CHOICES = [
        ('none', 'No Issues'),
        ('wheelchair', 'Wheelchair'),
        ('cane', 'Cane'),
        ('walker', 'Walker'),
        ('other', 'Other'),
    ]

    STAIR_PREFERENCE_CHOICES = [
        ('stairs', 'Prefer Stairs'),
        ('elevator', 'Prefer Elevator'),
        ('no_preference', 'No Preference'),
    ]

    username = models.CharField(max_length=255)
    email = models.EmailField()
    mobility_aid = models.CharField(max_length=20, choices=MOBILITY_CHOICES, default='none')
    stair_preference = models.CharField(max_length=20, choices=STAIR_PREFERENCE_CHOICES, default='no_preference')

    def __str__(self):
        return self.username