from django.contrib import admin
from .models import (
    CTFCategory,
    CTFChallenge,
    CTFTeam,
    CTFScoreHistory,
    CTFHistory,
    CTFAnnouncement,
    CTFLifecycle,
    CTFHintUsage,
)


admin.site.register(CTFCategory)
admin.site.register(CTFChallenge)
admin.site.register(CTFTeam)
admin.site.register(CTFScoreHistory)
admin.site.register(CTFHistory)
admin.site.register(CTFAnnouncement)
admin.site.register(CTFLifecycle)
admin.site.register(CTFHintUsage)