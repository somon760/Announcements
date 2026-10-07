# Castle Naerytar — Second Floor CIO Manifest

## Current package

- Authoritative import data: `CastleNaerytar_SecondFloor_CheckItOut.json`.
- Overlay: `CastleNaerytar_SecondFloor_CIO_Overlay.png`.
- Source map: user-supplied Castle Naerytar Level 2 map image.
- Area descriptions: user-supplied Second Floor HTML source.
- CIO behavior and importer format: local `Check It Out.js` and `CheckItOutImporter.js` in the Roll20 repository.

## Placement basis

- JSON coordinate space: `image-pixels`.
- Source/overlay dimensions: `1120 × 1435` px.
- Scale: `1 × 1` in the overlay coordinate space; the importer scales to the target Roll20 page.
- Anchor: `top-left`.
- Standard grid reference: `35` px per 5 ft.
- Room regions are rectangular approximations of the visible map interiors. Detail regions use the authored JSON bounding boxes.
- The JSON is authoritative for exact coordinates, regions, image URLs, container mechanics, and inventory.

## Area coverage

The current JSON contains 17 room entries and 30 inspectable detail entries. Door-frame/door detail entries for 2I and 2J, plus the 2K spiked trapdoor, were intentionally removed from CIO.

- **2A Upper Barbican:** Signal Drum; Battlement Stone Piles; Muddy Footprints.
- **2E Northwest Tower Room:** Rotted Floorboards; Exposed Beams; Locked Trunk; Stair Landing and Trapdoor; Faint Chalk Warning.
- **2F Stables Loft:** Stored Reeds.
- **2G Upper Barracks:** Chained Chest; Reed Pallets and Baskets.
- **2H Arsenal:** Ruined Weapon Racks; Warped Arrows and Brittle Armor.
- **2I Northeast Tower Room I:** room entry only.
- **2J Northeast Tower Room J:** room entry only.
- **2K Northeast Tower Room K:** room entry only; the spiked trapdoor is handled as a GM-only locked teleport note.
- **2L Outer Library:** Book Crates and Chests.
- **2M Reading Room:** Reading Table; Pair of Chairs.
- **2N Library:** Salvaged Book Shelves; Books and Manuscripts.
- **2P Kitchen Storage:** Stored Provisions.
- **2R Cultists’ Sleeping Chamber:** Reed Mattresses and Trunks.
- **2T Cultists’ Sleeping Chamber:** Small Stone Hearth; Reed Mattresses and Trunks.
- **2U Common Room:** Writing Desk; Padded Chair and Bench; Small Hearth.
- **2V Sleeping Room:** Bed and Rugs; Washstand and Grooming Things; Large Cage; Strongbox Beneath Rug.
- **2W Dressing Room:** Floor Rug.

## Player-facing content

- Core descriptions use generic, observable environmental prose and do not expose room/area names, creature identities, encounter secrets, hidden inventories, or GM-only notes.
- Hidden clean weapons in 2H remain informational and are not player-claimable inventory; the success text is retained only behind its Investigation check.
- The 2V strongbox is represented as an Investigation DC 19 discovery, locked with Lockpicking DC 13 and Force DC 15.
- The 2E faded chalk marks retain the source-specified Perception DC 20 check; the core description does not reveal the language.
- The 2I/2J door-detail entries and their Perception checks are omitted as requested.
- The 2V cage is represented without a creature occupant entry.

## Containers and inventory

- **2E trunk:** Lockpicking DC 14; inventory includes `1825 cp`, `54 sp`, and the A5edDB `Garish Gold Earrings` Treasure record.
- **2G chained chest:** Lockpicking DC 12; inventory uses validated A5edDB currency-gem records—Opal ×1, Pearl ×3, Moonstone ×1, and Turquoise ×2—for 1,370 gp against the source’s 1,376 gp bundle value.
- `missingA5edDBItems` is empty in the JSON.

## Images and counts

- All 47 JSON entries have hosted `descriptionImage` URLs.
- `farDescriptionImage` remains blank for all entries.
- Room entries: 17.
- Inspectable detail entries: 30.
- Total CIO entries: 47.
