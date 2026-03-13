from django.contrib import admin
from .models import Submission, SolvedChallenge

admin.site.register(Submission)
admin.site.register(SolvedChallenge)
