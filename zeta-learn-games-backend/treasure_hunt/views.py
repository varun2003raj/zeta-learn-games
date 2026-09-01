from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import TreasureHuntProgress


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_progress(request):
    progress, _ = TreasureHuntProgress.objects.get_or_create(
        user=request.user
    )

    return Response({
        "total_score": progress.total_score,
        "best_score": progress.best_score,
        "completed_levels": progress.completed_levels,
        "best_scores": progress.best_scores,
        "total_attempts": progress.total_attempts,
        "total_hints_used": progress.total_hints_used,
        "highest_unlocked_level": progress.highest_unlocked_level,
        "last_played_level": progress.last_played_level,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_level(request):
    level = request.data.get("level")
    score = request.data.get("score")
    attempts = request.data.get("attempts", 1)
    hints_used = request.data.get("hints_used", 0)

    if level is None or score is None:
        return Response(
            {"error": "Level and score are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        level = int(level)
        score = int(score)
        attempts = int(attempts)
        hints_used = int(hints_used)
    except (TypeError, ValueError):
        return Response(
            {
                "error": "Level, score, attempts and hints must be numbers."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if level < 1 or level > 250:
        return Response(
            {"error": "Invalid level."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    progress, _ = TreasureHuntProgress.objects.get_or_create(
        user=request.user
    )

    # Normalize existing best scores
    best_scores = {
        str(key): int(value)
        for key, value in (progress.best_scores or {}).items()
    }

    # Get previous best score for this level
    old_score = best_scores.get(str(level), 0)

    # Keep only the highest score for this level
    if score > old_score:
        best_scores[str(level)] = score

    # Normalize completed levels
    completed_levels = [
        int(item)
        for item in (progress.completed_levels or [])
    ]

    # Add level if not already completed
    if level not in completed_levels:
        completed_levels.append(level)

    completed_levels = sorted(set(completed_levels))

    # Update current run
    progress.best_scores = best_scores
    progress.completed_levels = completed_levels

    # Current score = sum of best scores for completed levels
    progress.total_score = sum(best_scores.values())

    # Overall highest score
    progress.best_score = max(
        progress.best_score,
        progress.total_score,
    )

    progress.total_attempts += max(0, attempts)
    progress.total_hints_used += max(0, hints_used)

    progress.highest_unlocked_level = min(
        250,
        max(
            progress.highest_unlocked_level,
            level + 1,
        ),
    )

    progress.last_played_level = level

    progress.save()

    return Response({
        "message": "Level progress saved.",
        "total_score": progress.total_score,
        "best_score": progress.best_score,
        "completed_levels": progress.completed_levels,
        "best_scores": progress.best_scores,
        "highest_unlocked_level": progress.highest_unlocked_level,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def restart_voyage(request):
    progress, _ = TreasureHuntProgress.objects.get_or_create(
        user=request.user
    )

    # Reset current run
    progress.total_score = 0
    progress.completed_levels = []
    progress.best_scores = {}
    progress.total_attempts = 0
    progress.total_hints_used = 0
    progress.highest_unlocked_level = 1
    progress.last_played_level = 1

    # Keep best_score unchanged
    progress.save()

    return Response({
        "message": "Voyage restarted.",
        "total_score": progress.total_score,
        "best_score": progress.best_score,
        "completed_levels": progress.completed_levels,
        "highest_unlocked_level": progress.highest_unlocked_level,
        "last_played_level": progress.last_played_level,
    })