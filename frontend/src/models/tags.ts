export type TagName =
  | "board_games"
  | "card_games"
  | "roleplaying_games"
  | "miniatures"
  | "wargames"
  | "game_accessories"
  | "dice"
  | "game_mats"
  | "larp_gear"
  | "art"
  | "prints"
  | "original_artwork"
  | "comics"
  | "fantasy_art"
  | "3d_printing"
  | "sculptures"
  | "fan_art"
  | "tshirts"
  | "cosplay"
  | "pins_patches"
  | "jewelry"
  | "hats_headwear"
  | "bags"
  | "handmade_goods"
  | "candles"
  | "dice_trays"
  | "woodworking"
  | "leather_goods"
  | "resin_crafts"
  | "novels"
  | "indie_authors"
  | "zines"
  | "demos"
  | "workshops"
  | "custom_commissions"
  | "streaming_content";

export const TAG_DISPLAY_NAMES: Record<TagName, string> = {
  board_games: "Board Games",
  card_games: "Card Games",
  roleplaying_games: "Roleplaying Games",
  miniatures: "Miniatures",
  wargames: "Wargames",
  game_accessories: "Game Accessories",
  dice: "Dice",
  game_mats: "Game Mats",
  larp_gear: "LARP Gear",

  art: "Art",
  prints: "Prints",
  original_artwork: "Original Artwork",
  comics: "Comics",
  fantasy_art: "Fantasy Art",
  "3d_printing": "3D Printing",
  sculptures: "Sculptures",
  fan_art: "Fan Art",

  tshirts: "T-Shirts",
  cosplay: "Cosplay",
  pins_patches: "Pins & Patches",
  jewelry: "Jewelry",
  hats_headwear: "Hats & Headwear",
  bags: "Bags",

  handmade_goods: "Handmade Goods",
  candles: "Candles",
  dice_trays: "Dice Trays",
  woodworking: "Woodworking",
  leather_goods: "Leather Goods",
  resin_crafts: "Resin Crafts",

  novels: "Novels",
  indie_authors: "Indie Authors",
  zines: "Zines",

  demos: "Demos",
  workshops: "Workshops",
  custom_commissions: "Custom Commissions",
  streaming_content: "Streaming & Content Creation",
};

// Optional: Display name mapping
export const TAG_DISPLAY_NAMES_EXTENDED: Record<TagName | "no_tag", string> = {
  ...TAG_DISPLAY_NAMES,
  no_tag: "No Tags",
};

export const TAG_NAMES: (TagName | "no_tag")[] = Object.keys(TAG_DISPLAY_NAMES_EXTENDED).sort(
  (a, b) =>
    TAG_DISPLAY_NAMES_EXTENDED[a as keyof typeof TAG_DISPLAY_NAMES_EXTENDED].localeCompare(
      TAG_DISPLAY_NAMES_EXTENDED[b as keyof typeof TAG_DISPLAY_NAMES_EXTENDED]
    )
) as (TagName | "no_tag")[];