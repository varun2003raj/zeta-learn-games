from datetime import timedelta

from django.db import IntegrityError, transaction
from django.db.models import Case, IntegerField, Prefetch, Value, When
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.crypto import constant_time_compare
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    EscapePuzzleAttempt,
    EscapeRoomLeaderboard,
    EscapeRoomProgress,
    Hint,
    Puzzle,
    Room,
)
from .serializers import (
    AdminRoomDetailSerializer,
    AdminRoomListSerializer,
    EscapeLeaderboardSerializer,
    EscapePuzzleAttemptSerializer,
    EscapeRoomProgressSerializer,
    HintManageSerializer,
    PuzzleSerializer,
    RequestEscapeHintInputSerializer,
    RoomDetailSerializer,
    RoomListSerializer,
    RoomWriteSerializer,
    StartEscapeRoomSerializer,
    SubmitEscapeAnswerInputSerializer,
)


def _normalize_answer(value):
    return (value or "").strip().casefold()


def _is_escape_admin(user):
    return bool(
        user
        and user.is_authenticated
        and (
            user.is_superuser
            or user.is_staff
            or getattr(user, "is_admin_user", False)
            or getattr(user, "role", None) == "admin"
        )
    )


def _get_previous_active_room(room):
    return Room.objects.filter(is_active=True, id__lt=room.id).order_by("-id").first()


def _get_next_active_room(room):
    return Room.objects.filter(is_active=True, id__gt=room.id).order_by("id").first()


class IsEscapeRoomAdmin(BasePermission):
    def has_permission(self, request, view):
        return _is_escape_admin(request.user)


def _expire_progress_if_needed(progress):
    if not progress.completed and not progress.failed and timezone.now() > progress.expires_at:
        progress.failed = True
        progress.save(update_fields=["failed"])
        return True
    return False


class RoomViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]

    def get_queryset(self):
        puzzle_queryset = Puzzle.objects.filter(is_active=True).prefetch_related("hints")
        return Room.objects.filter(is_active=True).prefetch_related(
            Prefetch("puzzles", queryset=puzzle_queryset)
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return RoomDetailSerializer
        return RoomListSerializer


class AdminRoomViewSet(viewsets.ModelViewSet):
    permission_classes = [IsEscapeRoomAdmin]

    def get_queryset(self):
        puzzle_queryset = Puzzle.objects.prefetch_related("hints")
        return Room.objects.all().prefetch_related(Prefetch("puzzles", queryset=puzzle_queryset))

    def get_serializer_class(self):
        if self.action == "list":
            return AdminRoomListSerializer
        if self.action == "retrieve":
            return AdminRoomDetailSerializer
        return RoomWriteSerializer


class AdminPuzzleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsEscapeRoomAdmin]
    serializer_class = PuzzleSerializer

    def get_queryset(self):
        queryset = Puzzle.objects.select_related("room").prefetch_related("hints")
        room_id = self.request.query_params.get("room_id")
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        return queryset.order_by("room_id", "order", "id")


class AdminHintViewSet(viewsets.ModelViewSet):
    permission_classes = [IsEscapeRoomAdmin]
    serializer_class = HintManageSerializer

    def get_queryset(self):
        queryset = Hint.objects.select_related("puzzle", "puzzle__room")
        puzzle_id = self.request.query_params.get("puzzle_id")
        if puzzle_id:
            queryset = queryset.filter(puzzle_id=puzzle_id)
        return queryset.order_by("puzzle_id", "id")


class StartEscapeRoomAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        input_serializer = StartEscapeRoomSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        room_key = input_serializer.validated_data.get("room_key", "")

        room = get_object_or_404(Room, id=input_serializer.validated_data["room_id"], is_active=True)
        first_puzzle = room.puzzles.filter(order=1, is_active=True).first()
        if not first_puzzle:
            return Response(
                {"detail": "Room cannot be started because puzzle order=1 is missing or inactive."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        previous_room = _get_previous_active_room(room)
        if previous_room:
            previous_progress = EscapeRoomProgress.objects.filter(
                user=request.user,
                room=previous_room,
                completed=True,
            ).first()
            if not previous_progress:
                return Response(
                    {
                        "detail": "Complete the previous room before entering this room.",
                        "required_previous_room_id": previous_room.id,
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        if room.unlock_key:
            if not room_key:
                return Response(
                    {
                        "detail": "room_key is required to enter this room.",
                        "required_room_id": room.id,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not constant_time_compare(
                _normalize_answer(room_key),
                _normalize_answer(room.unlock_key),
            ):
                return Response(
                    {
                        "detail": "Invalid room key.",
                        "required_room_id": room.id,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        now = timezone.now()
        expires_at = now + timedelta(minutes=room.time_limit_minutes)

        with transaction.atomic():
            progress = (
                EscapeRoomProgress.objects.select_for_update()
                .filter(user=request.user, room=room)
                .select_related("current_puzzle")
                .first()
            )

            if progress:
                if _expire_progress_if_needed(progress):
                    return Response(
                        {"detail": "Time limit exceeded. This attempt is marked as failed and cannot be restarted."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if progress.completed:
                    return Response(
                        {"detail": "You have already completed this room and cannot start again."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if progress.failed:
                    return Response(
                        {"detail": "You have already failed this room and cannot start again."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                return Response(
                    {"detail": "Room already started and still active for this user."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                progress = EscapeRoomProgress.objects.create(
                    user=request.user,
                    room=room,
                    expires_at=expires_at,
                    current_puzzle=first_puzzle,
                )
            except IntegrityError:
                return Response(
                    {"detail": "Room session already exists for this user."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(EscapeRoomProgressSerializer(progress).data, status=status.HTTP_201_CREATED)


class SubmitEscapeAnswerAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        input_serializer = SubmitEscapeAnswerInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        puzzle_id = input_serializer.validated_data["puzzle_id"]
        answer = input_serializer.validated_data["answer"]

        puzzle = get_object_or_404(
            Puzzle.objects.select_related("room"),
            id=puzzle_id,
            is_active=True,
            room__is_active=True,
        )

        with transaction.atomic():
            progress = (
                EscapeRoomProgress.objects.select_for_update()
                .filter(user=request.user, room=puzzle.room)
                .select_related("room", "current_puzzle")
                .first()
            )
            if not progress:
                return Response({"detail": "No active escape room session found."}, status=status.HTTP_404_NOT_FOUND)

            if progress.completed:
                return Response({"detail": "Room is already completed."}, status=status.HTTP_400_BAD_REQUEST)

            if progress.failed:
                return Response({"detail": "Room is already failed."}, status=status.HTTP_400_BAD_REQUEST)

            if _expire_progress_if_needed(progress):
                return Response(
                    {"detail": "Time limit exceeded. This room attempt is now failed."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not progress.current_puzzle_id:
                return Response(
                    {"detail": "Current puzzle is not set for this room session."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if progress.current_puzzle_id != puzzle.id:
                return Response(
                    {
                        "detail": "You must solve puzzles in order.",
                        "expected_puzzle_id": progress.current_puzzle_id,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            normalized_expected = _normalize_answer(puzzle.answer)
            normalized_received = _normalize_answer(answer)
            is_correct = constant_time_compare(normalized_received, normalized_expected)

            attempt = EscapePuzzleAttempt.objects.create(
                user=request.user,
                puzzle=puzzle,
                submitted_answer=answer,
                is_correct=is_correct,
            )

            if not is_correct:
                return Response(
                    {
                        "message": "Incorrect answer.",
                        "attempt": EscapePuzzleAttemptSerializer(attempt).data,
                        "progress": EscapeRoomProgressSerializer(progress).data,
                    },
                    status=status.HTTP_200_OK,
                )

            progress.total_score += puzzle.points
            next_puzzle = (
                Puzzle.objects.filter(room=puzzle.room, is_active=True, order__gt=puzzle.order).order_by("order").first()
            )

            if next_puzzle:
                progress.current_puzzle = next_puzzle
                progress.save(update_fields=["total_score", "current_puzzle"])
                return Response(
                    {
                        "message": "Correct answer.",
                        "attempt": EscapePuzzleAttemptSerializer(attempt).data,
                        "progress": EscapeRoomProgressSerializer(progress).data,
                    },
                    status=status.HTTP_200_OK,
                )

            completed_at = timezone.now()
            completion_time_seconds = max(0, int((completed_at - progress.started_at).total_seconds()))

            progress.completed = True
            progress.completed_at = completed_at
            progress.current_puzzle = None
            progress.save(update_fields=["total_score", "completed", "completed_at", "current_puzzle"])

            EscapeRoomLeaderboard.objects.update_or_create(
                user=request.user,
                room=progress.room,
                defaults={
                    "score": progress.total_score,
                    "completion_time_seconds": completion_time_seconds,
                    "completed_at": completed_at,
                },
            )

        next_room = _get_next_active_room(progress.room)

        return Response(
            {
                "message": "Correct answer. Room completed.",
                "attempt": EscapePuzzleAttemptSerializer(attempt).data,
                "progress": EscapeRoomProgressSerializer(progress).data,
                "next_room_id": next_room.id if next_room else None,
                "next_room_title": next_room.title if next_room else None,
                "next_room_key": next_room.unlock_key if next_room else "",
            },
            status=status.HTTP_200_OK,
        )


class RequestEscapeHintAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        input_serializer = RequestEscapeHintInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        puzzle_id = input_serializer.validated_data["puzzle_id"]
        hint_id = input_serializer.validated_data.get("hint_id")

        puzzle = get_object_or_404(
            Puzzle.objects.select_related("room"),
            id=puzzle_id,
            is_active=True,
            room__is_active=True,
        )

        with transaction.atomic():
            progress = (
                EscapeRoomProgress.objects.select_for_update()
                .filter(user=request.user, room=puzzle.room)
                .select_related("room", "current_puzzle")
                .first()
            )
            if not progress:
                return Response({"detail": "No active escape room session found."}, status=status.HTTP_404_NOT_FOUND)

            if progress.completed:
                return Response({"detail": "Room is already completed."}, status=status.HTTP_400_BAD_REQUEST)

            if progress.failed:
                return Response({"detail": "Room is already failed."}, status=status.HTTP_400_BAD_REQUEST)

            if _expire_progress_if_needed(progress):
                return Response(
                    {"detail": "Time limit exceeded. This room attempt is now failed."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if progress.current_puzzle_id != puzzle.id:
                return Response(
                    {"detail": "Hints can be requested only for the current puzzle."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            hints_queryset = Hint.objects.filter(puzzle=puzzle).order_by("id")
            hint = get_object_or_404(hints_queryset, id=hint_id) if hint_id else hints_queryset.first()
            if not hint:
                return Response({"detail": "No hints available for this puzzle."}, status=status.HTTP_404_NOT_FOUND)

            progress.total_score = max(0, progress.total_score - hint.penalty_points)
            progress.save(update_fields=["total_score"])

        return Response(
            {
                "hint_id": hint.id,
                "hint_text": hint.text,
                "penalty_points": hint.penalty_points,
                "total_score": progress.total_score,
            },
            status=status.HTTP_200_OK,
        )


class MyEscapeProgressAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        room_id = request.query_params.get("room_id")
        include_all = (request.query_params.get("all") or "").strip().lower() in {"1", "true", "yes"}

        queryset = EscapeRoomProgress.objects.filter(user=request.user).select_related("room", "current_puzzle")
        if room_id:
            queryset = queryset.filter(room_id=room_id)

        ordered_queryset = queryset.order_by("-started_at", "-id")
        if include_all:
            progress_rows = list(ordered_queryset)
            if not progress_rows:
                return Response([], status=status.HTTP_200_OK)
            for progress in progress_rows:
                _expire_progress_if_needed(progress)
            return Response(EscapeRoomProgressSerializer(progress_rows, many=True).data, status=status.HTTP_200_OK)

        progress = ordered_queryset.first()
        if not progress:
            return Response({"detail": "Progress not found."}, status=status.HTTP_404_NOT_FOUND)

        if _expire_progress_if_needed(progress):
            progress.refresh_from_db()

        return Response(EscapeRoomProgressSerializer(progress).data, status=status.HTTP_200_OK)


class MyEscapeAttemptsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        room_id = request.query_params.get("room_id")
        puzzle_id = request.query_params.get("puzzle_id")

        queryset = EscapePuzzleAttempt.objects.filter(user=request.user).select_related("puzzle", "puzzle__room")
        if room_id:
            queryset = queryset.filter(puzzle__room_id=room_id)
        if puzzle_id:
            queryset = queryset.filter(puzzle_id=puzzle_id)

        queryset = queryset.order_by("-submitted_at", "-id")
        return Response(EscapePuzzleAttemptSerializer(queryset, many=True).data, status=status.HTTP_200_OK)


class AdminEscapeProgressViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsEscapeRoomAdmin]
    serializer_class = EscapeRoomProgressSerializer

    def get_queryset(self):
        queryset = EscapeRoomProgress.objects.select_related("user", "room", "current_puzzle")
        room_id = self.request.query_params.get("room_id")
        user_id = self.request.query_params.get("user_id")
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        return queryset.order_by("-started_at", "-id")


class AdminEscapeAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsEscapeRoomAdmin]
    serializer_class = EscapePuzzleAttemptSerializer

    def get_queryset(self):
        queryset = EscapePuzzleAttempt.objects.select_related("user", "puzzle", "puzzle__room")
        room_id = self.request.query_params.get("room_id")
        user_id = self.request.query_params.get("user_id")
        puzzle_id = self.request.query_params.get("puzzle_id")
        if room_id:
            queryset = queryset.filter(puzzle__room_id=room_id)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if puzzle_id:
            queryset = queryset.filter(puzzle_id=puzzle_id)
        return queryset.order_by("-submitted_at", "-id")


class EscapeLeaderboardListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        room_id = request.query_params.get("room_id")

        leaderboard = EscapeRoomLeaderboard.objects.select_related("user", "room")
        if room_id:
            leaderboard = leaderboard.filter(room_id=room_id)

        leaderboard = leaderboard.annotate(
            completed_rank=Case(
                When(completed_at__isnull=False, then=Value(0)),
                default=Value(1),
                output_field=IntegerField(),
            )
        ).order_by("room_id", "completed_rank", "-score", "completion_time_seconds", "completed_at", "id")

        serialized = EscapeLeaderboardSerializer(leaderboard, many=True).data
        ranks_by_room = {}
        for row in serialized:
            room_key = row["room"]
            ranks_by_room[room_key] = ranks_by_room.get(room_key, 0) + 1
            row["rank"] = ranks_by_room[room_key]

        return Response(serialized, status=status.HTTP_200_OK)


class EscapeLeaderboardAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, room_id):
        room = get_object_or_404(Room, id=room_id)
        leaderboard = (
            EscapeRoomLeaderboard.objects.filter(room=room)
            .select_related("user", "room")
            .annotate(
                completed_rank=Case(
                    When(completed_at__isnull=False, then=Value(0)),
                    default=Value(1),
                    output_field=IntegerField(),
                )
            )
            .order_by("completed_rank", "-score", "completion_time_seconds", "completed_at", "id")
        )
        serialized = EscapeLeaderboardSerializer(leaderboard, many=True).data
        for index, row in enumerate(serialized, start=1):
            row["rank"] = index
        return Response(serialized, status=status.HTTP_200_OK)
