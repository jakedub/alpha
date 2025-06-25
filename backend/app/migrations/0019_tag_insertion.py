from django.db import migrations

def create_predefined_tags(apps, schema_editor):
    Tag = apps.get_model('app', 'Tag')  # replace 'app' with your app name
    predefined_tags = [
        "board_games",
        "card_games",
        "roleplaying_games",
        "miniatures",
        "wargames",
        "game_accessories",
        "dice",
        "game_mats",
        "larp_gear",
        "art",
        "prints",
        "original_artwork",
        "comics",
        "fantasy_art",
        "3d_printing",
        "sculptures",
        "fan_art",
        "tshirts",
        "cosplay",
        "pins_patches",
        "jewelry",
        "hats_headwear",
        "bags",
        "handmade_goods",
        "candles",
        "dice_trays",
        "woodworking",
        "leather_goods",
        "resin_crafts",
        "novels",
        "indie_authors",
        "zines",
        "demos",
        "workshops",
        "custom_commissions",
        "streaming_content",
    ]

    for tag_name in predefined_tags:
        Tag.objects.get_or_create(name=tag_name)

class Migration(migrations.Migration):

    dependencies = [
        ('app', '0018_tag_vendor_tags'), 
    ]

    operations = [
        migrations.RunPython(create_predefined_tags),
    ]