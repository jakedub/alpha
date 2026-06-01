from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views.fetch_schedule import get_schedule

from .views.data_sync import (
    data_sync_status, sync_schedule, trigger_data_sync,
    map_pipeline_status, trigger_map_extract, trigger_map_stitch,
)
from .views.worker_view import worker_start, worker_status, worker_logs

from .views.vendor_visit_view import VendorVisitViewSet

from .views.tag_view import TagViewSet
from .views.user_event_view import UserEventViewSet
from .views.event_view import EventViewSet
from .views.location_view import LocationViewSet
from .views.user_view import UserViewSet
from .views.room_view import RoomViewSet
from .views.entrance_view import EntranceViewSet
from .views.related_user_view import RelatedUserViewSet
from .views.user_vendor_view import UserVendorViewSet
from .views.vendor_view import VendorViewSet
from .views.user_watched_event_view import UserWatchedEventViewSet
from .views.calendar_event_view import CalendarEventViewSet
from .views.notification_view import NotificationViewSet
from .views.gencon_event_search_view import gencon_event_search
from .views.event_search_view import EventSearchView


from .views.upload_view import upload_csv
from .views.pathfind_view import pathfind

router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'locations', LocationViewSet)
router.register(r'users', UserViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'entrance', EntranceViewSet)
router.register(r'user_events', UserEventViewSet)
router.register(r'related_users', RelatedUserViewSet)
router.register(r'user_vendors', UserVendorViewSet)
router.register(r'vendors', VendorViewSet)
router.register(r'user-watched-events', UserWatchedEventViewSet)
router.register(r'tags', TagViewSet)
router.register(r'vendor_visits', VendorVisitViewSet)
router.register(r'calendar_events', CalendarEventViewSet)
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),

    path('upload/', upload_csv),
    path('gencon-event-search/', gencon_event_search),
    path('event-search/', EventSearchView.as_view()),

    path('data-sync/trigger/', trigger_data_sync),
    path('data-sync/status/<str:task_id>/', data_sync_status),
    path('worker/start/', worker_start),
    path('worker/status/', worker_status),
    path('worker/logs/', worker_logs),
    path('fetch-schedule/<str:gencon_id>/', get_schedule),
    path('schedule/sync/', sync_schedule),

    path('map-pipeline/status/',  map_pipeline_status),
    path('map-pipeline/extract/', trigger_map_extract),
    path('map-pipeline/stitch/',  trigger_map_stitch),

    path('pathfind/', pathfind),
]