from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import (
    MemoryGameSetting,
    MemoryCard,
    MemoryBestScore,
)
from .serializers import (
    MemoryGameSettingSerializer,
    MemoryCardSerializer,
)


@api_view(["GET"])
def game_settings(request):
    settings = MemoryGameSetting.objects.filter(
        is_active=True
    ).order_by("grid_size")

    serializer = MemoryGameSettingSerializer(
        settings,
        many=True
    )

    return Response(
        serializer.data,
        status=status.HTTP_200_OK
    )


@api_view(["GET"])
def memory_cards(request):
    cards = MemoryCard.objects.filter(
        is_active=True
    ).order_by("id")

    serializer = MemoryCardSerializer(
        cards,
        many=True
    )

    return Response(
        serializer.data,
        status=status.HTTP_200_OK
    )


# =====================================================
# SAVE / UPDATE BEST SCORE
# =====================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_best_score(request):

    difficulty = request.data.get("difficulty")
    score = request.data.get("score")

    if difficulty not in ["EASY", "MEDIUM", "HARD", "EXPERT"]:
        return Response(
            {"error": "Invalid difficulty."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        score = int(score)
    except (TypeError, ValueError):
        return Response(
            {"error": "Invalid score."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if score < 0:
        return Response(
            {"error": "Score cannot be negative."},
            status=status.HTTP_400_BAD_REQUEST
        )

    best_score, created = MemoryBestScore.objects.get_or_create(
        user=request.user
    )

    field_map = {
        "EASY": "easy_best",
        "MEDIUM": "medium_best",
        "HARD": "hard_best",
        "EXPERT": "expert_best",
    }

    field_name = field_map[difficulty]

    current_best = getattr(best_score, field_name)

    # Only update if the new score is higher
    if score > current_best:
        setattr(best_score, field_name, score)

        best_score.total_best = (
            best_score.easy_best
            + best_score.medium_best
            + best_score.hard_best
            + best_score.expert_best
        )

        best_score.save()

    return Response(
        {
            "message": "Best score updated.",
            "difficulty": difficulty,
            "best_score": getattr(best_score, field_name),
            "total_best": best_score.total_best,
        },
        status=status.HTTP_200_OK
    )


# =====================================================
# LEADERBOARD
# =====================================================

@api_view(["GET"])
@permission_classes([AllowAny])
def memory_leaderboard(request):

    leaderboard = MemoryBestScore.objects.select_related(
        "user"
    ).order_by("-total_best", "user__username")

    data = []

    for rank, entry in enumerate(leaderboard, start=1):

        data.append(
            {
                "rank": rank,
                "username": entry.user.username,

                "easy": entry.easy_best,
                "medium": entry.medium_best,
                "hard": entry.hard_best,
                "expert": entry.expert_best,

                "total": entry.total_best,
            }
        )

    return Response(
        data,
        status=status.HTTP_200_OK
    )