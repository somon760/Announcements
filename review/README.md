# Team Biscuit showcase

Public, static retrospective at `/review/`. `index.html`, `showcase.css`, and
`showcase.js` render the timeline and hash-routed chapter galleries.
`stories.json` supplies the illustrated narration through `story.js`; optional companion portraits allow named rosters without invented artwork. `chapters.json` supplies the ordered journey and cover credits; main chapters and interludes share that order for both timeline cards and bottom navigation. The original main chapter numbers remain stable; interludes use I and II. `media.json` contains
only the 320 selected memories and references, with original source dates and public media URLs.

- 269 images, 51 films. Previously excluded assets remain excluded.
- Selected local images and local/Desktop films are hosted as web copies here.
- Published Dropbox films remain in Dropbox; only their posters are hosted.
- Roll20 images have cached copies; selected Roll20 video URLs remain remote.
- Images are stored in `media/images/<chapter>/`; thumbnails are stored separately.
- The date check and an image filing report explain provisional, old-source, and unresolved assignments.
- No local paths, file pickers, decision controls, or private catalog imports.
- Uncertain, conflicting, and provisional assignments go to Between Adventures.
- Module periods are resource evidence, never asserted session dates.

Rebuild media with Pillow, ffmpeg, and ffprobe:

```sh
python scripts/build_showcase.py --inventory /path/to/Team-Biscuit-Reel-Inventory
```

The builder reads only the current selected CSV/catalog and honors the permanent
exclusion list. Desktop sources are copied into the inventory's showcase-staging
folder first if OS permissions prevent direct reads. Source originals stay intact.
The selected collection currently contains 320 items. Preserve the curated chapter assignments, added module references, and portraits when rebuilding; the older inventory alone does not include these editorial additions.

Use `npm run dev` for local static-site preview. `npm run build` validates and
copies the whole site to dist. GitHub Pages publishes the main branch root.

All twelve adventures/interludes now have narrated treatments in `stories.json`: 88
scenes through the return to Bastion and its later recorded fighting. The northern
account includes Frostblight, the Red Keep/Reclamation, and the demon army. Bastion
adds Windglum, Eco and Desayeus, Findula’s farewell, Ernie’s return and protective
rings, and the fight towards Ashardalon. The unplayed final confrontation and
epilogues deliberately remain open for the GM’s later outcome. Galleries and the
ordered bottom navigation are preserved.

Scenes may include a `hindsight` array of `{title, paragraphs}` notes. These render
as visible, labelled retrospective asides within the story, using the same palette.
They reveal hidden motives and later connections without changing the party’s
recorded actions. The twelve narrated chapters contain 34 such notes.

The Sleeper detour includes the party’s eighth-level Brindinford flashback and
return twenty years beyond its original time, as confirmed by Boss. The final
Bastion destination is labelled as a return to an already-started mystery.

Four additional Bastion story illustrations are under `media/story/bastion/`; they
do not change the curated gallery manifest or its 320 selected items.

Every selected gallery asset has a short passage and a friendly title in
`asset-stories.json`, keyed by its existing media ID. These appear beneath the
memory cards and inside the viewer. Each entry links to a narrated scene using
`#/chapter-slug/scene/1`; scene numbers follow the existing `stories.json` order.
When moving or inserting scenes, update the affected asset links as well.

The 320 passages cover all 269 images and 51 films. Context can describe a recorded
moment, explain a character or place, or frame reference artwork as atmosphere;
it must not turn preparation or an illustration into an invented played event.
The curated `media.json`, chapter order, exclusions and bottom adventure links
remain unchanged. Phone galleries use one column so the passages remain readable.


The companions area (`#/companions`) has eight individual profiles at
`#/companions/shrop` through `#/companions/elira`. `characters.json` holds the
player-facing biographies, chapter-linked progression, gifts, unresolved threads,
and explicitly labelled Revisionist notes; `characters.js` renders the index and
profiles. Team jumps use `#/companions/team-biscuit` and `#/companions/team-gravy`;
profile sections use `/beginnings`, `/progression`, `/revisionist`, and `/portraits`.

Revisionist notes distinguish hidden history, hidden consequences and retrospective
readings. Interpretations are not recorded thoughts or new played events. Canonical
PC PDFs supply sheet details; the four character-journal biographies and Boss's
roster ground Team Gravy. Do not invent missing level histories, cures, patron
identities, parentage answers or final-session outcomes. Existing early portraits
remain, alongside original exported map tokens and later journal artwork.

Main navigation, the home callout and named chapter rosters link into this area.
Profiles link back to existing chapters/scenes and to neighboring companions.
The adventure order and 320-item gallery remain independent and unchanged.


Profiles now also carry optional `statistics`, `battleRecord`, `inventory` and
`traits` fields. Section links are `/statistics`, `/battles`, `/inventory` and
`/traits`. The 1 September 2026 epic export supplies the detailed character
record: Shrop 22, Grim 22, Terry Cleric 21 / Paladin 1 (22 total), Thunder 23.
Metrics, six abilities, six saving throws and eighteen skills per PC use explicit
export fields. `statistics.journalSnapshot` shows the current journal's recorded
Bastion battle defenses separately; those dashboards do not expose full sheets or
level fields. Terry's battle maximum (222) differs from the export (235), and
Grim's battle AC (21) differs from the export (18); neither is silently merged.
`statistics.previousSnapshot` retains canonical PDF figures in a collapsed panel.
No combat values or level-up dates are calculated. Personal adventure bonus awards
remain separate from cumulative XP.

The Battle Chronicle at `#/battle-chronicle` supplies every profile's Company
honours from the same `battles.json` ledger. `battleRecord.ledgerCompany` replaces
the former duplicated small tally objects. Counts are logged party kills/units,
never personal finishing blows. Shared entries appear once in all-company totals.
The complete shared Brindinford passage includes 23 identified ant units, 10
Soldier entries and 2 Shadowfang entries. Gravy's other fungal entries remain
company-unassigned until supported; no numbered PC stats are invented.


Boss’s confirmed Wrinkle split is narrated in Fungus Grotto: Xanthar tricked
Biscuit into the grotto portal and they arrived naked without gear; after the
ant battles, the hell trap intended for Biscuit caught Gravy instead. Gravy remain
lost in Hell. Biscuit continued to Windglum and the Bastion adventures; Ernie
later recovered most gear, with Whelm, Wave and Frostrazor still missing. The
trap-maker, specific Hell destination and exact mechanisms are not invented.
The character profiles and Bastion handoff preserve that distinction.

Fungal scenes 7–9 shifted to 8–10 when the new portal scene was inserted. Update
scene targets by meaning, not by an old number. The Wrinkle split is scene 11 and
the Windglum/Ernie bridge is scene 12. Journey order and bottom navigation remain.


## Battle Chronicle

`battles.js` renders the dedicated chronicle and the profile honours. Navigation
and a home-page callout link into it. Company links use
`#/battle-chronicle/company/biscuit` or `/gravy`. The explorer supports original
names or species/foe groups, company, chapter, family, name search, count/XP/name
sorting, progressive rows, variant expansion, and CSV export. Charts and counters
follow the filters. Raw GM material and private record paths are not shipped.

Build the data from the private captured records:

```sh
python3 scripts/build_battle_chronicle.py --knowledge-base /absolute/path/to/team-biscuit-knowledgebase
python3 scripts/test_battle_chronicle.py
node scripts/test_battle_chronicle.mjs
```

The builder writes a private SQLite event/observation ledger and review record
inside that knowledge base. Public `review/battles.json` contains only selected
counted events, nonlethal entries, source links, grouping and counting notes. It
verifies ordered whole-log/prefix overlaps, preserves within-log repeated foes,
applies corrections to preceding matching awards, and audits every kill marker.
No date timeline, personal kills, complete campaign census, or finale outcome is
inferred. Named targets may repeat without establishing separate lifetimes.
Missing XP stays null; zero XP remains a known value. Two explicitly nonlethal
Blade Golem records remain outside kill totals. Unplaced chapter/company entries
remain visible rather than being assigned by campaign number or backup date.

Ledger layout: fixed desktop column widths and expandable story contexts keep
rows compact. At 700px and below, each record becomes a labelled card with its
kill and XP figures together, preserving table semantics and avoiding horizontal
scrolling. Filter controls use the same height across browsers.


Boss confirmed the Deep Horizon consequence: the Brotherhood diverted lava to
save the desmodu village. During the company’s missing twenty years, the resulting
volcanic cataclysm collapsed Brindinford and the consequences wiped out the entire
desmodu race. Deep Horizon, the Sleeper return and sunken Brindinford each carry
labelled Hindsight connecting these events. No disaster casualty count, precise
calendar year, investment payout or player knowledge at the time is inferred.
Scene order, gallery, character statistics and battle-ledger totals are unchanged.


Pengu’s loss-of-magic thread now begins with Shrop extinguishing the Nightmare
Grotto candle, follows the northward warning, arcane/divine suppression and the
Candle of the Dark One search, and reaches Frostblight and magic’s gradual
recovery. The Rigus aftermath connects ward failure to the same crisis. Shrop’s
profile includes a milestone and a labelled Revisionist consequence. The original
grotto candle and the later Candle of the Dark One are distinct; Ashardalon’s
soul predation remains a separate, continuing danger. Pengu’s egg’s later fate
and the final candle working are not invented.


Boss corrected the time jump to twenty years on 2026-10-28. The former fifty-year
wording is superseded throughout the narration, profiles and asset passages,
including the Brindinford/desmodu aftermath. The northern Dream Sequence
explicitly speaks of twenty years without new souls; the return and Bastion
frame that warning as part of the ongoing crisis. No absolute onset year or
exact total duration of Ashardalon’s residence is inferred. The current game’s
posted 1 Hammer 1407 conflicts with earlier calendar output reaching 26 Eleasis
1407; that correction remains with the GM. Player prose keeps relative chronology
and narration rather than exposing the private date audit.
