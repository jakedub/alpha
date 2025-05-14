# admin.py
from django.contrib import admin
from .models.event import Event
from .models.location import Location
from .models.route import Route
from .models.user import User
from .models.room import Room

admin.site.register(Event)
admin.site.register(Location)
admin.site.register(Route)
admin.site.register(User)
admin.site.register(Room)