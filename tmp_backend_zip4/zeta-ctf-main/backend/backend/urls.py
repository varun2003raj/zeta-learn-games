from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/accounts/", include("accounts.urls")),
    path("api/ctf/challenges/", include("challenges.urls")),
    path("api/teams/", include("teams.urls")),
    path("api/ctf/submissions/", include("submissions.urls")),
    path("api/ctf/leaderboard/", include("leaderboard.urls")),
    path("api/ctf/announcements/", include("announcements.urls")),
    path("api/escape/", include("escape_room.urls")),
    path("api/ctf/token/", obtain_auth_token),
]

if settings.DEBUG or getattr(settings, "SERVE_MEDIA", False):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
