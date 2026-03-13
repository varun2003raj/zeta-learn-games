from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminEscapeAttemptViewSet,
    AdminEscapeProgressViewSet,
    AdminHintViewSet,
    AdminPuzzleViewSet,
    AdminRoomViewSet,
    EscapeLeaderboardListAPIView,
    EscapeLeaderboardAPIView,
    MyEscapeAttemptsAPIView,
    MyEscapeProgressAPIView,
    RequestEscapeHintAPIView,
    RoomViewSet,
    StartEscapeRoomAPIView,
    SubmitEscapeAnswerAPIView,
)

router = DefaultRouter()
router.register("rooms", RoomViewSet, basename="escape-room")

admin_router = DefaultRouter()
admin_router.register("admin/rooms", AdminRoomViewSet, basename="escape-admin-room")
admin_router.register("admin/puzzles", AdminPuzzleViewSet, basename="escape-admin-puzzle")
admin_router.register("admin/hints", AdminHintViewSet, basename="escape-admin-hint")
admin_router.register("admin/progress", AdminEscapeProgressViewSet, basename="escape-admin-progress")
admin_router.register("admin/attempts", AdminEscapeAttemptViewSet, basename="escape-admin-attempt")

urlpatterns = [
    path("", include(router.urls)),
    path("", include(admin_router.urls)),
    path("start/", StartEscapeRoomAPIView.as_view()),
    path("submit/", SubmitEscapeAnswerAPIView.as_view()),
    path("hint/", RequestEscapeHintAPIView.as_view()),
    path("progress/", MyEscapeProgressAPIView.as_view()),
    path("attempts/", MyEscapeAttemptsAPIView.as_view()),
    path("leaderboard/", EscapeLeaderboardListAPIView.as_view()),
    path("leaderboard/<int:room_id>/", EscapeLeaderboardAPIView.as_view()),
]
