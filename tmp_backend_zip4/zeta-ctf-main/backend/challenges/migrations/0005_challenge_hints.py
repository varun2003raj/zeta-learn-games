from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("challenges", "0004_challenge_tiebreaker_visible"),
    ]

    operations = [
        migrations.AddField(
            model_name="challenge",
            name="hint_1",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="challenge",
            name="hint_1_visible",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="challenge",
            name="hint_2",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="challenge",
            name="hint_2_visible",
            field=models.BooleanField(default=False),
        ),
    ]

