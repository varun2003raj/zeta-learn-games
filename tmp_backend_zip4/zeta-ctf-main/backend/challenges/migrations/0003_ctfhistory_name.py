from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("challenges", "0002_ctfcontrol_ctfhistory"),
    ]

    operations = [
        migrations.AddField(
            model_name="ctfhistory",
            name="name",
            field=models.CharField(default="Untitled History", max_length=150),
        ),
    ]

