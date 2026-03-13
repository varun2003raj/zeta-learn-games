from django.urls import path
from .views import (
    AnnouncementListView,
    AdminAddAnnouncementView,
    AdminDeleteAnnouncementView,
    AdminAnnouncementView,
    AdminAnnouncementDetailView
)

urlpatterns = [
    # user
    path("", AnnouncementListView.as_view()),

    # new admin CRUD endpoints (frontend uses this)
    path("admin/", AdminAnnouncementView.as_view()),
    path("admin/<int:pk>/", AdminAnnouncementDetailView.as_view()),

    # old endpoints (keeping for safety)
    path("admin/add/", AdminAddAnnouncementView.as_view()),
    path("admin/delete/<int:pk>/", AdminDeleteAnnouncementView.as_view()),
]
