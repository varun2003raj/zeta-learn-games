from django.db import migrations


def seed_memory_match_cards(apps, schema_editor):
    MemoryCard = apps.get_model("memory_match", "MemoryCard")

    cards = [
        ("🐧", "SECURITY"),
        ("🌐", "NETWORK"),
        ("🐍", "PROGRAMMING"),
        ("⚡", "PROGRAMMING"),
        ("💻", "PROGRAMMING"),
        ("⌨️", "SECURITY"),
        ("🖥️", "SECURITY"),
        ("🔐", "SECURITY"),
        ("🔥", "DEFENSE"),
        ("🦠", "ATTACK"),
        ("🎣", "ATTACK"),
        ("🕵️", "SECURITY"),
        ("🕷️", "SECURITY"),
        ("🔎", "NETWORK"),
        ("🦈", "NETWORK"),
        ("💣", "ATTACK"),
        ("🤖", "SECURITY"),
        ("☁️", "NETWORK"),
        ("🔑", "SECURITY"),
        ("🚨", "MALWARE"),
        ("🧬", "MALWARE"),
        ("🗄️", "SECURITY"),
        ("🧩", "MALWARE"),
    ]

    for name, category in cards:
        MemoryCard.objects.get_or_create(
            name=name,
            category=category,
            defaults={"is_active": True},
        )


def remove_memory_match_cards(apps, schema_editor):
    MemoryCard = apps.get_model("memory_match", "MemoryCard")
    MemoryCard.objects.filter(
        name__in=[
            "🐧", "🌐", "🐍", "⚡", "💻", "⌨️", "🖥️", "🔐",
            "🔥", "🦠", "🎣", "🕵️", "🕷️", "🔎", "🦈", "💣",
            "🤖", "☁️", "🔑", "🚨", "🧬", "🗄️", "🧩",
        ]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("memory_match", "0003_seed_memory_match_data"),
    ]

    operations = [
        migrations.RunPython(
            seed_memory_match_cards,
            remove_memory_match_cards,
        ),
    ]