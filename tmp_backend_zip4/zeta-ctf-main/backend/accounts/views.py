from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token

from .models import CustomUser
from .serializers import UserSerializer


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def register_view(request):
    serializer = UserSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)

        return Response({
            "message": "User registered successfully",
            "token": token.key,
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role
            }
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_view(request):
    identifier = (request.data.get("username") or request.data.get("email") or "").strip()
    password = request.data.get("password")

    username = identifier
    matched_user = None
    if "@" in identifier:
        matched_user = CustomUser.objects.filter(email__iexact=identifier).first()
    else:
        matched_user = CustomUser.objects.filter(username__iexact=identifier).first()

    if matched_user:
        username = matched_user.username

    user = authenticate(username=username, password=password)

    if user is None:
        return Response({"error": "Invalid username or password"}, status=status.HTTP_401_UNAUTHORIZED)

    token, created = Token.objects.get_or_create(user=user)

    return Response({
        "token": token.key,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role
    })
