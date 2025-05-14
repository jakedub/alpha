# models/event.py
from django.db import models
from .location import Location
from .user import User
from .room import Room

EVENT_TYPE_CHOICES = [
    ("RPG", "Role Playing Game"),
    ("WKS", "Workshop"),
    ("MHE", "Miniature Hobby Events"),
    ("LRP", "LARP"),
    ("CGM", "Non-Collectible / Tradable Card Game"),
    ("BGM", "Board Game"),
    ("ENT", "Entertainment Events"),
    ("TRD", "Trade Day Event"),
    ("SEM", "Seminar"),
    ("TCG", "Tradable Card Game"),
    ("SPA", "Supplemental Activities"),
    ("HMN", "Historical Miniatures"),
    ("ZED", "Isle of Misfit Events"),
    ("NMN", "Non-Historical Miniatures"),
    ("KID", "Kids Activities"),
    ("EGM", "Electronic Games"),
    ("FLM", "Film Fest"),
    ("TDA", "True Dungeon Adventures!"),
    ("OTH", "OTHER"),
]
AGE_REQUIRED_CHOICES = [
    ("Teen", "Teen (13+)"),
    ("Mature", "Mature (18+)"),
    ("Everyone", "Everyone (6+)"),
    ("21+", "21+"),
    ("Kids", "Kids Only (12 and under)"),
]

EXPERIENCE_REQUIRED_CHOICES = [
    ("None", "None (You've never played before - rules will be taught)"),
    ("Some", "Some (You've played it a bit and understand the basics)"),
    ("Expert", "Expert (You play it regularly and know all the rules)")
]

class Event(models.Model):
    game_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    gaming_group = models.CharField(max_length=255, default="Unknown Group")
    title = models.CharField(max_length=255, null=True, blank=True)
    short_description = models.TextField(null=True, blank=True)
    long_description = models.TextField(null=True, blank=True)
    event_type = models.CharField(
    max_length=100,
    choices=EVENT_TYPE_CHOICES,
    default="OTH"
    )
    game_system = models.CharField(max_length=100, null=True, blank=True)
    rules_edition = models.CharField(max_length=10, null=True, blank=True)
    minimum_players = models.IntegerField(null=True, blank=True)
    maximum_players = models.IntegerField(null=True, blank=True)
    minimum_age = models.CharField(
    max_length=50,
    choices=AGE_REQUIRED_CHOICES,
    default="Everyone"
    )
    experience_required = models.CharField(
    max_length=100,
    choices= EXPERIENCE_REQUIRED_CHOICES,
    default="None"
    )
    materials_required = models.BooleanField(default=False)
    materials_required_details = models.TextField(null=True, blank=True)
    start_time = models.DateTimeField()
    duration_hours = models.IntegerField(null=True, blank=True)
    end_time = models.DateTimeField()
    gm_names = models.CharField(max_length=255, null=True, blank=True)
    website = models.URLField(null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    tournament = models.BooleanField(default=False)
    round_number = models.IntegerField(null=True, blank=True)
    total_rounds = models.IntegerField(null=True, blank=True)
    minimum_play_time = models.IntegerField(null=True, blank=True)
    attendee_registration = models.TextField(null=True, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    location = models.ForeignKey(Location, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True)
    table_number = models.CharField(max_length=50, null=True, blank=True)
    special_category = models.CharField(max_length=255, null=True, blank=True)
    tickets_available = models.IntegerField(null=True, blank=True)
    last_modified = models.DateField(auto_now=True)

    def __str__(self):
        return self.title