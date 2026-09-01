from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User


class TreasureHuntProgress(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="treasure_hunt_progress",
    )
    total_score = models.IntegerField(default=0)
    best_score = models.IntegerField(default=0)
    completed_levels = models.JSONField(default=list)
    best_scores = models.JSONField(default=dict)
    total_attempts = models.IntegerField(default=0)
    total_hints_used = models.IntegerField(default=0)
    highest_unlocked_level = models.IntegerField(default=1)
    last_played_level = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.user.username} - {self.total_score}"