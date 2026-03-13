from rest_framework import serializers
from .models import Challenge
from django.conf import settings
from backend.supabase_client import supabase
import uuid


class AdminChallengeSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Challenge
        fields = "__all__"

    def create(self, validated_data):
        file_obj = validated_data.pop("file", None)

        challenge = Challenge.objects.create(**validated_data)

        if file_obj and supabase:
            file_url = self.upload_to_supabase(file_obj)
            challenge.file_url = file_url
            challenge.file = None  # prevent local storage
            challenge.save(update_fields=["file_url", "file"])

        return challenge

    def update(self, instance, validated_data):
        file_obj = validated_data.pop("file", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if file_obj and supabase:
            file_url = self.upload_to_supabase(file_obj)
            instance.file_url = file_url
            instance.file = None  # prevent local storage

        instance.save()
        return instance

    def upload_to_supabase(self, file_obj):
        unique_filename = f"{uuid.uuid4()}_{file_obj.name}"
        file_path = f"challenges/{unique_filename}"

        supabase.storage.from_(settings.SUPABASE_BUCKET).upload(
            file_path,
            file_obj.read(),
            {"content-type": file_obj.content_type}
        )

        public_url = supabase.storage.from_(settings.SUPABASE_BUCKET).get_public_url(file_path)

    # 🔥 Remove trailing ? if exists
        if public_url.endswith("?"):
            public_url = public_url[:-1]

        return public_url