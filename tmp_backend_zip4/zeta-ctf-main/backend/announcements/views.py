from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Announcement
from .serializers import AnnouncementSerializer
from teams.models import TeamMember


def is_admin(user):
    return (
        user.is_superuser
        or user.is_staff
        or getattr(user, "is_admin_user", False)
        or getattr(user, "role", None) == "admin"
    )


# ---------------- USER SIDE ----------------

class AnnouncementListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not TeamMember.objects.filter(user=request.user).exists():
            return Response({"error": "Create or join a team to access content"}, status=status.HTTP_403_FORBIDDEN)
        announcements = Announcement.objects.all()
        serializer = AnnouncementSerializer(announcements, many=True)
        return Response(serializer.data)


# ---------------- ADMIN SIDE (NEW CRUD STYLE) ----------------

class AdminAnnouncementView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can view announcements!"}, status=status.HTTP_403_FORBIDDEN)

        announcements = Announcement.objects.all()
        serializer = AnnouncementSerializer(announcements, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can add announcement!"}, status=status.HTTP_403_FORBIDDEN)

        serializer = AnnouncementSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(created_by=request.user)   # ✅ IMPORTANT FIX
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminAnnouncementDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can update announcement!"}, status=status.HTTP_403_FORBIDDEN)

        announcement = get_object_or_404(Announcement, id=pk)
        serializer = AnnouncementSerializer(announcement, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can delete announcement!"}, status=status.HTTP_403_FORBIDDEN)

        announcement = get_object_or_404(Announcement, id=pk)
        announcement.delete()

        return Response({"message": "Announcement deleted successfully"}, status=status.HTTP_200_OK)


# ---------------- OLD ADMIN VIEWS (KEEPING - NO BREAK) ----------------

class AdminAddAnnouncementView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can add announcement!"}, status=status.HTTP_403_FORBIDDEN)

        title = request.data.get("title")
        message = request.data.get("message")

        if not title or not message:
            return Response({"error": "Title and message are required"}, status=status.HTTP_400_BAD_REQUEST)

        announcement = Announcement.objects.create(
            title=title,
            message=message,
            created_by=request.user   # ✅ IMPORTANT FIX
        )

        return Response({
            "message": "Announcement added successfully",
            "announcement": AnnouncementSerializer(announcement).data
        }, status=status.HTTP_201_CREATED)


class AdminDeleteAnnouncementView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, pk):
        if not is_admin(request.user):
            return Response({"error": "Only Admin can delete announcement!"}, status=status.HTTP_403_FORBIDDEN)

        announcement = get_object_or_404(Announcement, id=pk)
        announcement.delete()

        return Response({"message": "Announcement deleted successfully"}, status=status.HTTP_200_OK)
