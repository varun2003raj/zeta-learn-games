from rest_framework import serializers
from .models import Submission, SolvedChallenge


class SubmissionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    challenge_title = serializers.CharField(source="challenge.title", read_only=True)

    class Meta:
        model = Submission
        fields = "__all__"


class SolvedChallengeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolvedChallenge
        fields = "__all__"
