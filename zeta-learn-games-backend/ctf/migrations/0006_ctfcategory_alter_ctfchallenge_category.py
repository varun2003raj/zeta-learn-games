from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("ctf", "0005_ctfannouncement"),
    ]

    operations = [
        migrations.CreateModel(
            name="CTFCategory",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "name",
                    models.CharField(
                        max_length=100,
                        unique=True,
                    ),
                ),
            ],
        ),

        migrations.AddField(
            model_name="ctfchallenge",
            name="category_new",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="+",
                to="ctf.ctfcategory",
            ),
        ),
    ]