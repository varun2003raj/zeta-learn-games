from django.utils import timezone
from rest_framework import serializers

from .models import (
    EscapePuzzleAttempt,
    EscapeRoomLeaderboard,
    EscapeRoomProgress,
    Hint,
    Puzzle,
    Room,
)


class HintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hint
        fields = ["id", "text", "penalty_points"]


class HintManageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hint
        fields = ["id", "puzzle", "text", "penalty_points"]


class PuzzleSerializer(serializers.ModelSerializer):
    hints = HintSerializer(many=True, read_only=True)
    answer = serializers.CharField(write_only=True)

    class Meta:
        model = Puzzle
        fields = [
            "id",
            "room",
            "title",
            "description",
            "answer",
            "order",
            "points",
            "is_active",
            "hints",
        ]


class RoomListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ["id", "title", "description", "difficulty", "time_limit_minutes", "is_active", "created_at"]


class RoomWriteSerializer(serializers.ModelSerializer):
    room_key = serializers.CharField(source="unlock_key", required=False, allow_blank=True)

    class Meta:
        model = Room
        fields = [
            "id",
            "title",
            "description",
            "difficulty",
            "time_limit_minutes",
            "room_key",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["created_at"]


class RoomDetailSerializer(serializers.ModelSerializer):
    puzzles = PuzzleSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = [
            "id",
            "title",
            "description",
            "difficulty",
            "time_limit_minutes",
            "is_active",
            "created_at",
            "puzzles",
        ]


class AdminRoomListSerializer(serializers.ModelSerializer):
    room_key = serializers.CharField(source="unlock_key", read_only=True)

    class Meta:
        model = Room
        fields = [
            "id",
            "title",
            "description",
            "difficulty",
            "time_limit_minutes",
            "room_key",
            "is_active",
            "created_at",
        ]


class AdminRoomDetailSerializer(serializers.ModelSerializer):
    room_key = serializers.CharField(source="unlock_key", read_only=True)
    puzzles = PuzzleSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = [
            "id",
            "title",
            "description",
            "difficulty",
            "time_limit_minutes",
            "room_key",
            "is_active",
            "created_at",
            "puzzles",
        ]


class EscapeRoomProgressSerializer(serializers.ModelSerializer):
    current_puzzle = PuzzleSerializer(read_only=True)
    remaining_time_seconds = serializers.SerializerMethodField()

    class Meta:
        model = EscapeRoomProgress
        fields = [
            "id",
            "room",
            "started_at",
            "expires_at",
            "remaining_time_seconds",
            "completed",
            "failed",
            "completed_at",
            "total_score",
            "current_puzzle",
        ]

    def get_remaining_time_seconds(self, obj):
        if obj.completed or obj.failed:
            return 0
        return max(0, int((obj.expires_at - timezone.now()).total_seconds()))


class EscapePuzzleAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = EscapePuzzleAttempt
        fields = ["id", "user", "puzzle", "submitted_answer", "is_correct", "submitted_at"]


class EscapeLeaderboardSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    completed = serializers.SerializerMethodField()

    class Meta:
        model = EscapeRoomLeaderboard
        fields = [
            "id",
            "user",
            "username",
            "room",
            "score",
            "completion_time_seconds",
            "completed_at",
            "completed",
        ]

    def get_completed(self, obj):
        return bool(obj.completed_at)


class StartEscapeRoomSerializer(serializers.Serializer):
    room_id = serializers.IntegerField(min_value=1)
    room_key = serializers.CharField(max_length=255, required=False, allow_blank=True, trim_whitespace=True)


class SubmitEscapeAnswerInputSerializer(serializers.Serializer):
    puzzle_id = serializers.IntegerField(min_value=1)
    answer = serializers.CharField(max_length=255, allow_blank=False, trim_whitespace=True)


class RequestEscapeHintInputSerializer(serializers.Serializer):
    puzzle_id = serializers.IntegerField(min_value=1)
    hint_id = serializers.IntegerField(min_value=1, required=False)
