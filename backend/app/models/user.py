from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from multiselectfield import MultiSelectField

class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
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

    username = models.CharField(max_length=255, unique=True)
    email = models.EmailField(unique=True)
    mobility_aid = MultiSelectField(choices=MOBILITY_CHOICES, default='none')
    stair_preference = models.CharField(max_length=20, choices=STAIR_PREFERENCE_CHOICES, default='no_preference')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username