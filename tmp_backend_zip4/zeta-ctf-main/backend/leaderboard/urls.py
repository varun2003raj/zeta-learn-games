from django.urls import path
from .views import LeaderboardView, LeaderboardTimelineView, AdminLeaderboardTimelineView

urlpatterns = [
    path("", LeaderboardView.as_view()),
    path("timeline/", LeaderboardTimelineView.as_view()),
    path("admin/timeline/", AdminLeaderboardTimelineView.as_view()),
]
