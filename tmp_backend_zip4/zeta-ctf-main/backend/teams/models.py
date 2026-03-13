from django.db import models
from django.conf import settings
from challenges.models import Challenge
import random
import string


def generate_team_code():
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not Team.objects.filter(code=code).exists():
            return code


class Team(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=6, unique=True, default=generate_team_code)
    leader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="team_leader")
    score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class TeamMember(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="members")
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} -> {self.team.name}"


class TeamSolvedChallenge(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
    solved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    solved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("team", "challenge")

    def __str__(self):
        return f"{self.team.name} solved {self.challenge.title}"
