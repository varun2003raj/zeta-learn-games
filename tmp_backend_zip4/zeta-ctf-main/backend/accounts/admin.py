from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


class CustomUserAdmin(UserAdmin):
    model = CustomUser

    # Add role field in admin edit page
    fieldsets = UserAdmin.fieldsets + (
        ("Role Management", {"fields": ("role",)}),
    )

    # Show role column in user list
    list_display = ("username", "email", "role", "is_staff", "is_superuser")

    # Add role in filters
    list_filter = ("role", "is_staff", "is_superuser")


admin.site.register(CustomUser, CustomUserAdmin)
