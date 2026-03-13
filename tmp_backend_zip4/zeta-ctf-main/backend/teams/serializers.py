from rest_framework import serializers
from .models import Team, TeamMember, TeamSolvedChallenge


class TeamSerializer(serializers.ModelSerializer):
    leader_name = serializers.CharField(source="leader.username", read_only=True)

    class Meta:
        model = Team
        fields = ["id", "name", "code", "leader_name", "score", "created_at"]
        read_only_fields = ["code", "leader_name", "score", "created_at"]


class JoinTeamSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)


class TeamMemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = TeamMember
        fields = ["id", "username", "joined_at"]


class TeamSolvedSerializer(serializers.ModelSerializer):
    challenge_title = serializers.CharField(source="challenge.title", read_only=True)
    solved_by_name = serializers.CharField(source="solved_by.username", read_only=True)
    challenge_points = serializers.IntegerField(source="challenge.points", read_only=True)

    class Meta:
        model = TeamSolvedChallenge
        fields = ["id", "challenge_title", "challenge_points", "solved_by_name", "solved_at"]
