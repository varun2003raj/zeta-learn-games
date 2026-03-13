from pathlib import Path
import os
import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env for local development
load_dotenv()


def env_bool(name, default=False):
    return os.environ.get(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


# =========================
# Security
# =========================

SECRET_KEY = os.environ.get(
    "SECRET_KEY",
    "django-insecure-zeta-ctf-secret-key-change-this"
)

DEBUG = env_bool("DEBUG", True)

ALLOWED_HOSTS = ["*"]


# =========================
# Database (Render / Supabase / Local)
# =========================

DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    if DEBUG:
        # Local fallback database
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": BASE_DIR / "db.sqlite3",
            }
        }
    else:
        raise Exception("DATABASE_URL environment variable is not set.")
else:
    db_scheme = DATABASE_URL.split(":", 1)[0].lower()
    if not DEBUG and db_scheme in {"sqlite", "sqlite3"}:
        raise Exception("SQLite DATABASE_URL is not allowed in production.")

    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            ssl_require=not DEBUG,
        )
    }


# =========================
# Applications
# =========================

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third Party Apps
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",

    # Your Apps
    "accounts",
    "challenges",
    "teams",
    "submissions",
    "leaderboard",
    "announcements",
    "escape_room",
]


# =========================
# Middleware
# =========================

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


ROOT_URLCONF = "backend.urls"


# =========================
# Templates
# =========================

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


WSGI_APPLICATION = "backend.wsgi.application"


# =========================
# Password validation
# =========================

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# =========================
# Internationalization
# =========================

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"

USE_I18N = True
USE_TZ = True


# =========================
# Static Files
# =========================

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"


# =========================
# Media (Local fallback only)
# =========================

MEDIA_URL = os.environ.get("MEDIA_URL", "/media/")
MEDIA_ROOT = BASE_DIR / "media"
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)


# =========================
# Supabase Storage
# =========================

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_BUCKET = os.environ.get("SUPABASE_BUCKET", "challenge-files")


# =========================
# Custom User Model
# =========================

AUTH_USER_MODEL = "accounts.CustomUser"


# =========================
# CORS
# =========================

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True


# =========================
# REST Framework
# =========================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
}


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
