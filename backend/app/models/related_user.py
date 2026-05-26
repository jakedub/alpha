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
        ("#f59e0b", "Amber"),
        ("#fb923c", "Orange"),
        ("#f87171", "Rose"),
        ("#818cf8", "Indigo"),
        ("#a78bfa", "Violet"),
        ("#34d399", "Emerald"),
        ("#38bdf8", "Sky"),
    ]

    user = models.ForeignKey("app.User", on_delete=models.CASCADE, related_name='related_users')
    name = models.CharField(max_length=100)
    color_code = models.CharField(
        max_length=24,
        choices=COLOR_CHOICES,
        default="#f59e0b",
    )
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES, default='friend')

    def __str__(self):
        return f"{self.name} ({self.relationship})"