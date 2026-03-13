from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from collections import defaultdict
from django.db.models import Q

from .models import Category, Challenge, CTFControl, CTFHistory
from .serializers import CategorySerializer, ChallengeSerializer
from teams.models import Team, TeamMember, TeamSolvedChallenge
from submissions.models import Submission


def is_admin(user):
    return (
        user.is_superuser
        or user.is_staff
        or getattr(user, "is_admin_user", False)
        or getattr(user, "role", None) == "admin"
    )


def get_ctf_control():
    return CTFControl.get_solo()


def is_tiebreaker_category_name(name):
    raw = (name or "").strip().lower()
    normalized = raw.replace("_", " ").replace("-", " ")
    normalized = " ".join(normalized.split())
    return normalized in ("tie breaker", "tiebreaker", "tie braker")


def ensure_user_accessible(request):
    control = get_ctf_control()
    if control.status not in (CTFControl.STATUS_RUNNING, CTFControl.STATUS_FINISHED):
        return Response({"error": "CTF is not active right now"}, status=status.HTTP_403_FORBIDDEN)

    member = TeamMember.objects.filter(user=request.user).first()
    if not member:
        return Response({"error": "Create or join a team to access content"}, status=status.HTTP_403_FORBIDDEN)

    return member


# ---------------- USER SIDE ----------------

class CategoryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        access = ensure_user_accessible(request)
        if isinstance(access, Response):
            return access
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)


class ChallengeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        access = ensure_user_accessible(request)
        if isinstance(access, Response):
            return access
        member = access
        team = member.team
        base = Challenge.objects.filter(Q(is_active=True) | Q(file__isnull=False)).select_related("category")
        challenges = []
        for ch in base:
            is_tb = is_tiebreaker_category_name(ch.category.name if ch.category else "")
            if is_tb and not ch.tiebreaker_visible:
                continue
            challenges.append(ch)
        serializer = ChallengeSerializer(challenges, many=True)

        solved_ids = set(
            TeamSolvedChallenge.objects.filter(team=team).values_list("challenge_id", flat=True)
        )
        data = serializer.data
        for item in data:
            item["is_completed"] = item["id"] in solved_ids

        return Response(data)


class ChallengeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        access = ensure_user_accessible(request)
        if isinstance(access, Response):
            return access
        member = access
        challenge = get_object_or_404(Challenge, id=pk)
        if challenge.category and is_tiebreaker_category_name(challenge.category.name) and not challenge.tiebreaker_visible:
            return Response({"error": "Challenge is not visible yet"}, status=status.HTTP_403_FORBIDDEN)
        serializer = ChallengeSerializer(challenge)

        is_completed = TeamSolvedChallenge.objects.filter(team=member.team, challenge=challenge).exists()
        data = serializer.data
        data["is_completed"] = is_completed
        return Response(data)


# ---------------- ADMIN SIDE ----------------

# ✅ ADMIN CATEGORY CRUD (GET, POST, PUT, DELETE)
class AdminCategoryView(APIView):

    def get(self, request):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can view categories!"}, status=status.HTTP_403_FORBIDDEN)

        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can add category!"}, status=status.HTTP_403_FORBIDDEN)

        serializer = CategorySerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminCategoryDetailView(APIView):

    def put(self, request, pk):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can update category!"}, status=status.HTTP_403_FORBIDDEN)

        category = get_object_or_404(Category, id=pk)
        serializer = CategorySerializer(category, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can delete category!"}, status=status.HTTP_403_FORBIDDEN)

        category = get_object_or_404(Category, id=pk)
        category.delete()

        return Response({"message": "Category deleted successfully"}, status=status.HTTP_200_OK)


# ✅ ADMIN CHALLENGE CRUD (GET, POST, PUT, DELETE)
class AdminChallengeView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can view challenges!"}, status=status.HTTP_403_FORBIDDEN)

        from .admin_serializers import AdminChallengeSerializer
        challenges = Challenge.objects.all()
        serializer = AdminChallengeSerializer(challenges, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can add challenge!"}, status=status.HTTP_403_FORBIDDEN)

        # ✅ IMPORTANT: Use AdminChallengeSerializer so FLAG is saved
        from .admin_serializers import AdminChallengeSerializer
        serializer = AdminChallengeSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminChallengeDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def put(self, request, pk):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can update challenge!"}, status=status.HTTP_403_FORBIDDEN)

        challenge = get_object_or_404(Challenge, id=pk)

        # ✅ IMPORTANT: Use AdminChallengeSerializer so FLAG is updated
        from .admin_serializers import AdminChallengeSerializer
        serializer = AdminChallengeSerializer(challenge, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can update challenge!"}, status=status.HTTP_403_FORBIDDEN)

        challenge = get_object_or_404(Challenge, id=pk)
        from .admin_serializers import AdminChallengeSerializer
        serializer = AdminChallengeSerializer(challenge, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can delete challenge!"}, status=status.HTTP_403_FORBIDDEN)

        challenge = get_object_or_404(Challenge, id=pk)
        challenge.delete()

        return Response({"message": "Challenge deleted successfully"}, status=status.HTTP_200_OK)


class AdminChallengeTieVisibilityView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can update tie-breaker visibility!"}, status=status.HTTP_403_FORBIDDEN)

        challenge = get_object_or_404(Challenge, id=pk)
        if not challenge.category or not is_tiebreaker_category_name(challenge.category.name):
            return Response({"error": "This challenge is not in Tie Breaker category"}, status=status.HTTP_400_BAD_REQUEST)

        challenge.tiebreaker_visible = not challenge.tiebreaker_visible
        challenge.save(update_fields=["tiebreaker_visible"])
        return Response(
            {
                "message": "Tie-breaker challenge visibility updated",
                "tiebreaker_visible": challenge.tiebreaker_visible,
            },
            status=status.HTTP_200_OK,
        )


class AdminCTFStateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can view CTF state!"}, status=status.HTTP_403_FORBIDDEN)

        control = get_ctf_control()
        return Response(
            {
                "status": control.status,
                "started_at": control.started_at,
                "finished_at": control.finished_at,
                "updated_at": control.updated_at,
            },
            status=status.HTTP_200_OK,
        )


class AdminCTFStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can start CTF!"}, status=status.HTTP_403_FORBIDDEN)

        control = get_ctf_control()
        control.status = CTFControl.STATUS_RUNNING
        control.started_at = timezone.now()
        control.finished_at = None
        control.save()
        return Response({"message": "CTF started successfully"}, status=status.HTTP_200_OK)


class AdminCTFFinishView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can finish CTF!"}, status=status.HTTP_403_FORBIDDEN)

        control = get_ctf_control()
        control.status = CTFControl.STATUS_FINISHED
        control.finished_at = timezone.now()
        control.save()
        return Response({"message": "CTF finished successfully"}, status=status.HTTP_200_OK)


class AdminCTFResetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can reset CTF!"}, status=status.HTTP_403_FORBIDDEN)

        history_name = (request.data.get("history_name") or "").strip()
        if not history_name:
            return Response({"error": "history_name is required"}, status=status.HTTP_400_BAD_REQUEST)

        control = get_ctf_control()
        teams = Team.objects.all().order_by("-score")
        solved_rows = TeamSolvedChallenge.objects.select_related("team", "challenge", "solved_by").all()
        submissions_rows = Submission.objects.select_related("user", "challenge").all()
        member_rows = TeamMember.objects.select_related("team", "user").all()

        individual_scores = defaultdict(int)
        for row in solved_rows:
            if row.solved_by_id:
                individual_scores[row.solved_by.username] += row.challenge.points

        team_members_map = defaultdict(list)
        for member in member_rows:
            username = member.user.username
            team_members_map[member.team_id].append(
                {
                    "username": username,
                    "joined_at": member.joined_at.isoformat() if member.joined_at else None,
                    "individual_score": individual_scores.get(username, 0),
                }
            )

        teams_snapshot = []
        scoreboard = []
        for rank, t in enumerate(teams, start=1):
            teams_snapshot.append(
                {
                    "id": t.id,
                    "name": t.name,
                    "code": t.code,
                    "score": t.score,
                    "leader": t.leader.username,
                    "members": team_members_map.get(t.id, []),
                }
            )
            scoreboard.append(
                {
                    "rank": rank,
                    "team_name": t.name,
                    "score": t.score,
                    "leader": t.leader.username,
                }
            )

        snapshot = {
            "state_before_reset": {
                "status": control.status,
                "started_at": control.started_at.isoformat() if control.started_at else None,
                "finished_at": control.finished_at.isoformat() if control.finished_at else None,
            },
            "teams": teams_snapshot,
            "scoreboard": scoreboard,
            "individual_scores": [
                {"username": username, "score": score}
                for username, score in sorted(individual_scores.items(), key=lambda item: item[1], reverse=True)
            ],
            "solved_challenges": [
                {
                    "team": row.team.name,
                    "challenge": row.challenge.title,
                    "points": row.challenge.points,
                    "solved_by": row.solved_by.username if row.solved_by else None,
                    "solved_at": row.solved_at.isoformat() if row.solved_at else None,
                }
                for row in solved_rows
            ],
            "submissions_count": submissions_rows.count(),
        }

        CTFHistory.objects.create(
            name=history_name,
            started_at=control.started_at,
            finished_at=control.finished_at,
            snapshot=snapshot,
        )

        TeamSolvedChallenge.objects.all().delete()
        Submission.objects.all().delete()
        Team.objects.all().update(score=0)

        control.reset_to_draft()
        return Response({"message": "CTF reset completed and archived to history"}, status=status.HTTP_200_OK)


class AdminCTFHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can view CTF history!"}, status=status.HTTP_403_FORBIDDEN)

        rows = CTFHistory.objects.all()[:100]
        data = [
            {
                "id": row.id,
                "name": row.name,
                "created_at": row.created_at,
                "started_at": row.started_at,
                "finished_at": row.finished_at,
                "snapshot": row.snapshot,
            }
            for row in rows
        ]
        return Response(data, status=status.HTTP_200_OK)


class CTFStateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        control = get_ctf_control()
        return Response(
            {
                "status": control.status,
                "started_at": control.started_at,
                "finished_at": control.finished_at,
                "updated_at": control.updated_at,
            },
            status=status.HTTP_200_OK,
        )


# ---------------- OLD ADMIN VIEWS (KEEPING - NO BREAK) ----------------

class AdminAddCategoryView(APIView):
    def post(self, request):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can add category!"}, status=status.HTTP_403_FORBIDDEN)

        name = request.data.get("name")

        if not name:
            return Response({"error": "Category name is required"}, status=status.HTTP_400_BAD_REQUEST)

        category = Category.objects.create(name=name)

        return Response({
            "message": "Category added successfully",
            "category": CategorySerializer(category).data
        }, status=status.HTTP_201_CREATED)


class AdminDeleteCategoryView(APIView):
    def delete(self, request, pk):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can delete category!"}, status=status.HTTP_403_FORBIDDEN)

        category = get_object_or_404(Category, id=pk)
        category.delete()

        return Response({"message": "Category deleted successfully"}, status=status.HTTP_200_OK)


class AdminAddChallengeView(APIView):
    def post(self, request):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can add challenge!"}, status=status.HTTP_403_FORBIDDEN)

        title = request.data.get("title")
        description = request.data.get("description")
        category_id = request.data.get("category")
        points = request.data.get("points")
        difficulty = request.data.get("difficulty")
        flag = request.data.get("flag")
        is_active = request.data.get("is_active", True)

        if not title or not description or not category_id or not points or not difficulty or not flag:
            return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

        category = get_object_or_404(Category, id=category_id)

        challenge = Challenge.objects.create(
            title=title,
            description=description,
            category=category,
            points=points,
            difficulty=difficulty,
            flag=flag,
            is_active=is_active
        )

        return Response({
            "message": "Challenge added successfully",
            "challenge": ChallengeSerializer(challenge).data
        }, status=status.HTTP_201_CREATED)


class AdminDeleteChallengeView(APIView):
    def delete(self, request, pk):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can delete challenge!"}, status=status.HTTP_403_FORBIDDEN)

        challenge = get_object_or_404(Challenge, id=pk)
        challenge.delete()

        return Response({"message": "Challenge deleted successfully"}, status=status.HTTP_200_OK)


class AdminAllChallengesView(APIView):
    def get(self, request):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can view flags!"}, status=status.HTTP_403_FORBIDDEN)

        from .admin_serializers import AdminChallengeSerializer

        challenges = Challenge.objects.all()
        serializer = AdminChallengeSerializer(challenges, many=True)
        return Response(serializer.data)
