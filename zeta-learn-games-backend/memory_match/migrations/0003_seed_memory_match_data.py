from django.db import migrations


def seed_memory_match_data(apps, schema_editor):
    MemoryGameSetting = apps.get_model("memory_match", "MemoryGameSetting")
    MemoryCard = apps.get_model("memory_match", "MemoryCard")

    settings_data = [
        {
            "difficulty": "EASY",
            "grid_size": 4,
            "time_limit_seconds": 120,
            "points_per_pair": 100,
            "wrong_move_penalty": 5,
            "hint_penalty": 25,
            "is_active": True,
        },
        {
            "difficulty": "MEDIUM",
            "grid_size": 5,
            "time_limit_seconds": 180,
            "points_per_pair": 150,
            "wrong_move_penalty": 5,
            "hint_penalty": 25,
            "is_active": True,
        },
        {
            "difficulty": "HARD",
            "grid_size": 6,
            "time_limit_seconds": 180,
            "points_per_pair": 150,
            "wrong_move_penalty": 5,
            "hint_penalty": 25,
            "is_active": True,
        },
        {
            "difficulty": "EXPERT",
            "grid_size": 7,
            "time_limit_seconds": 300,
            "points_per_pair": 249,
            "wrong_move_penalty": 15,
            "hint_penalty": 40,
            "is_active": True,
        },
    ]

    for data in settings_data:
        MemoryGameSetting.objects.update_or_create(
            difficulty=data["difficulty"],
            defaults=data,
        )


def remove_memory_match_data(apps, schema_editor):
    MemoryGameSetting = apps.get_model("memory_match", "MemoryGameSetting")
    MemoryGameSetting.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("memory_match", "0002_alter_memorycard_category"),
    ]

    operations = [
        migrations.RunPython(
            seed_memory_match_data,
            remove_memory_match_data,
        ),
    ]