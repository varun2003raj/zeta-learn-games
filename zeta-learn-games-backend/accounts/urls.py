from django.urls import path
from .views import login, profile, register

urlpatterns = [
    path("register/", register),
    path("login/", login),
    path("profile/", profile),
]