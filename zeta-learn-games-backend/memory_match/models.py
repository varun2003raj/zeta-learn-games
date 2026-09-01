
from django.conf import settings
from django.db import models


class MemoryCard(models.Model):
    CATEGORY_CHOICES = [
        ("MALWARE", "Malware"),
        ("NETWORK", "Network"),
        ("SECURITY", "Security"),
        ("ATTACK", "Attack"),
        ("DEFENSE", "Defense"),
        ("CRYPTOGRAPHY", "Cryptography"),
        ("PROGRAMMING", "Programming"),
    ]

    name = models.CharField(max_length=100)
    
    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
        default="OTHER",
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class MemoryGameSetting(models.Model):
    DIFFICULTY_CHOICES = [
        ("EASY", "Easy"),
        ("MEDIUM", "Medium"),
        ("HARD", "Hard"),
        ("EXPERT", "Expert"),
    ]

    difficulty = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CHOICES,
        unique=True,
    )
    grid_size = models.PositiveIntegerField()
    time_limit_seconds = models.PositiveIntegerField(default=180)
    points_per_pair = models.PositiveIntegerField(default=100)
    wrong_move_penalty = models.PositiveIntegerField(default=5)
    hint_penalty = models.PositiveIntegerField(default=25)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.get_difficulty_display()} - {self.grid_size}x{self.grid_size}"


class MemoryBestScore(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="memory_best_score",
    )

    easy_best = models.PositiveIntegerField(default=0)
    medium_best = models.PositiveIntegerField(default=0)
    hard_best = models.PositiveIntegerField(default=0)
    expert_best = models.PositiveIntegerField(default=0)
    total_best = models.PositiveIntegerField(default=0)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.total_best}"