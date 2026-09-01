from django.urls import path

from .views import (
    game_settings,
    memory_cards,
    save_best_score,
    memory_leaderboard,
)


urlpatterns = [

    path(
        "settings/",
        game_settings,
        name="memory-game-settings"
    ),

    path(
        "cards/",
        memory_cards,
        name="memory-cards"
    ),

    path(
        "score/",
        save_best_score,
        name="memory-save-score"
    ),

    path(
        "leaderboard/",
        memory_leaderboard,
        name="memory-leaderboard"
    ),

]