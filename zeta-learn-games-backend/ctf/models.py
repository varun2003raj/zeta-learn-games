from django.contrib.auth.models import User
from django.db import models

class CTFCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class CTFChallenge(models.Model):
    DIFFICULTY_CHOICES = [
        ("easy", "Easy"),
        ("medium", "Medium"),
        ("hard", "Hard"),
        ("ultra_hard", "Ultra Hard"),
    ]

    title = models.CharField(max_length=200)

    # Main challenge/question content
    description = models.TextField()

    category = models.ForeignKey(
        CTFCategory,
        on_delete=models.PROTECT,
        related_name="challenges",
    )

    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default="easy",
    )

    points = models.PositiveIntegerField(default=100)

    # Correct flag - never expose this through GET APIs
    flag = models.CharField(max_length=500)

    # CTF hints
    hint_1 = models.TextField(blank=True, default="")
    hint_2 = models.TextField(blank=True, default="")

    hint_1_penalty = models.PositiveIntegerField(default=10)
    hint_2_penalty = models.PositiveIntegerField(default=10)

    # Whether each hint is visible to players
    hint_1_visible = models.BooleanField(default=False)
    hint_2_visible = models.BooleanField(default=False)

    # Optional challenge file
    file = models.FileField(
        upload_to="ctf/challenges/",
        blank=True,
        null=True,
    )

    is_active = models.BooleanField(default=True)

    tiebreaker_visible = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    # Users who already solved this challenge
    solved_by = models.ManyToManyField(
        User,
        blank=True,
        related_name="solved_ctf_challenges",
    )

    def __str__(self):
        return self.title

    #-------------team------------
class CTFTeam(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)

    leader = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="ctf_led_teams",
    )

    members = models.ManyToManyField(
        User,
        related_name="ctf_teams",
        blank=True,
    )

    score = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name



class CTFScoreHistory(models.Model):
    team = models.ForeignKey(
        CTFTeam,
        on_delete=models.CASCADE,
        related_name="score_history",
    )

    score = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.team.name} - {self.score}"


class CTFHistory(models.Model):
    name = models.CharField(max_length=200)
    snapshot = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class CTFAnnouncement(models.Model):
    title = models.CharField(max_length=200)
    message = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title



class CTFLifecycle(models.Model):
    STATUS_CHOICES = [
        ("not_started", "Not Started"),
        ("running", "Running"),
        ("finished", "Finished"),
    ]

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="not_started",
    )

    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.status


class CTFHintUsage(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="ctf_hint_usages",
    )

    challenge = models.ForeignKey(
        CTFChallenge,
        on_delete=models.CASCADE,
        related_name="hint_usages",
    )

    hint_1_used = models.BooleanField(default=False)
    hint_2_used = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "challenge")

    def __str__(self):
        return f"{self.user.username} - {self.challenge.title}"