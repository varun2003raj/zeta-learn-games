from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from challenges.models import Challenge
from challenges.models import CTFControl
from .models import Submission

from teams.models import TeamMember, TeamSolvedChallenge


class SubmitFlagView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        control = CTFControl.get_solo()
        if control.status == CTFControl.STATUS_FINISHED:
            return Response({"error": "CTF is finished. Flag submissions are disabled"}, status=status.HTTP_403_FORBIDDEN)
        if control.status != CTFControl.STATUS_RUNNING:
            return Response({"error": "CTF has not started yet"}, status=status.HTTP_403_FORBIDDEN)

        challenge_id = request.data.get("challenge_id")
        flag = request.data.get("flag")

        if not challenge_id or not flag:
            return Response({"error": "challenge_id and flag are required"}, status=status.HTTP_400_BAD_REQUEST)

        challenge = get_object_or_404(Challenge, id=challenge_id)

        team_member = TeamMember.objects.filter(user=request.user).first()

        if not team_member:
            return Response({"error": "Create or join a team first"}, status=status.HTTP_403_FORBIDDEN)

        team = team_member.team
        already_solved = TeamSolvedChallenge.objects.filter(team=team, challenge=challenge).exists()
        if already_solved:
            return Response({"message": "Already solved by your team"}, status=status.HTTP_200_OK)

        is_correct = (flag.strip() == challenge.flag.strip())

        Submission.objects.create(
            user=request.user,
            challenge=challenge,
            submitted_flag=flag,
            is_correct=is_correct
        )

        if is_correct:
            TeamSolvedChallenge.objects.create(
                team=team,
                challenge=challenge,
                solved_by=request.user
            )
            team.score += challenge.points
            team.save()

            return Response({"message": "Correct Flag! Team Points Added!"}, status=status.HTTP_200_OK)

        return Response({"message": "Wrong Flag"}, status=status.HTTP_400_BAD_REQUEST)
