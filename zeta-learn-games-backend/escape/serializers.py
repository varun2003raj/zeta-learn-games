from rest_framework import serializers
from .models import (
    EscapeRoom,
    Puzzle,
    Hint,
    Progress,
    Attempt,
    EscapeGameAttempt,
)


class HintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hint
        fields = "__all__"


class PuzzleSerializer(serializers.ModelSerializer):
    hints = HintSerializer(many=True, read_only=True)

    class Meta:
        model = Puzzle
        fields = "__all__"
        extra_kwargs = {
            "challenge": {"required": False},
        }
        


class EscapeRoomSerializer(serializers.ModelSerializer):
    puzzles = PuzzleSerializer(many=True, read_only=True)
    levels_count = serializers.IntegerField(source="puzzles.count", read_only=True)

    class Meta:
        model = EscapeRoom
        fields = "__all__"


class ProgressSerializer(serializers.ModelSerializer):
    current_puzzle = PuzzleSerializer(read_only=True)

    class Meta:
        model = Progress
        fields = "__all__"


class AttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attempt
        fields = "__all__"


class EscapeGameAttemptSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(
        source="user.username",
        read_only=True,
    )
    room_title = serializers.CharField(
        source="room.title",
        read_only=True,
    )
    current_puzzle_title = serializers.CharField(
        source="current_puzzle.title",
        read_only=True,
    )
    current_puzzle_order = serializers.IntegerField(
        source="current_puzzle.order",
        read_only=True,
    )

    class Meta:
        model = EscapeGameAttempt
        fields = "__all__"