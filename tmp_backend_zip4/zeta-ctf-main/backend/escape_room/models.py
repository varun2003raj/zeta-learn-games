from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class Room(models.Model):
    DIFFICULTY_EASY = "EASY"
    DIFFICULTY_MEDIUM = "MEDIUM"
    DIFFICULTY_HARD = "HARD"
    DIFFICULTY_EXTREME = "EXTREME"

    DIFFICULTY_CHOICES = (
        (DIFFICULTY_EASY, "Easy"),
        (DIFFICULTY_MEDIUM, "Medium"),
        (DIFFICULTY_HARD, "Hard"),
        (DIFFICULTY_EXTREME, "Extreme"),
    )

    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default=DIFFICULTY_EASY)
    time_limit_minutes = models.PositiveIntegerField(default=5, validators=[MinValueValidator(1)])
    unlock_key = models.CharField(max_length=255, blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "id"]

    def __str__(self):
        return self.title


class Puzzle(models.Model):
    id = models.AutoField(primary_key=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="puzzles")
    title = models.CharField(max_length=200)
    description = models.TextField()
    answer = models.CharField(max_length=255)
    order = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    points = models.PositiveIntegerField(default=10)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("room", "order")
        ordering = ["order"]

    def __str__(self):
        return f"{self.room.title} - {self.title}"


class Hint(models.Model):
    id = models.AutoField(primary_key=True)
    puzzle = models.ForeignKey(Puzzle, on_delete=models.CASCADE, related_name="hints")
    text = models.TextField()
    penalty_points = models.PositiveIntegerField(default=2)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"Hint for {self.puzzle.title}"


class EscapeRoomProgress(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="escape_room_progress")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="progress_entries")
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    completed = models.BooleanField(default=False)
    failed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    total_score = models.PositiveIntegerField(default=0)
    current_puzzle = models.ForeignKey(
        Puzzle,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="active_progress_entries",
    )

    class Meta:
        unique_together = ("user", "room")
        ordering = ["-started_at", "id"]

    def __str__(self):
        return f"{self.user} - {self.room}"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at


class EscapePuzzleAttempt(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="escape_puzzle_attempts")
    puzzle = models.ForeignKey(Puzzle, on_delete=models.CASCADE, related_name="attempts")
    submitted_answer = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-submitted_at", "-id"]

    def __str__(self):
        return f"{self.user} - {self.puzzle}"


class EscapeRoomLeaderboard(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="escape_room_leaderboard")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="leaderboard_entries")
    score = models.PositiveIntegerField(default=0)
    completion_time_seconds = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField()

    class Meta:
        unique_together = ("user", "room")
        ordering = ["-score", "completion_time_seconds", "completed_at", "id"]

    def __str__(self):
        return f"{self.user} - {self.room} ({self.score})"
