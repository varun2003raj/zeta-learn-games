from django.conf import settings
from django.db import models


class EscapeRoom(models.Model):
    DIFFICULTY_CHOICES = [
        ("EASY", "Easy"),
        ("MEDIUM", "Medium"),
        ("HARD", "Hard"),
        ("EXTREME", "Extreme"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default="EASY",
    )
    time_limit_minutes = models.PositiveIntegerField(default=5)
    room_key = models.CharField(
       max_length=100,
        unique=True,
        blank=True,
        null=True,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.title


class Puzzle(models.Model):
    room = models.ForeignKey(
        EscapeRoom,
        on_delete=models.CASCADE,
        related_name="puzzles",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    challenge = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=1)
    points = models.PositiveIntegerField(default=10)
    answer = models.CharField(max_length=500)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order"]
        unique_together = ["room", "order"]

    def __str__(self):
        return f"{self.room.title} - {self.title}"


class Hint(models.Model):
    puzzle = models.ForeignKey(
        Puzzle,
        on_delete=models.CASCADE,
        related_name="hints",
    )
    text = models.TextField()
    penalty_points = models.PositiveIntegerField(default=2)

    def __str__(self):
        return f"Hint - {self.puzzle.title}"


class Progress(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="escape_progress",
    )
    room = models.ForeignKey(
        EscapeRoom,
        on_delete=models.CASCADE,
        related_name="progress",
    )
    current_puzzle = models.ForeignKey(
        Puzzle,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    total_score = models.IntegerField(default=0)
    remaining_time_seconds = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)
    failed = models.BooleanField(default=False)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    hints_used = models.JSONField(default=dict, blank=True)

    class Meta:
        unique_together = ["user", "room"]

    def __str__(self):
        return f"{self.user} - {self.room}"


class EscapeGameAttempt(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="escape_game_attempts",
    )
    room = models.ForeignKey(
        EscapeRoom,
        on_delete=models.CASCADE,
        related_name="game_attempts",
    )
    attempt_number = models.PositiveIntegerField(default=1)

    current_puzzle = models.ForeignKey(
        Puzzle,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )

    total_score = models.IntegerField(default=0)
    remaining_time_seconds = models.PositiveIntegerField(default=0)

    status = models.CharField(
        max_length=20,
        choices=[
            ("IN_PROGRESS", "In Progress"),
            ("COMPLETED", "Completed"),
            ("FAILED", "Failed"),
        ],
        default="IN_PROGRESS",
    )

    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-started_at"]
        unique_together = ["user", "room", "attempt_number"]

    def __str__(self):
        return f"{self.user} - {self.room} - Attempt {self.attempt_number}"


class Attempt(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="escape_attempts",
    )
    puzzle = models.ForeignKey(
        Puzzle,
        on_delete=models.CASCADE,
        related_name="attempts",
    )
    submitted_answer = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.puzzle.title}"


class EscapeEventState(models.Model):
    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("STARTED", "Started"),
        ("FINISHED", "Finished"),
    ]

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="DRAFT",
    )
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.status