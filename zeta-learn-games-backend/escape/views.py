from urllib import request

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import (
    EscapeRoom,
    EscapeEventState,
    Puzzle,
    Hint,
    Progress,
    Attempt,
    EscapeGameAttempt,
)
from .serializers import (
    EscapeRoomSerializer,
    PuzzleSerializer,
    HintSerializer,
    ProgressSerializer,
    AttemptSerializer,
    EscapeGameAttemptSerializer,
)
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db import models


@api_view(["GET"])
def player_rooms(request):
    rooms = EscapeRoom.objects.filter(is_active=True)
    serializer = EscapeRoomSerializer(rooms, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def player_room_detail(request, room_id):
    try:
        room = EscapeRoom.objects.get(
            id=room_id,
            is_active=True,
        )
    except EscapeRoom.DoesNotExist:
        return Response(
            {"detail": "Room not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = EscapeRoomSerializer(room)
    return Response(serializer.data)


@api_view(["GET", "POST"])
def admin_rooms(request):

    if request.method == "GET":
        rooms = EscapeRoom.objects.all()
        serializer = EscapeRoomSerializer(rooms, many=True)
        return Response(serializer.data)

    serializer = EscapeRoomSerializer(data=request.data)

    if serializer.is_valid():
        room = serializer.save()
        return Response(
            EscapeRoomSerializer(room).data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET", "PATCH", "DELETE"])
def admin_room_detail(request, room_id):
    try:
        room = EscapeRoom.objects.get(id=room_id)
    except EscapeRoom.DoesNotExist:
        return Response(
            {"detail": "Escape room not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        serializer = EscapeRoomSerializer(room)
        return Response(serializer.data)

    if request.method == "PATCH":
        serializer = EscapeRoomSerializer(
            room,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    room.delete()

    return Response(
        {"detail": "Escape room deleted successfully."},
        status=status.HTTP_204_NO_CONTENT,
    )

@api_view(["POST"])
def start_escape(request):
    room_id = request.data.get("room_id")

    try:
        room = EscapeRoom.objects.get(
            id=room_id,
            is_active=True,
        )
    except EscapeRoom.DoesNotExist:
        return Response(
            {"detail": "Escape room not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    first_puzzle = (
        room.puzzles
        .filter(is_active=True)
        .order_by("order")
        .first()
    )

    if not first_puzzle:
        return Response(
            {"detail": "This escape room has no puzzles yet."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    now = timezone.now()

    # Check whether the player already has an active attempt.

    active_attempt = (
        EscapeGameAttempt.objects
        .filter(
            user=request.user,
            room=room,
            status="IN_PROGRESS",
        )
        .order_by("-attempt_number")
        .first()
    )

    # If an active attempt exists, continue it.
    # If an active attempt exists, check whether it has expired.
    if active_attempt:
        expires_at = active_attempt.started_at + timezone.timedelta(
            minutes=active_attempt.room.time_limit_minutes
        )

        if timezone.now() >= expires_at:
            active_attempt.status = "FAILED"
            active_attempt.completed_at = timezone.now()
            active_attempt.remaining_time_seconds = 0
            active_attempt.save()

            Progress.objects.filter(
                user=request.user,
                room=room,
            ).update(
                current_puzzle=None,
                remaining_time_seconds=0,
                failed=True,
                completed=False,
                completed_at=active_attempt.completed_at,
                expires_at=timezone.now(),
            )

            active_attempt = None
        else:
            return Response({
                "id": str(active_attempt.id),
                "room": str(room.id),
                "attempt_number": active_attempt.attempt_number,
                "current_puzzle": {
                    "id": str(active_attempt.current_puzzle.id),
                    "title": active_attempt.current_puzzle.title,
                    "description": active_attempt.current_puzzle.description,
                    "points": active_attempt.current_puzzle.points,
                    "order": active_attempt.current_puzzle.order,
                } if active_attempt.current_puzzle else None,
                "total_score": active_attempt.total_score,
                "remaining_time_seconds": active_attempt.remaining_time_seconds,
                "status": active_attempt.status,
                "started_at": active_attempt.started_at,
                "completed_at": active_attempt.completed_at,
                "expires_at": expires_at,
            })

    # No active attempt exists.
    # Create the next attempt number.
    last_attempt = (
        EscapeGameAttempt.objects
        .filter(
            user=request.user,
            room=room,
        )
        .order_by("-attempt_number")
        .first()
    )

    next_attempt_number = (
        (last_attempt.attempt_number + 1)
        if last_attempt
        else 1
    )

    while EscapeGameAttempt.objects.filter(
        user=request.user,
        room=room,
        attempt_number=next_attempt_number,
    ).exists():
        next_attempt_number += 1

    expires_at = now + timezone.timedelta(
        minutes=room.time_limit_minutes
    )

    attempt = EscapeGameAttempt.objects.create(
        user=request.user,
        room=room,
        attempt_number=next_attempt_number,
        current_puzzle=first_puzzle,
        total_score=0,
        remaining_time_seconds=room.time_limit_minutes * 60,
        status="IN_PROGRESS",
        started_at=now,
    )

    # Keep Progress synchronized with the current attempt.
    progress, _ = Progress.objects.get_or_create(
        user=request.user,
        room=room,
    )

    progress.current_puzzle = first_puzzle
    progress.total_score = 0
    progress.remaining_time_seconds = room.time_limit_minutes * 60
    progress.completed = False
    progress.failed = False
    progress.started_at = now
    progress.expires_at = expires_at
    progress.completed_at = None
    progress.hints_used = {}
    progress.save()

    return Response({
        "id": str(attempt.id),
        "room": str(room.id),
        "attempt_number": attempt.attempt_number,
        "current_puzzle": {
            "id": str(first_puzzle.id),
            "title": first_puzzle.title,
            "description": first_puzzle.description,
            "points": first_puzzle.points,
            "order": first_puzzle.order,
        },
        "total_score": attempt.total_score,
        "remaining_time_seconds": attempt.remaining_time_seconds,
        "status": attempt.status,
        "started_at": attempt.started_at,
        "completed_at": attempt.completed_at,
        "expires_at": expires_at,
    })


@api_view(["POST"])
def submit_answer(request):
    print("SUBMIT USER:", request.user, request.user.id)

    puzzle_id = request.data.get("puzzle_id")
    answer = str(request.data.get("answer", "")).strip()

    print("SUBMIT DATA:", request.data)
    print("SUBMIT PUZZLE ID:", puzzle_id)
    print("SUBMIT ANSWER:", answer)

    if not puzzle_id or not answer:
        return Response(
            {"detail": "Puzzle ID and answer are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        puzzle = Puzzle.objects.get(
            id=puzzle_id,
            is_active=True,
        )
    except Puzzle.DoesNotExist:
        return Response(
            {"detail": "Puzzle not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Get the current active game attempt
    attempt = (
        EscapeGameAttempt.objects
        .filter(
            user=request.user,
            room=puzzle.room,
            status="IN_PROGRESS",
        )
        .order_by("-attempt_number")
        .first()
    )

    if not attempt:
        return Response(
            {"detail": "No active escape room attempt."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check timeout
    elapsed_seconds = int(
        (timezone.now() - attempt.started_at).total_seconds()
    )

    remaining_seconds = max(
        0,
        (puzzle.room.time_limit_minutes * 60) - elapsed_seconds,
    )

    attempt.remaining_time_seconds = remaining_seconds

    if remaining_seconds <= 0:
        attempt.status = "FAILED"
        attempt.completed_at = timezone.now()
        attempt.save()

        # Keep old Progress synchronized
        Progress.objects.filter(
            user=request.user,
            room=puzzle.room,
        ).update(
            current_puzzle=None,
            remaining_time_seconds=0,
            failed=True,
            completed=False,
            completed_at=timezone.now(),
            expires_at=timezone.now(),
        )

        return Response(
            {"detail": "Time is over. The escape room has failed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Make sure submitted puzzle is the current puzzle
    if attempt.current_puzzle_id != puzzle.id:
        return Response(
            {
                "detail": "This is not the active puzzle.",
                "expected_puzzle_id": str(attempt.current_puzzle_id) if attempt.current_puzzle_id else None,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    is_correct = (
        answer.lower() == puzzle.answer.strip().lower()
    )

    # Record individual puzzle submission
    submission = Attempt.objects.create(
        user=request.user,
        puzzle=puzzle,
        submitted_answer=answer,
        is_correct=is_correct,
    )

    if not is_correct:
        attempt.save()

        return Response({
            "attempt": AttemptSerializer(submission).data,
            "total_score": attempt.total_score,
            "remaining_time_seconds": attempt.remaining_time_seconds,
            "status": attempt.status,
        })

    print("CORRECT ANSWER")
    print("PUZZLE:", puzzle.id, puzzle.title)
    print("PUZZLE POINTS:", puzzle.points)
    print("SCORE BEFORE:", attempt.total_score)

    # Correct answer -> add the CURRENT puzzle's points.
    attempt.total_score += puzzle.points

    print("SCORE AFTER:", attempt.total_score)

    # Find the next puzzle.
    next_puzzle = (
        puzzle.room.puzzles
        .filter(
            is_active=True,
            order__gt=puzzle.order,
        )
        .order_by("order")
        .first()
    )

    if next_puzzle:
        attempt.current_puzzle = next_puzzle
        attempt.save()

        # Sync Progress
        Progress.objects.filter(
            user=request.user,
            room=puzzle.room,
        ).update(
            current_puzzle=next_puzzle,
            total_score=attempt.total_score,
            remaining_time_seconds=attempt.remaining_time_seconds,
            completed=False,
            failed=False,
        )

        return Response({
            "attempt": AttemptSerializer(submission).data,
            "progress": {
                "total_score": attempt.total_score,
                "remaining_time_seconds": attempt.remaining_time_seconds,
                "current_puzzle": {
                    "id": str(next_puzzle.id),
                    "title": next_puzzle.title,
                    "description": next_puzzle.description,
                    "points": next_puzzle.points,
                    "order": next_puzzle.order,
                },
            },
            "attempt_number": attempt.attempt_number,
            "status": attempt.status,
        })

    # No next puzzle -> room completed
    attempt.current_puzzle = None
    attempt.status = "COMPLETED"
    attempt.completed_at = timezone.now()
    attempt.save()

    Progress.objects.filter(
        user=request.user,
        room=puzzle.room,
    ).update(
        current_puzzle=None,
        total_score=attempt.total_score,
        remaining_time_seconds=attempt.remaining_time_seconds,
        completed=True,
        failed=False,
        completed_at=attempt.completed_at,
    )

    # Calculate total possible points for this room
    room_total_points = (
        puzzle.room.puzzles
        .filter(is_active=True)
        .aggregate(total=models.Sum("points"))["total"] or 0
    )

    return Response({
        "attempt": AttemptSerializer(submission).data,
        "total_score": attempt.total_score,
        "room_total_points": room_total_points,
        "remaining_time_seconds": attempt.remaining_time_seconds,
        "status": attempt.status,
        "attempt_number": attempt.attempt_number,
        "completed": True,
    })


@api_view(["POST"])
def request_hint(request):
    puzzle_id = request.data.get("puzzle_id")

    print("HINT DATA:", request.data)
    print("HINT PUZZLE ID:", puzzle_id)

    if not puzzle_id:
        return Response(
            {"detail": "Puzzle ID is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        puzzle = Puzzle.objects.get(
            id=puzzle_id,
            is_active=True,
        )
    except Puzzle.DoesNotExist:
        return Response(
            {"detail": "Puzzle not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        progress = Progress.objects.get(
            user=request.user,
            room=puzzle.room,
        )
    except Progress.DoesNotExist:
        return Response(
            {"detail": "Enter the room first."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if progress.current_puzzle_id != puzzle.id:
        return Response(
            {"detail": "This is not the active puzzle."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    used_hints = progress.hints_used or {}
    used_count = int(used_hints.get(str(puzzle.id), 0))

    hints = list(puzzle.hints.order_by("id"))

    if used_count >= len(hints):
        return Response(
            {"detail": "No more hints available for this puzzle."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    hint = hints[used_count]

    used_hints[str(puzzle.id)] = used_count + 1
    progress.hints_used = used_hints

    if not hint:
        return Response(
            {"detail": "No hint is available for this puzzle."},
            status=status.HTTP_404_NOT_FOUND,
        )

    attempt = (
        EscapeGameAttempt.objects
        .filter(
            user=request.user,
            room=puzzle.room,
            status="IN_PROGRESS",
        )
        .order_by("-attempt_number")
        .first()
    )

    if not attempt:
        return Response(
            {"detail": "No active escape room attempt."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    attempt.total_score -= hint.penalty_points
    attempt.save()

    progress.total_score = attempt.total_score
    progress.save()

    return Response({
        "hint_id": str(hint.id),
        "hint_text": hint.text,
        "penalty_points": hint.penalty_points,
        "total_score": progress.total_score,
    })

@api_view(["GET"])
def player_progress(request):
    room_id = request.query_params.get("room_id")

    if room_id:
        try:
            attempt = (
                EscapeGameAttempt.objects
                .filter(
                    user=request.user,
                    room_id=room_id,
                )
                .order_by("-attempt_number")
                .first()
            )

            if not attempt:
                return Response(
                    {"detail": "Progress not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            return Response({
                "id": str(attempt.id),
                "room": str(attempt.room_id),
                "attempt_number": attempt.attempt_number,
                "current_puzzle": (
                    PuzzleSerializer(
                        attempt.current_puzzle
                    ).data
                    if attempt.current_puzzle
                    else None
                ),
                "total_score": attempt.total_score,
                "room_total_points": sum(
                    puzzle.points
                    for puzzle in attempt.room.puzzles.filter(
                        is_active=True
                    )
                ),
                "room_title": attempt.room.title,
                "remaining_time_seconds": attempt.remaining_time_seconds,
                "status": attempt.status,
                "completed": attempt.status == "COMPLETED",
                "failed": attempt.status == "FAILED",
                "started_at": attempt.started_at,
                "completed_at": attempt.completed_at,
                "expires_at": (
                    attempt.started_at
                    + timezone.timedelta(
                        minutes=attempt.room.time_limit_minutes
                    )
                    if attempt.started_at
                    else None
                ),
            })

        except Exception as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # Return the best completed score for every room
    room_overview = []

    progress_rows = Progress.objects.filter(
        user=request.user
    ).order_by("-started_at")

    for progress in progress_rows:
        room = progress.room

        total_room_points = sum(
            puzzle.points
            for puzzle in room.puzzles.filter(is_active=True)
        )

        best_attempt = (
            EscapeGameAttempt.objects
            .filter(
                user=request.user,
                room=room,
                status="COMPLETED",
            )
            .order_by("-total_score")
            .first()
        )

        room_score = (
            best_attempt.total_score
            if best_attempt
            else 0
        )

        print(
            "FINAL ROOM SCORE:",
            room.id,
            room.title,
            room_score
        )

        room_overview.append({
            "room_id": str(room.id),
            "room_title": room.title,
            "score": room_score,
            "total_score": room_score,
            "total_points": total_room_points,
            "attempt_number": (
                best_attempt.attempt_number
                if best_attempt
                else 0
            ),
            "completed": bool(best_attempt),
            "failed": False,
        })

    return Response(room_overview)


@api_view(["GET"])
def admin_escape_state(request):
    state = EscapeEventState.objects.first()

    if not state:
        state = EscapeEventState.objects.create()

    return Response({
        "status": state.status.lower(),
        "started_at": state.started_at,
        "finished_at": state.finished_at,
        "updated_at": state.updated_at,
    })


@api_view(["POST"])
def admin_escape_start(request):
    state = EscapeEventState.objects.first()

    if not state:
        state = EscapeEventState.objects.create()

    state.status = "STARTED"
    state.started_at = timezone.now()
    state.finished_at = None
    state.save()

    return Response({
        "status": "started",
        "started_at": state.started_at,
        "finished_at": state.finished_at,
        "updated_at": state.updated_at,
    })


@api_view(["POST"])
def admin_escape_finish(request):
    state = EscapeEventState.objects.first()

    if not state:
        state = EscapeEventState.objects.create()

    state.status = "FINISHED"
    state.finished_at = timezone.now()
    state.save()

    return Response({
        "status": "finished",
        "started_at": state.started_at,
        "finished_at": state.finished_at,
        "updated_at": state.updated_at,
    })


@api_view(["POST"])
def admin_escape_reset(request):
    state = EscapeEventState.objects.first()

    if not state:
        state = EscapeEventState.objects.create()
    else:
        state.status = "DRAFT"
        state.started_at = None
        state.finished_at = None
        state.save()

    Progress.objects.all().update(
        current_puzzle=None,
        total_score=0,
        remaining_time_seconds=0,
        completed=False,
        failed=False,
        started_at=None,
        completed_at=None,
        expires_at=None,
        hints_used={},
    )

    EscapeGameAttempt.objects.all().delete()
    Attempt.objects.all().delete()

    return Response({
        "status": "draft",
        "started_at": None,
        "finished_at": None,
        "updated_at": state.updated_at,
    })


@api_view(["GET", "POST"])
def admin_puzzles(request):
    room_id = request.query_params.get("room_id")

    if request.method == "GET":
        puzzles = Puzzle.objects.all()

        if room_id:
            puzzles = puzzles.filter(room_id=room_id)

        serializer = PuzzleSerializer(puzzles, many=True)

        return Response({
            "results": serializer.data,
            "count": puzzles.count(),
            "next": None,
            "previous": None,
        })

    print("PUZZLE REQUEST DATA:", request.data)
    serializer = PuzzleSerializer(data=request.data)

    if serializer.is_valid():
        puzzle = serializer.save()
        return Response(
            PuzzleSerializer(puzzle).data,
            status=status.HTTP_201_CREATED,
        )

    print("PUZZLE VALIDATION ERROR:", serializer.errors)

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET", "PATCH", "DELETE"])
def admin_puzzle_detail(request, puzzle_id):
    try:
        puzzle = Puzzle.objects.get(id=puzzle_id)
    except Puzzle.DoesNotExist:
        return Response(
            {"detail": "Puzzle not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        return Response(PuzzleSerializer(puzzle).data)

    if request.method == "PATCH":
        serializer = PuzzleSerializer(
            puzzle,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    puzzle.delete()

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET", "POST"])
def admin_hints(request):
    puzzle_id = request.query_params.get("puzzle_id")

    if request.method == "GET":
        hints = Hint.objects.all()

        if puzzle_id:
            hints = hints.filter(puzzle_id=puzzle_id)

        serializer = HintSerializer(hints, many=True)

        return Response({
            "results": serializer.data,
            "count": hints.count(),
            "next": None,
            "previous": None,
        })

    serializer = HintSerializer(data=request.data)

    if serializer.is_valid():
        hint = serializer.save()
        return Response(
            HintSerializer(hint).data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET", "PATCH", "DELETE"])
def admin_hint_detail(request, hint_id):
    try:
        hint = Hint.objects.get(id=hint_id)
    except Hint.DoesNotExist:
        return Response(
            {"detail": "Hint not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        return Response(HintSerializer(hint).data)

    if request.method == "PATCH":
        serializer = HintSerializer(
            hint,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    hint.delete()

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def admin_escape_progress(request):
    progress = Progress.objects.select_related(
        "user",
        "room",
        "current_puzzle",
    ).all().order_by("-started_at")

    room_id = request.query_params.get("room_id")
    user_id = request.query_params.get("user_id")
    status_filter = request.query_params.get("status")

    if room_id:
        progress = progress.filter(room_id=room_id)

    if user_id:
        progress = progress.filter(user_id=user_id)

    if status_filter == "completed":
        progress = progress.filter(completed=True)
    elif status_filter == "failed":
        progress = progress.filter(failed=True)
    elif status_filter == "in_progress":
        progress = progress.filter(
            completed=False,
            failed=False,
        )

    data = []

    for item in progress:
        data.append({
            "id": str(item.id),
            "user_id": str(item.user.id),
            "escape_room": {
                "id": str(item.room.id),
                "title": item.room.title,
            },
            "current_puzzle": (
                item.current_puzzle.title
                if item.current_puzzle
                else None
            ),
            "score": item.total_score,
            "total_score": item.total_score,
            "status": (
                "completed"
                if item.completed
                else "failed"
                if item.failed
                else "in_progress"
            ),
            "remaining_time_seconds": item.remaining_time_seconds,
            "started_at": item.started_at,
            "completed_at": item.completed_at,
        })

    return Response(data)


@api_view(["GET"])
def admin_escape_attempts(request):
    attempts = (
        EscapeGameAttempt.objects
        .select_related(
            "user",
            "room",
            "current_puzzle",
        )
        .all()
        .order_by("-started_at")
    )

    serializer = EscapeGameAttemptSerializer(
        attempts,
        many=True,
    )

    return Response(serializer.data)

@api_view(["GET"])
def admin_escape_submissions(request):
    submissions = (
        Attempt.objects
        .select_related(
            "user",
            "puzzle",
            "puzzle__room",
        )
        .all()
        .order_by("-submitted_at")
    )

    room_id = request.query_params.get("room_id")
    user_id = request.query_params.get("user_id")
    puzzle_id = request.query_params.get("puzzle_id")

    if room_id:
        submissions = submissions.filter(
            puzzle__room_id=room_id
        )

    if user_id:
        submissions = submissions.filter(
            user_id=user_id
        )

    if puzzle_id:
        submissions = submissions.filter(
            puzzle_id=puzzle_id
        )

    data = []

    for submission in submissions:
        data.append({
            "id": str(submission.id),
            "user": str(submission.user.id),
            "user_name": (
                submission.user.username
                or submission.user.email
            ),
            "escape_room": submission.puzzle.room.title,
            "escape_room_id": str(submission.puzzle.room.id),
            "puzzle": str(submission.puzzle.id),
            "puzzle_id": str(submission.puzzle.id),
            "puzzle_title": submission.puzzle.title,
            "submitted_answer": submission.submitted_answer,
            "is_correct": submission.is_correct,
            "submitted_at": submission.submitted_at,
        })

    return Response({
        "results": data,
        "count": len(data),
        "next": None,
        "previous": None,
    })