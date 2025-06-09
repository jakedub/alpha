from django.db import models

class RelatedUser(models.Model):
    RELATIONSHIP_CHOICES = [
        ('son', 'Son'),
        ('daughter', 'Daughter'),
        ('father', 'Father'),
        ('mother', 'Mother'),
        ('brother', 'Brother'),
        ('sister', 'Sister'),
        ('spouse', 'Spouse'),
        ('partner', 'Partner'),
        ('guardian', 'Guardian'),
        ('grandparent', 'Grandparent'),
        ('friend', 'Friend'),
    ]

    COLOR_CHOICES = [
        ("#00F0FF", "Blue"),
        ("#00FF81", "Green"),
        ("#FFA900", "Orange"),
        ("#FF6800", "Pumpkin"),
        ("#6F2DBD", "Purple")
    ]
    user = models.ForeignKey("app.User", on_delete=models.CASCADE, related_name='related_users')
    name = models.CharField(max_length=100)
    color_code =models.CharField(
        max_length=24,
        choices=COLOR_CHOICES,
        default="#00F0FF",  # fallback color
        )
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES, default='friend')

    def __str__(self):
        return f"{self.name} ({self.relationship})"