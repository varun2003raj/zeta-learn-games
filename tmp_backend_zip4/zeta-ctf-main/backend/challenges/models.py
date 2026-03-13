from django.db import models
from django.utils import timezone


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Challenge(models.Model):
    DIFFICULTY_CHOICES = (
        ("easy", "Easy"),
        ("medium", "Medium"),
        ("hard", "Hard"),
        ("ultra_hard", "Ultra Hard"),
    )

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="challenges")
    points = models.IntegerField(default=100)
    flag = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default="easy")

    # OLD local storage (kept temporarily for safety)
    file = models.FileField(upload_to="challenges/", blank=True, null=True)

    # NEW Supabase storage URL
    file_url = models.URLField(blank=True, null=True)

    hint_1 = models.TextField(blank=True, default="")
    hint_2 = models.TextField(blank=True, default="")
    hint_1_visible = models.BooleanField(default=False)
    hint_2_visible = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    tiebreaker_visible = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def get_file(self):
        """
        Returns Supabase URL if exists,
        otherwise fallback to local file.
        """
        if self.file_url:
            return self.file_url
        if self.file:
            return self.file.url
        return None

    def __str__(self):
        return self.title


class CTFControl(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_RUNNING = "running"
    STATUS_FINISHED = "finished"

    STATUS_CHOICES = (
        (STATUS_DRAFT, "Draft"),
        (STATUS_RUNNING, "Running"),
        (STATUS_FINISHED, "Finished"),
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj

    def start(self):
        self.status = self.STATUS_RUNNING
        if not self.started_at:
            self.started_at = timezone.now()
        self.finished_at = None
        self.save()

    def finish(self):
        self.status = self.STATUS_FINISHED
        self.finished_at = timezone.now()
        self.save()

    def reset_to_draft(self):
        self.status = self.STATUS_DRAFT
        self.started_at = None
        self.finished_at = None
        self.save()


class CTFHistory(models.Model):
    name = models.CharField(max_length=150, default="Untitled History")
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    snapshot = models.JSONField(default=dict)

    class Meta:
        ordering = ["-created_at"]