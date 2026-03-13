from django.urls import path
from .views import SubmitFlagView

urlpatterns = [
    path("submit/", SubmitFlagView.as_view()),
]
