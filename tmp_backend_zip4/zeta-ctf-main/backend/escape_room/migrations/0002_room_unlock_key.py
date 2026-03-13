from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("escape_room", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="room",
            name="unlock_key",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
