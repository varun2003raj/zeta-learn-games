from rest_framework import serializers

from .models import (
    MemoryGameSetting,
    MemoryCard,
    MemoryBestScore,
)


class MemoryGameSettingSerializer(serializers.ModelSerializer):

    class Meta:
        model = MemoryGameSetting

        fields = [
            "difficulty",
            "grid_size",
            "time_limit_seconds",
            "points_per_pair",
            "wrong_move_penalty",
            "hint_penalty",
        ]


class MemoryCardSerializer(serializers.ModelSerializer):

    class Meta:
        model = MemoryCard

        fields = [
            "id",
            "name",
            "category",
        ]


class MemoryBestScoreSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    class Meta:
        model = MemoryBestScore

        fields = [
            "username",
            "easy_best",
            "medium_best",
            "hard_best",
            "expert_best",
            "total_best",
        ]