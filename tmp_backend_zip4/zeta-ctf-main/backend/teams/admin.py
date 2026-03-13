from django.contrib import admin
from .models import Team, TeamMember, TeamSolvedChallenge

admin.site.register(Team)
admin.site.register(TeamMember)
admin.site.register(TeamSolvedChallenge)
