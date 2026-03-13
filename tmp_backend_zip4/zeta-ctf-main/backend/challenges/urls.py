from django.urls import path
from .views import (
    CategoryListView,
    ChallengeListView,
    ChallengeDetailView,
    AdminCategoryView,
    AdminCategoryDetailView,
    AdminChallengeView,
    AdminChallengeDetailView,
    AdminChallengeTieVisibilityView,
    AdminCTFStateView,
    AdminCTFStartView,
    AdminCTFFinishView,
    AdminCTFResetView,
    AdminCTFHistoryView,
    CTFStateView,
)

urlpatterns = [
    # USER
    path("categories/", CategoryListView.as_view()),
    path("ctf/state/", CTFStateView.as_view()),
    path("", ChallengeListView.as_view()),
    path("<int:pk>/", ChallengeDetailView.as_view()),

    # ADMIN CRUD
    path("admin/categories/", AdminCategoryView.as_view()),
    path("admin/categories/<int:pk>/", AdminCategoryDetailView.as_view()),

    path("admin/challenges/", AdminChallengeView.as_view()),
    path("admin/challenges/<int:pk>/", AdminChallengeDetailView.as_view()),
    path("admin/challenges/<int:pk>/toggle-tiebreaker/", AdminChallengeTieVisibilityView.as_view()),

    # ADMIN CTF CONTROL
    path("admin/ctf/state/", AdminCTFStateView.as_view()),
    path("admin/ctf/start/", AdminCTFStartView.as_view()),
    path("admin/ctf/finish/", AdminCTFFinishView.as_view()),
    path("admin/ctf/reset/", AdminCTFResetView.as_view()),
    path("admin/ctf/history/", AdminCTFHistoryView.as_view()),
]
