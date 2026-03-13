from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Count, Sum

from .models import Team, TeamMember, TeamSolvedChallenge
from .serializers import (
    TeamSerializer,
    JoinTeamSerializer,
    TeamMemberSerializer,
    TeamSolvedSerializer
)


def is_admin(user):
    return (
        user.is_superuser
        or user.is_staff
        or getattr(user, "is_admin_user", False)
        or getattr(user, "role", None) == "admin"
    )


# ---------------- USER SIDE ----------------

class CreateTeamView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        name = request.data.get("name")

        if not name:
            return Response({"error": "Team name is required"}, status=status.HTTP_400_BAD_REQUEST)

        if TeamMember.objects.filter(user=request.user).exists():
            return Response({"error": "You are already in a team"}, status=status.HTTP_400_BAD_REQUEST)

        team = Team.objects.create(name=name, leader=request.user)
        TeamMember.objects.create(team=team, user=request.user)

        return Response({
            "message": "Team created successfully",
            "team": TeamSerializer(team).data
        }, status=status.HTTP_201_CREATED)


class JoinTeamView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = JoinTeamSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data["code"].upper()
        team = get_object_or_404(Team, code=code)

        if TeamMember.objects.filter(user=request.user).exists():
            return Response({"error": "You are already in a team"}, status=status.HTTP_400_BAD_REQUEST)

        member_count = TeamMember.objects.filter(team=team).count()
        if member_count >= 4:
            return Response(
                {"error": "Team is full. Maximum 4 members allowed (including TL)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        TeamMember.objects.create(team=team, user=request.user)

        return Response({
            "message": "Joined team successfully",
            "team": TeamSerializer(team).data
        }, status=status.HTTP_200_OK)


class MyTeamView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        member = TeamMember.objects.filter(user=request.user).first()

        if not member:
            return Response({"error": "You are not in any team"}, status=status.HTTP_404_NOT_FOUND)

        team = member.team
        members = TeamMember.objects.filter(team=team)
        solved = TeamSolvedChallenge.objects.filter(team=team).select_related("solved_by", "challenge")

        contribution_rows = (
            solved.values("solved_by_id", "solved_by__username")
            .annotate(solved_count=Count("id"), total_points=Sum("challenge__points"))
            .order_by("-total_points", "-solved_count", "solved_by__username")
        )

        contribution_map = {
            row["solved_by_id"]: {
                "user_id": row["solved_by_id"],
                "username": row["solved_by__username"],
                "solved_count": row["solved_count"] or 0,
                "total_points": row["total_points"] or 0,
            }
            for row in contribution_rows
        }

        member_contributions = []
        for m in members:
            base = contribution_map.get(
                m.user_id,
                {
                    "user_id": m.user_id,
                    "username": m.user.username,
                    "solved_count": 0,
                    "total_points": 0,
                },
            )
            member_contributions.append(base)

        member_contributions.sort(
            key=lambda item: (-item["total_points"], -item["solved_count"], item["username"].lower())
        )

        return Response({
            "team": TeamSerializer(team).data,
            "members": TeamMemberSerializer(members, many=True).data,
            "member_contributions": member_contributions,
        })


class LeaveTeamView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        member = TeamMember.objects.filter(user=request.user).first()

        if not member:
            return Response({"error": "You are not in a team"}, status=status.HTTP_400_BAD_REQUEST)

        team = member.team

        if team.leader == request.user:
            return Response({"error": "Leader cannot leave the team"}, status=status.HTTP_400_BAD_REQUEST)

        member.delete()
        return Response({"message": "Left team successfully"}, status=status.HTTP_200_OK)


class DeleteTeamView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        member = TeamMember.objects.filter(user=request.user).first()

        if not member:
            return Response({"error": "You are not in any team"}, status=status.HTTP_400_BAD_REQUEST)

        team = member.team

        if team.leader != request.user:
            return Response({"error": "Only leader can delete the team"}, status=status.HTTP_403_FORBIDDEN)

        team.delete()
        return Response({"message": "Team deleted successfully"}, status=status.HTTP_200_OK)


# ---------------- ADMIN SIDE ----------------

class AdminAllTeamsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can view teams!"}, status=status.HTTP_403_FORBIDDEN)

        teams = Team.objects.all().order_by("-score")
        result = []

        for team in teams:
            members = TeamMember.objects.filter(team=team)
            solved = TeamSolvedChallenge.objects.filter(team=team).order_by("-solved_at")
            contribution_rows = (
                TeamSolvedChallenge.objects.filter(team=team)
                .values("solved_by_id", "solved_by__username")
                .annotate(solved_count=Count("id"), total_points=Sum("challenge__points"))
                .order_by("-total_points", "-solved_count", "solved_by__username")
            )

            contribution_map = {
                row["solved_by_id"]: {
                    "user_id": row["solved_by_id"],
                    "username": row["solved_by__username"],
                    "solved_count": row["solved_count"] or 0,
                    "total_points": row["total_points"] or 0,
                }
                for row in contribution_rows
            }

            member_contributions = []
            for m in members:
                member_contributions.append(
                    contribution_map.get(
                        m.user_id,
                        {
                            "user_id": m.user_id,
                            "username": m.user.username,
                            "solved_count": 0,
                            "total_points": 0,
                        },
                    )
                )

            member_contributions.sort(
                key=lambda item: (-item["total_points"], -item["solved_count"], item["username"].lower())
            )

            result.append({
                "team": TeamSerializer(team).data,
                "members": TeamMemberSerializer(members, many=True).data,
                "solved_challenges": TeamSolvedSerializer(solved, many=True).data,
                "member_contributions": member_contributions,
            })

        return Response(result, status=status.HTTP_200_OK)
