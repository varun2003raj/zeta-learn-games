from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User

from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from treasure_hunt.models import TreasureHuntProgress

@api_view(["POST"])
def register(request):
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")

    if not username or not email or not password:
        return Response(
            {"error": "All fields are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
    )

    return Response(
        {
            "message": "Registered successfully.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
        },
        status=status.HTTP_201_CREATED,
    )



@api_view(["POST"])
def login(request):
    identifier = request.data.get("username") or request.data.get("email")
    password = request.data.get("password")

    if not identifier or not password:
        return Response(
            {"error": "Username/email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(username=identifier, password=password)

    if user is None:
        try:
            user_by_email = User.objects.get(email=identifier)
            user = authenticate(
                username=user_by_email.username,
                password=password,
            )
        except User.DoesNotExist:
            user = None

    if user is None:
        return Response(
            {"error": "Invalid username or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    token, created = Token.objects.get_or_create(user=user)

    return Response({
        "token": token.key,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": "admin" if user.is_staff or user.is_superuser else "user",
        },
    })

@api_view(["GET"])
def profile(request):
    if not request.user.is_authenticated:
        return Response(
            {"error": "Please login first."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    progress = TreasureHuntProgress.objects.filter(
        user=request.user
    ).first()

    current_score = progress.total_score if progress else 0
    best_score = progress.best_score if progress else 0

    return Response({
        "id": request.user.id,
        "username": request.user.username,
        "email": request.user.email,
        "score": current_score,
        "best_score": best_score,
    })