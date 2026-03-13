from rest_framework import serializers
from .models import Challenge, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class ChallengeSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    visible_hints = serializers.SerializerMethodField()
    is_completed = serializers.BooleanField(read_only=True)  # ✅ FIX

    class Meta:
        model = Challenge
        fields = [
            "id",
            "title",
            "description",
            "points",
            "difficulty",
            "category",
            "category_name",
            "file_url",
            "visible_hints",
            "is_completed",
        ]

    def get_visible_hints(self, obj):
        hints = []

        if obj.hint_1_visible and obj.hint_1:
            hints.append(obj.hint_1)

        if obj.hint_2_visible and obj.hint_2:
            hints.append(obj.hint_2)

        return hints