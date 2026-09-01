from django.urls import path

from .views import (
    get_progress,
    complete_level,
    restart_voyage,
)

urlpatterns = [
    path("progress/", get_progress, name="get_progress"),
    path("complete/", complete_level, name="complete_level"),
    path("restart/", restart_voyage, name="restart_voyage"),
]