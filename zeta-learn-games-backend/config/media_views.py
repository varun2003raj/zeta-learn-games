from django.http import FileResponse, Http404
from django.conf import settings
from pathlib import Path


def serve_media(request, path):
    file_path = Path(settings.MEDIA_ROOT) / path

    if not file_path.exists() or not file_path.is_file():
        raise Http404("File not found")

    return FileResponse(
        open(file_path, "rb"),
        as_attachment=False,
    )