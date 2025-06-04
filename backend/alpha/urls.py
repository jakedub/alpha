from django.contrib import admin
from django.urls import path,include, re_path
from app.views.session_view import api_login, api_logout, api_me
from app.views.map_view import tile_proxy

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('app.urls')),
    path("api/login/", api_login),
    path("api/logout/", api_logout),
    path("api/me/", api_me),
    re_path(r'^proxy/tiles/(?P<floor>[^/]+)/(?P<zoom>\d+)/(?P<x>\d+)/(?P<y>\d+)\.png$', tile_proxy)
]
