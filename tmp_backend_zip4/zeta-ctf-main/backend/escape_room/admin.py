from django.contrib import admin
from django.db.models import Q

from .models import (
    EscapePuzzleAttempt,
    EscapeRoomLeaderboard,
    EscapeRoomProgress,
    Hint,
    Puzzle,
    Room,
)


class HintInline(admin.TabularInline):
    model = Hint
    extra = 1


class PuzzleInline(admin.TabularInline):
    model = Puzzle
    fields = ("title", "order", "points", "is_active")
    extra = 1
    show_change_link = True


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("title", "difficulty", "time_limit_minutes", "is_active", "created_at")
    list_filter = ("difficulty", "is_active")
    search_fields = ("title", "description")
    inlines = [PuzzleInline]


@admin.register(Puzzle)
class PuzzleAdmin(admin.ModelAdmin):
    list_display = ("title", "room", "order", "points", "is_active")
    list_filter = ("is_active", "room__difficulty")
    search_fields = ("title", "description", "room__title")
    ordering = ("room", "order")
    inlines = [HintInline]


@admin.register(Hint)
class HintAdmin(admin.ModelAdmin):
    list_display = ("id", "puzzle", "penalty_points")
    list_filter = ("penalty_points", "puzzle__room__difficulty")
    search_fields = ("text", "puzzle__title", "puzzle__room__title")


@admin.register(EscapeRoomProgress)
class EscapeRoomProgressAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "room",
        "total_score",
        "completed",
        "failed",
        "started_at",
        "expires_at",
        "completed_at",
    )
    list_filter = ("completed", "failed", "room__difficulty")
    search_fields = ("user__username", "room__title")
    autocomplete_fields = ("user", "room", "current_puzzle")
    readonly_fields = ("started_at", "completed_at")


@admin.register(EscapePuzzleAttempt)
class EscapePuzzleAttemptAdmin(admin.ModelAdmin):
    list_display = ("user", "puzzle", "is_correct", "submitted_at")
    list_filter = ("is_correct", "submitted_at", "puzzle__room")
    search_fields = ("user__username", "puzzle__title", "submitted_answer")
    autocomplete_fields = ("user", "puzzle")
    readonly_fields = ("submitted_at",)


@admin.register(EscapeRoomLeaderboard)
class EscapeRoomLeaderboardAdmin(admin.ModelAdmin):
    list_display = ("ranking", "user", "room", "score", "completion_time_seconds", "completed_at")
    list_filter = ("room", "room__difficulty")
    search_fields = ("user__username", "room__title")
    autocomplete_fields = ("user", "room")
    ordering = ("room", "-score", "completion_time_seconds", "completed_at")

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user", "room")

    def ranking(self, obj):
        better_entries = EscapeRoomLeaderboard.objects.filter(room=obj.room).filter(
            Q(score__gt=obj.score)
            | Q(score=obj.score, completion_time_seconds__lt=obj.completion_time_seconds)
            | Q(
                score=obj.score,
                completion_time_seconds=obj.completion_time_seconds,
                completed_at__lt=obj.completed_at,
            )
        )
        return better_entries.count() + 1

    ranking.short_description = "Rank"

