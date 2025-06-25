from django.db import models

class Tag(models.Model):
    BOARD_GAMES = "board_games"
    CARD_GAMES = "card_games"
    ROLEPLAYING_GAMES = "roleplaying_games"
    MINIATURES = "miniatures"
    WARGAMES = "wargames"
    GAME_ACCESSORIES = "game_accessories"
    DICE = "dice"
    GAME_MATS = "game_mats"
    LARP_GEAR = "larp_gear"

    ART = "art"
    PRINTS = "prints"
    ORIGINAL_ARTWORK = "original_artwork"
    COMICS = "comics"
    FANTASY_ART = "fantasy_art"
    PRINT_3D = "3d_printing"
    SCULPTURES = "sculptures"
    FAN_ART = "fan_art"

    TSHIRTS = "tshirts"
    COSPLAY = "cosplay"
    PINS_PATCHES = "pins_patches"
    JEWELRY = "jewelry"
    HATS_HEADWEAR = "hats_headwear"
    BAGS = "bags"

    HANDMADE_GOODS = "handmade_goods"
    CANDLES = "candles"
    DICE_TRAYS = "dice_trays"
    WOODWORKING = "woodworking"
    LEATHER_GOODS = "leather_goods"
    RESIN_CRAFTS = "resin_crafts"

    NOVELS = "novels"
    INDIE_AUTHORS = "indie_authors"
    ZINES = "zines"

    DEMOS = "demos"
    WORKSHOPS = "workshops"
    CUSTOM_COMMISSIONS = "custom_commissions"
    STREAMING_CONTENT = "streaming_content"

    TAG_CHOICES = [
        (BOARD_GAMES, "Board Games"),
        (CARD_GAMES, "Card Games"),
        (ROLEPLAYING_GAMES, "Roleplaying Games"),
        (MINIATURES, "Miniatures"),
        (WARGAMES, "Wargames"),
        (GAME_ACCESSORIES, "Game Accessories"),
        (DICE, "Dice"),
        (GAME_MATS, "Game Mats"),
        (LARP_GEAR, "LARP Gear"),

        (ART, "Art"),
        (PRINTS, "Prints"),
        (ORIGINAL_ARTWORK, "Original Artwork"),
        (COMICS, "Comics"),
        (FANTASY_ART, "Fantasy Art"),
        (PRINT_3D, "3D Printing"),
        (SCULPTURES, "Sculptures"),
        (FAN_ART, "Fan Art"),

        (TSHIRTS, "T-Shirts"),
        (COSPLAY, "Cosplay"),
        (PINS_PATCHES, "Pins & Patches"),
        (JEWELRY, "Jewelry"),
        (HATS_HEADWEAR, "Hats & Headwear"),
        (BAGS, "Bags"),

        (HANDMADE_GOODS, "Handmade Goods"),
        (CANDLES, "Candles"),
        (DICE_TRAYS, "Dice Trays"),
        (WOODWORKING, "Woodworking"),
        (LEATHER_GOODS, "Leather Goods"),
        (RESIN_CRAFTS, "Resin Crafts"),

        (NOVELS, "Novels"),
        (INDIE_AUTHORS, "Indie Authors"),
        (ZINES, "Zines"),

        (DEMOS, "Demos"),
        (WORKSHOPS, "Workshops"),
        (CUSTOM_COMMISSIONS, "Custom Commissions"),
        (STREAMING_CONTENT, "Streaming & Content Creation"),
    ]

    name = models.CharField(max_length=50, choices=TAG_CHOICES, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return dict(self.TAG_CHOICES).get(self.name, self.name)