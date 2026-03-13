from django.urls import path
from .views import (
    CreateTeamView,
    JoinTeamView,
    MyTeamView,
    LeaveTeamView,
    DeleteTeamView,
    AdminAllTeamsView
)

urlpatterns = [
    # user
    path("create/", CreateTeamView.as_view()),
    path("join/", JoinTeamView.as_view()),
    path("my-team/", MyTeamView.as_view()),
    path("leave/", LeaveTeamView.as_view()),
    path("delete/", DeleteTeamView.as_view()),

    # admin
    path("admin/all/", AdminAllTeamsView.as_view()),
]
