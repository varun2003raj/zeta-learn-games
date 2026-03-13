import uuid
from django.conf import settings
from backend.supabase_client import supabase


def upload_challenge_file(file):
    if not supabase:
        return None

    unique_filename = f"{uuid.uuid4()}_{file.name}"
    file_path = f"challenges/{unique_filename}"

    supabase.storage.from_(settings.SUPABASE_BUCKET).upload(
        file_path,
        file.read(),
        {"content-type": file.content_type}
    )

    public_url = supabase.storage.from_(settings.SUPABASE_BUCKET).get_public_url(file_path)

    return public_url