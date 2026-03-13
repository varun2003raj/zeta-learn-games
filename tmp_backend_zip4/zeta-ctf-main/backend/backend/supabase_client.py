from supabase import create_client
from django.conf import settings

supabase = None

if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
    supabase = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_ANON_KEY
    )