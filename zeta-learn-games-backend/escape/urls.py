from django.urls import path
from .views import (
    player_rooms,
    player_room_detail,
    player_progress,
    admin_rooms,
    admin_room_detail,
    start_escape,
    admin_escape_state,
    admin_escape_start,
    admin_escape_finish,
    admin_escape_reset,
    admin_puzzles,
    admin_puzzle_detail,
    admin_hints,
    admin_hint_detail,
    submit_answer,
    request_hint,
    admin_escape_progress,
    admin_escape_attempts,
    admin_escape_submissions,
)

urlpatterns = [
    path("rooms/", player_rooms, name="player-rooms"),
    path("rooms/<int:room_id>/", player_room_detail, name="player-room-detail"),

    # Admin Escape Rooms
    path("admin/rooms/", admin_rooms, name="admin-rooms"),
    path("admin/rooms/<int:room_id>/",admin_room_detail,name="admin-room-detail",),
    path("admin/puzzles/", admin_puzzles, name="admin-puzzles"),
    path("admin/puzzles/<int:puzzle_id>/",admin_puzzle_detail,name="admin-puzzle-detail",),
    path("admin/hints/", admin_hints, name="admin-hints"),
    path("admin/hints/<int:hint_id>/",admin_hint_detail,name="admin-hint-detail",),

    # Admin Escape Event Control
    path("admin/state/", admin_escape_state, name="admin-escape-state"),
    path("admin/start/", admin_escape_start, name="admin-escape-start"),
    path("admin/finish/", admin_escape_finish, name="admin-escape-finish"),
    path("admin/reset/", admin_escape_reset, name="admin-escape-reset"),
    

    # Player Escape Room
    path("start/", start_escape, name="player-start"),
    path("progress/", player_progress, name="player-progress"),
    path("submit/", submit_answer, name="player-submit"),
    path("hint/", request_hint, name="player-hint"),

    #attempt
    path("admin/progress/", admin_escape_progress, name="admin-escape-progress"),
    path("admin/attempts/", admin_escape_attempts, name="admin-escape-attempts"),
    path("admin/submissions/",admin_escape_submissions,name="admin-escape-submissions",),
]