from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.event_view import EventViewSet
from .views.location_view import LocationViewSet
from .views.user_view import UserViewSet
from .views.room_view import RoomViewSet
from .views.upload_view import upload_csv

router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'locations', LocationViewSet)
router.register(r'users', UserViewSet)
router.register(r'rooms', RoomViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('upload/', upload_csv, name='upload_csv'),
]