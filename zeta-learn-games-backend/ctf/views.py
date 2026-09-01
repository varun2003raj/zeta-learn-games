from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


from .models import (
    CTFChallenge,
    CTFCategory,
    CTFTeam,
    CTFScoreHistory,
    CTFAnnouncement,
    CTFLifecycle,
    CTFHistory,
    CTFHintUsage,
)

from rest_framework.parsers import MultiPartParser, FormParser


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def admin_challenges(request):

    if request.method == "GET":
        challenges = CTFChallenge.objects.all().order_by("id")

        data = []

        for challenge in challenges:
            data.append({
                "id": challenge.id,
                "title": challenge.title,
                "description": challenge.description,
                "points": challenge.points,
                "flag": challenge.flag,
                "category": challenge.category.id,
                "category_name": challenge.category.name,
                "difficulty": challenge.difficulty,
                "hint_1": challenge.hint_1,
                "hint_2": challenge.hint_2,
                "hint_1_visible": challenge.hint_1_visible,
                "hint_2_visible": challenge.hint_2_visible,
                "is_active": challenge.is_active,
                "file_url": (
                    request.build_absolute_uri(challenge.file.url)
                    if challenge.file
                    else None
                ),
            })

        return Response(data)

    title = str(request.data.get("title", "")).strip()
    description = str(request.data.get("description", "")).strip()
    flag = str(request.data.get("flag", "")).strip()
    category_id = request.data.get("category")
    difficulty = str(request.data.get("difficulty", "easy"))
    points = request.data.get("points", 0)

    if not title or not description or not flag or not category_id:
        return Response(
            {"error": "Title, description, flag and category are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        category = CTFCategory.objects.get(id=category_id)
    except CTFCategory.DoesNotExist:
        return Response(
            {"error": "Category not found."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    challenge = CTFChallenge.objects.create(
        title=title,
        description=description,
        points=points,
        flag=flag,
        category=category,
        difficulty=difficulty,
        hint_1=request.data.get("hint_1", ""),
        hint_2=request.data.get("hint_2", ""),
        hint_1_visible=str(
            request.data.get("hint_1_visible", "false")
        ).lower() == "true",
        hint_2_visible=str(
            request.data.get("hint_2_visible", "false")
        ).lower() == "true",
        is_active=str(
            request.data.get("is_active", "true")
        ).lower() == "true",
    )

    print("FILES:", request.FILES)
    print("FILE:", request.FILES.get("file"))

    if request.FILES.get("file"):
        challenge.file = request.FILES["file"]
        challenge.save()

    return Response(
        {
            "id": challenge.id,
            "title": challenge.title,
            "message": "Challenge created successfully.",
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def update_delete_challenge(request, challenge_id):

    try:
        challenge = CTFChallenge.objects.get(id=challenge_id)
    except CTFChallenge.DoesNotExist:
        return Response(
            {"error": "Challenge not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # DELETE
    if request.method == "DELETE":
        challenge.delete()

        return Response({
            "message": "Challenge deleted successfully."
        })

    # PATCH - UPDATE
    # Supports partial updates from the frontend.

    if "title" in request.data:
        challenge.title = str(request.data.get("title", "")).strip()

    if "description" in request.data:
        challenge.description = str(
            request.data.get("description", "")
        ).strip()

    if "flag" in request.data:
        challenge.flag = str(
            request.data.get("flag", "")
        ).strip()

    if "category" in request.data:
        category_id = request.data.get("category")

        try:
            category = CTFCategory.objects.get(id=category_id)
        except CTFCategory.DoesNotExist:
            return Response(
                {"error": "Category not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        challenge.category = category

    if "difficulty" in request.data:
        challenge.difficulty = str(
            request.data.get("difficulty")
        )

    if "points" in request.data:
        challenge.points = request.data.get("points")

    if "hint_1" in request.data:
        challenge.hint_1 = request.data.get("hint_1", "")

    if "hint_2" in request.data:
        challenge.hint_2 = request.data.get("hint_2", "")

    if "hint_1_visible" in request.data:
        challenge.hint_1_visible = str(
            request.data.get("hint_1_visible")
        ).lower() == "true"

    if "hint_2_visible" in request.data:
        challenge.hint_2_visible = str(
            request.data.get("hint_2_visible")
        ).lower() == "true"

    if "is_active" in request.data:
        challenge.is_active = str(
            request.data.get("is_active")
        ).lower() == "true"

    uploaded_file = request.FILES.get("file")

    if uploaded_file:
        challenge.file = uploaded_file

    challenge.save()

    return Response({
        "id": challenge.id,
        "title": challenge.title,
        "message": "Challenge updated successfully.",
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_challenges(request):
    challenges = CTFChallenge.objects.filter(
        is_active=True
    ).order_by("id")

    data = []

    for challenge in challenges:
        data.append({
            "id": challenge.id,
            "title": challenge.title,
            "description": challenge.description,
            "category_name": challenge.category.name,
            "difficulty": challenge.difficulty,
            "points": challenge.points,
            "is_completed": challenge.solved_by.filter(
                id=request.user.id
            ).exists(),
            "file_url": (
                request.build_absolute_uri(challenge.file.url)
                if challenge.file
                else None
            ),
        })

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_challenge_detail(request, challenge_id):
    try:
        challenge = CTFChallenge.objects.get(
            id=challenge_id,
            is_active=True,
        )
    except CTFChallenge.DoesNotExist:
        return Response(
            {"error": "Challenge not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    is_completed = challenge.solved_by.filter(
        id=request.user.id
    ).exists()

    visible_hints = []

    if challenge.hint_1_visible and challenge.hint_1:
        visible_hints.append(challenge.hint_1)

    if challenge.hint_2_visible and challenge.hint_2:
        visible_hints.append(challenge.hint_2)

    return Response({
        "id": challenge.id,
        "title": challenge.title,
        "description": challenge.description,
        "category_name": challenge.category.name,
        "difficulty": challenge.difficulty,
        "points": challenge.points,
        "is_completed": is_completed,
        "file_url": (
            request.build_absolute_uri(challenge.file.url)
            if challenge.file
            else None
        ),
        "hint_1_visible": challenge.hint_1_visible,
        "hint_2_visible": challenge.hint_2_visible,
        "visible_hints": visible_hints,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_team(request):
    name = str(request.data.get("name", "")).strip()

    if not name:
        return Response(
            {"error": "Team name is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # One user can belong to only one team
    existing_team = CTFTeam.objects.filter(
        members=request.user
    ).first()

    if existing_team:
        return Response(
            {"error": "You are already in a team."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Generate a unique team code
    import secrets

    while True:
        code = secrets.token_hex(4).upper()
        if not CTFTeam.objects.filter(code=code).exists():
            break

    try:
        team = CTFTeam.objects.create(
            name=name,
            code=code,
            leader=request.user,
        )
    except Exception:
        return Response(
            {"error": "Team name already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    team.members.add(request.user)

    return Response(
        {
            "message": "Team created successfully.",
            "team": {
                "id": team.id,
                "name": team.name,
                "code": team.code,
                "leader_name": team.leader.username,
                "score": team.score,
            },
        },
        status=status.HTTP_201_CREATED,
    )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def join_team(request):
    code = str(request.data.get("code", "")).strip().upper()

    if not code:
        return Response(
            {"error": "Team code is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # User can belong to only one team
    existing_team = CTFTeam.objects.filter(
        members=request.user
    ).first()

    if existing_team:
        return Response(
            {"error": "You are already in a team."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        team = CTFTeam.objects.get(code=code)
    except CTFTeam.DoesNotExist:
        return Response(
            {"error": "Invalid team code."},
            status=status.HTTP_404_NOT_FOUND,
        )

    team.members.add(request.user)

    return Response({
        "message": "Joined team successfully.",
        "team": {
            "id": team.id,
            "name": team.name,
            "code": team.code,
            "leader_name": team.leader.username,
            "score": team.score,
        },
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_my_team(request):
    team = CTFTeam.objects.filter(
        members=request.user
    ).first()

    if not team:
        return Response(
            {"error": "You are not in a team."},
            status=status.HTTP_404_NOT_FOUND,
        )

    members = team.members.all().order_by("id")

    member_data = []

    for member in members:
        member_data.append({
            "id": member.id,
            "username": member.username,
            "joined_at": team.created_at.strftime("%Y-%m-%d"),
        })

    contributions = []

    for member in members:
        solved_challenges = CTFChallenge.objects.filter(
            solved_by=member
        )

        total_points = sum(
            challenge.points
            for challenge in solved_challenges
        )

        contributions.append({
            "user_id": member.id,
            "username": member.username,
            "solved_count": solved_challenges.count(),
            "total_points": total_points,
        })

    return Response({
        "team": {
            "id": team.id,
            "name": team.name,
            "code": team.code,
            "leader_name": team.leader.username,
            "score": team.score,
        },
        "members": member_data,
        "member_contributions": contributions,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def leave_team(request):
    team = CTFTeam.objects.filter(
        members=request.user
    ).first()

    if not team:
        return Response(
            {"error": "You are not in a team."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if team.leader_id == request.user.id:
        return Response(
            {"error": "Team leader cannot leave the team. Delete the team instead."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    team.members.remove(request.user)

    return Response({
        "message": "You left the team successfully."
    })


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_team(request):
    team = CTFTeam.objects.filter(
        members=request.user
    ).first()

    if not team:
        return Response(
            {"error": "You are not in a team."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if team.leader_id != request.user.id:
        return Response(
            {"error": "Only the team leader can delete the team."},
            status=status.HTTP_403_FORBIDDEN,
        )

    team.delete()

    return Response({
        "message": "Team deleted successfully."
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_teams(request):
    teams = CTFTeam.objects.all().order_by("-score", "created_at")

    data = []

    for team in teams:
        members = team.members.all().order_by("id")

        contributions = []

        for member in members:
            solved_challenges = CTFChallenge.objects.filter(
                solved_by=member
            )

            total_points = sum(
                challenge.points
                for challenge in solved_challenges
            )

            contributions.append({
                "user_id": member.id,
                "username": member.username,
                "solved_count": solved_challenges.count(),
                "total_points": total_points,
            })

        data.append({
            "team": {
                "id": team.id,
                "name": team.name,
                "code": team.code,
                "leader_name": team.leader.username,
                "score": team.score,
            },
            "member_contributions": contributions,
        })

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_leaderboard(request):
    teams = CTFTeam.objects.all().order_by("-score", "created_at")

    leaderboard = []

    for rank, team in enumerate(teams, start=1):
        leaderboard.append({
            "rank": rank,
            "team_name": team.name,
            "leader": team.leader.username,
            "score": team.score,
        })

    return Response(leaderboard)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_leaderboard_timeline(request):
    teams = CTFTeam.objects.all().order_by("id")

    lifecycle = CTFLifecycle.objects.first()

    series = []

    team_colors = [
        "#60a5fa",
        "#f87171",
        "#4ade80",
        "#facc15",
        "#c084fc",
        "#fb923c",
        "#2dd4bf",
        "#f472b6",
    ]

    for index, team in enumerate(teams):
        history = team.score_history.all().order_by("created_at")

        points = []

        if lifecycle and lifecycle.started_at:
            points.append({
                "time": lifecycle.started_at.isoformat(),
                "score": 0,
            })

        for entry in history:
            points.append({
                "time": entry.created_at.isoformat(),
                "score": entry.score,
            })

        series.append({
            "team_name": team.name,
            "color": team_colors[index % len(team_colors)],
            "points": points,
        })

    all_history = CTFScoreHistory.objects.all().order_by("created_at")

    if lifecycle and lifecycle.started_at:
        time_start = lifecycle.started_at.isoformat()

        if all_history.exists():
            time_end = all_history.last().created_at.isoformat()

            if time_end == time_start:
                time_end = (
                    lifecycle.started_at
                    + timezone.timedelta(minutes=1)
                ).isoformat()
        else:
            time_end = (
                lifecycle.started_at
                + timezone.timedelta(minutes=1)
            ).isoformat()
    else:
        time_start = None
        time_end = None

    max_score = max(
        [team.score for team in teams],
        default=0,
    )

    return Response({
        "series": series,
        "time_start": time_start,
        "time_end": time_end,
        "max_score": max_score,
    })


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def announcements(request):
    if request.method == "GET":
        announcements = CTFAnnouncement.objects.all().order_by("-created_at")

        data = []

        for announcement in announcements:
            data.append({
                "id": announcement.id,
                "title": announcement.title,
                "message": announcement.message,
                "created_at": announcement.created_at,
                "updated_at": announcement.updated_at,
            })

        return Response(data)

    title = str(request.data.get("title", "")).strip()
    message = str(request.data.get("message", "")).strip()

    if not title or not message:
        return Response(
            {"error": "Title and message are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    announcement = CTFAnnouncement.objects.create(
        title=title,
        message=message,
    )

    return Response(
        {
            "id": announcement.id,
            "title": announcement.title,
            "message": announcement.message,
            "created_at": announcement.created_at,
            "updated_at": announcement.updated_at,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def update_announcement(request, announcement_id):
    try:
        announcement = CTFAnnouncement.objects.get(
            id=announcement_id
        )
    except CTFAnnouncement.DoesNotExist:
        return Response(
            {"error": "Announcement not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "DELETE":
        announcement.delete()
        return Response({
            "message": "Announcement deleted successfully."
        })

    title = str(request.data.get("title", "")).strip()
    message = str(request.data.get("message", "")).strip()

    if not title or not message:
        return Response(
            {"error": "Title and message are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    announcement.title = title
    announcement.message = message
    announcement.save()

    return Response({
        "id": announcement.id,
        "title": announcement.title,
        "message": announcement.message,
        "created_at": announcement.created_at,
        "updated_at": announcement.updated_at,
    })


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_announcement(request, announcement_id):
    try:
        announcement = CTFAnnouncement.objects.get(
            id=announcement_id
        )
    except CTFAnnouncement.DoesNotExist:
        return Response(
            {"error": "Announcement not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    announcement.delete()

    return Response({
        "message": "Announcement deleted successfully."
    })


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def categories(request):
    if request.method == "GET":
        categories = CTFCategory.objects.all().order_by("name")

        data = []

        for category in categories:
            data.append({
                "id": category.id,
                "name": category.name,
            })

        return Response(data)

    name = str(request.data.get("name", "")).strip()

    if not name:
        return Response(
            {"error": "Category name is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if CTFCategory.objects.filter(name__iexact=name).exists():
        return Response(
            {"error": "Category already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    category = CTFCategory.objects.create(name=name)

    return Response(
        {
            "id": category.id,
            "name": category.name,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def update_category(request, category_id):
    try:
        category = CTFCategory.objects.get(id=category_id)
    except CTFCategory.DoesNotExist:
        return Response(
            {"error": "Category not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "DELETE":
        if category.challenges.exists():
            return Response(
                {
                    "error": "Cannot delete a category that has challenges."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        category.delete()

        return Response({
            "message": "Category deleted successfully."
        })

    # PUT - update category
    name = str(request.data.get("name", "")).strip()

    if not name:
        return Response(
            {"error": "Category name is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if CTFCategory.objects.filter(
        name__iexact=name
    ).exclude(id=category.id).exists():
        return Response(
            {"error": "Category already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    category.name = name
    category.save()

    return Response({
        "id": category.id,
        "name": category.name,
    })


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_category(request, category_id):
    try:
        category = CTFCategory.objects.get(id=category_id)
    except CTFCategory.DoesNotExist:
        return Response(
            {"error": "Category not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if category.challenges.exists():
        return Response(
            {
                "error": "Cannot delete a category that has challenges."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    category.delete()

    return Response({
        "message": "Category deleted successfully."
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ctf_state(request):
    lifecycle = CTFLifecycle.objects.first()

    if not lifecycle:
        lifecycle = CTFLifecycle.objects.create(
            status="not_started"
        )

    return Response({
        "status": lifecycle.status,
        "started_at": lifecycle.started_at,
        "finished_at": lifecycle.finished_at,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_ctf(request):
    lifecycle = CTFLifecycle.objects.first()

    if not lifecycle:
        lifecycle = CTFLifecycle.objects.create()

    lifecycle.status = "running"
    lifecycle.started_at = timezone.now()
    lifecycle.finished_at = None
    lifecycle.save()

    return Response({
        "message": "CTF started successfully.",
        "status": lifecycle.status,
        "started_at": lifecycle.started_at,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def finish_ctf(request):
    lifecycle = CTFLifecycle.objects.first()

    if not lifecycle:
        lifecycle = CTFLifecycle.objects.create()

    lifecycle.status = "finished"
    lifecycle.finished_at = timezone.now()
    lifecycle.save()

    return Response({
        "message": "CTF finished successfully.",
        "status": lifecycle.status,
        "finished_at": lifecycle.finished_at,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reset_ctf(request):
    lifecycle = CTFLifecycle.objects.first()

    if not lifecycle:
        lifecycle = CTFLifecycle.objects.create()

    history_name = str(
        request.data.get("history_name", "")
    ).strip()

    if not history_name:
        return Response(
            {"error": "History name is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # -----------------------------
    # CREATE SNAPSHOT BEFORE RESET
    # -----------------------------

    teams = CTFTeam.objects.all().order_by("-score", "created_at")

    team_data = []
    scoreboard = []

    for index, team in enumerate(teams, start=1):
        members = team.members.all().order_by("id")

        member_data = []

        for member in members:
            solved_challenges = CTFChallenge.objects.filter(
                solved_by=member
            )

            individual_score = sum(
                challenge.points
                for challenge in solved_challenges
            )

            member_data.append({
                "id": member.id,
                "username": member.username,
                "individual_score": individual_score,
            })

        team_data.append({
            "id": team.id,
            "name": team.name,
            "leader": team.leader.username,
            "score": team.score,
            "members": member_data,
        })

        scoreboard.append({
            "rank": index,
            "team_name": team.name,
            "leader": team.leader.username,
            "score": team.score,
        })

    solved_challenges = []

    for challenge in CTFChallenge.objects.all():
        for member in challenge.solved_by.all():
            solved_challenges.append({
                "challenge_id": challenge.id,
                "title": challenge.title,
                "points": challenge.points,
                "solved_by": member.username,
            })

    snapshot = {
        "state_before_reset": {
            "status": lifecycle.status,
            "started_at": (
                lifecycle.started_at.isoformat()
                if lifecycle.started_at
                else None
            ),
            "finished_at": (
                lifecycle.finished_at.isoformat()
                if lifecycle.finished_at
                else None
            ),
        },
        "teams": team_data,
        "scoreboard": scoreboard,
        "solved_challenges": solved_challenges,
    }

    # Save history
    CTFHistory.objects.create(
        name=history_name,
        snapshot=snapshot,
    )

    # -----------------------------
    # RESET CTF
    # -----------------------------

    lifecycle.status = "not_started"
    lifecycle.started_at = None
    lifecycle.finished_at = None
    lifecycle.save()

    # Reset challenge completion
    challenges = CTFChallenge.objects.all()

    for challenge in challenges:
        challenge.solved_by.clear()

    # Reset team scores
    teams = CTFTeam.objects.all()

    for team in teams:
        team.score = 0
        team.save(update_fields=["score"])

    return Response({
        "message": "CTF reset successfully.",
        "status": lifecycle.status,
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ctf_history(request):
    histories = CTFHistory.objects.all().order_by("-created_at")

    data = []

    for history in histories:
        data.append({
            "id": history.id,
            "name": history.name,
            "snapshot": history.snapshot,
            "created_at": history.created_at,
        })

    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_flag(request):
    challenge_id = request.data.get("challenge_id")
    submitted_flag = str(request.data.get("flag", "")).strip()

    if not challenge_id or not submitted_flag:
        return Response(
            {"error": "Challenge ID and flag are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        challenge = CTFChallenge.objects.get(
            id=challenge_id,
            is_active=True,
        )
    except CTFChallenge.DoesNotExist:
        return Response(
            {"error": "Challenge not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if submitted_flag != challenge.flag:
        return Response(
            {"message": "Wrong flag."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if challenge.solved_by.filter(id=request.user.id).exists():
        return Response({
            "message": "Challenge already solved."
        })

    challenge.solved_by.add(request.user)

    team = CTFTeam.objects.filter(members=request.user).first()

    if team:
        team.score += challenge.points
        team.save(update_fields=["score"])

        CTFScoreHistory.objects.create(
            team=team,
            score=team.score,
        )

    return Response({
        "message": "Correct flag!",
        "points": challenge.points,
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_tie_breaker_visibility(request, challenge_id):
    try:
        challenge = CTFChallenge.objects.get(id=challenge_id)
    except CTFChallenge.DoesNotExist:
        return Response(
            {"error": "Challenge not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if challenge.category.name.strip().lower() != "tie breaker":
        return Response(
            {"error": "This challenge is not a Tie Breaker challenge."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    challenge.tiebreaker_visible = not challenge.tiebreaker_visible
    challenge.save(update_fields=["tiebreaker_visible"])

    return Response({
        "message": "Tie breaker visibility updated.",
        "tiebreaker_visible": challenge.tiebreaker_visible,
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_tie_breaker_visibility(request, challenge_id):
    try:
        challenge = CTFChallenge.objects.get(id=challenge_id)
    except CTFChallenge.DoesNotExist:
        return Response(
            {"error": "Challenge not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if challenge.category.name.strip().lower() != "tie breaker":
        return Response(
            {"error": "This challenge is not a Tie Breaker challenge."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    challenge.tiebreaker_visible = not challenge.tiebreaker_visible
    challenge.save(update_fields=["tiebreaker_visible"])

    return Response({
        "message": "Tie breaker visibility updated.",
        "tiebreaker_visible": challenge.tiebreaker_visible,
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def use_hint(request, challenge_id):
    try:
        challenge = CTFChallenge.objects.get(
            id=challenge_id,
            is_active=True,
        )
    except CTFChallenge.DoesNotExist:
        return Response(
            {"error": "Challenge not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    hint_number = request.data.get("hint")

    if hint_number not in [1, "1", 2, "2"]:
        return Response(
            {"error": "Invalid hint number."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    hint_number = int(hint_number)

    if hint_number == 1 and (
        not challenge.hint_1_visible or not challenge.hint_1
    ):
        return Response(
            {"error": "Hint 1 is not available."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if hint_number == 2 and (
        not challenge.hint_2_visible or not challenge.hint_2
    ):
        return Response(
            {"error": "Hint 2 is not available."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    usage, _ = CTFHintUsage.objects.get_or_create(
        user=request.user,
        challenge=challenge,
    )

    if hint_number == 1:
        if usage.hint_1_used:
            return Response({
                "message": "Hint 1 already used.",
                "penalty": 0,
                "hint": challenge.hint_1,
            })

        usage.hint_1_used = True
        penalty = challenge.hint_1_penalty
        hint = challenge.hint_1

    else:
        if usage.hint_2_used:
            return Response({
                "message": "Hint 2 already used.",
                "penalty": 0,
                "hint": challenge.hint_2,
            })

        usage.hint_2_used = True
        penalty = challenge.hint_2_penalty
        hint = challenge.hint_2

    team = CTFTeam.objects.filter(
        members=request.user
    ).first()

    if team:
        team.score = max(0, team.score - penalty)
        team.save()

    usage.save()

    return Response({
        "message": f"Hint {hint_number} used.",
        "hint": hint,
        "penalty": penalty,
        "team_score": team.score if team else None,
    })