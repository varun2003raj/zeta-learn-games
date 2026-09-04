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
    id = serializers.CharField(read_only=True)

    class Meta:
        model = MemoryCard
        fields = [
            "id",
            "name",
            "category",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["id"] = str(instance.id)
        return data