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
    id = serializers.CharField(read_only=True)
    puzzle = serializers.CharField(write_only=True)

    class Meta:
        model = Hint
        fields = "__all__"

    def create(self, validated_data):
        puzzle_id = validated_data.pop("puzzle")
        puzzle = Puzzle.objects.get(id=puzzle_id)

        return Hint.objects.create(
            puzzle=puzzle,
            **validated_data
        )

    def update(self, instance, validated_data):
        puzzle_id = validated_data.pop("puzzle", None)

        if puzzle_id is not None:
            puzzle = Puzzle.objects.get(id=puzzle_id)
            instance.puzzle = puzzle

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["id"] = str(instance.id)
        data["puzzle"] = str(instance.puzzle_id)
        return data


class PuzzleSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    room = serializers.PrimaryKeyRelatedField(
        queryset=EscapeRoom.objects.all()
    )

    hints = HintSerializer(many=True, read_only=True)

    class Meta:
        model = Puzzle
        fields = "__all__"
        extra_kwargs = {
            "challenge": {"required": False},
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)

        data["id"] = str(instance.id)
        data["room"] = str(instance.room_id)

        return data


class EscapeRoomSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    puzzles = PuzzleSerializer(
        many=True,
        read_only=True
    )

    levels_count = serializers.IntegerField(
        source="puzzles.count",
        read_only=True
    )

    def to_representation(self, instance):
        data = super().to_representation(instance)

        data["id"] = str(instance.id)

        return data

    class Meta:
        model = EscapeRoom
        fields = "__all__"


class ProgressSerializer(serializers.ModelSerializer):
    current_puzzle = PuzzleSerializer(read_only=True)

    class Meta:
        model = Progress
        fields = "__all__"


class AttemptSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    user = serializers.CharField(
        source="user_id",
        read_only=True
    )

    puzzle = serializers.CharField(
        source="puzzle_id",
        read_only=True
    )

    class Meta:
        model = Attempt
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)

        data["id"] = str(instance.id)
        data["user"] = str(instance.user_id)
        data["puzzle"] = str(instance.puzzle_id)

        return data


class EscapeGameAttemptSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    user = serializers.CharField(
        source="user_id",
        read_only=True
    )

    room = serializers.CharField(
        source="room_id",
        read_only=True
    )

    current_puzzle = serializers.CharField(
        source="current_puzzle_id",
        read_only=True,
        allow_null=True,
    )

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
        allow_null=True,
    )

    current_puzzle_order = serializers.IntegerField(
        source="current_puzzle.order",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = EscapeGameAttempt
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)

        data["id"] = str(instance.id)
        data["user"] = str(instance.user_id)
        data["room"] = str(instance.room_id)

        if instance.current_puzzle_id:
            data["current_puzzle"] = str(instance.current_puzzle_id)
        else:
            data["current_puzzle"] = None

        return data