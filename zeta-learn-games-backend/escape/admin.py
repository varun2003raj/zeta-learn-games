from django.contrib import admin
from .models import EscapeRoom, Puzzle, Hint, Progress, Attempt


admin.site.register(EscapeRoom)
admin.site.register(Puzzle)
admin.site.register(Hint)
admin.site.register(Progress)
admin.site.register(Attempt)