from django.contrib import admin
from django.urls import path, include

from treasure_hunt.views import (
    get_progress,
    complete_level,
    restart_voyage,
)

from ctf.views import (
    get_challenges,
    get_challenge_detail,
    admin_challenges,
    create_team,
    get_my_team,
    delete_team,
    join_team,
    leave_team,
    admin_teams,
    get_leaderboard,
    get_leaderboard_timeline,
    announcements,
    update_announcement,
    categories,
    update_category,
    ctf_state,
    start_ctf,
    finish_ctf,
    reset_ctf,
    ctf_history,
    update_delete_challenge,
    submit_flag,
    toggle_tie_breaker_visibility,
    use_hint,
)

from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/accounts/", include("accounts.urls")),

    # Treasure Hunt
    path("api/treasure-hunt/progress/", get_progress),
    path("api/treasure-hunt/complete/", complete_level),
    path("api/treasure-hunt/restart/", restart_voyage),

    # CTF Challenges
    path("api/ctf/challenges/", get_challenges),
    path("api/ctf/challenges/<int:challenge_id>/",get_challenge_detail),

    # CTF Teams
    path("api/teams/create/", create_team),
    path("api/teams/my-team/", get_my_team),
    path("api/teams/delete/", delete_team),
    path("api/teams/join/", join_team),
    path("api/teams/leave/", leave_team),
    path("api/teams/admin/all/", admin_teams),

    path("api/ctf/leaderboard/", get_leaderboard),
    path("api/ctf/leaderboard/timeline/",get_leaderboard_timeline),
    path("api/ctf/leaderboard/admin/timeline/", get_leaderboard_timeline),

    path("api/ctf/announcements/", announcements),
    path("api/ctf/announcements/admin/",announcements),
    path("api/ctf/announcements/admin/<int:announcement_id>/",update_announcement),


    # CTF Categories
    path("api/ctf/challenges/admin/categories/", categories),
    path("api/ctf/challenges/admin/categories/<int:category_id>/",update_category,),
    path("api/ctf/challenges/admin/challenges/",admin_challenges,),
    path("api/ctf/challenges/admin/challenges/<int:challenge_id>/",update_delete_challenge,),

        # CTF Lifecycle
    path("api/ctf/challenges/admin/ctf/state/", ctf_state),
    path("api/ctf/challenges/admin/ctf/start/", start_ctf),
    path("api/ctf/challenges/admin/ctf/finish/", finish_ctf),
    path("api/ctf/challenges/admin/ctf/reset/", reset_ctf),
    path("api/ctf/challenges/admin/ctf/history/", ctf_history),

    path("api/ctf/submissions/submit/",submit_flag,),

    path("api/ctf/challenges/admin/challenges/<int:challenge_id>/toggle-tiebreaker/",toggle_tie_breaker_visibility,),
    path("api/ctf/challenges/<int:challenge_id>/hint/",use_hint,),

    # Escape Room
    path("api/escape/", include("escape.urls")),

    # Memory Match
path("api/memory-match/", include("memory_match.urls")),

]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)