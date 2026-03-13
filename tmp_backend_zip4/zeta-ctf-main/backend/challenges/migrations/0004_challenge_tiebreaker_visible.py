from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("challenges", "0003_ctfhistory_name"),
    ]

    operations = [
        migrations.AddField(
            model_name="challenge",
            name="tiebreaker_visible",
            field=models.BooleanField(default=False),
        ),
    ]

