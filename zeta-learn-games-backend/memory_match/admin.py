from django.contrib import admin
from .models import MemoryCard, MemoryGameSetting, MemoryBestScore


@admin.register(MemoryCard)
class MemoryCardAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name",)


@admin.register(MemoryGameSetting)
class MemoryGameSettingAdmin(admin.ModelAdmin):
    list_display = (
        "difficulty",
        "grid_size",
        "time_limit_seconds",
        "points_per_pair",
        "wrong_move_penalty",
        "hint_penalty",
        "is_active",
    )
    list_filter = ("difficulty", "is_active")


@admin.register(MemoryBestScore)
class MemoryBestScoreAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "easy_best",
        "medium_best",
        "hard_best",
        "expert_best",
        "total_best",
        "updated_at",
    )
    search_fields = ("user__username",)
    ordering = ("-total_best",)