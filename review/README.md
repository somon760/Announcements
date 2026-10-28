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
recorded actions. The twelve narrated chapters contain 28 such notes.

The Sleeper detour includes the party’s eighth-level Brindinford flashback and
return fifty years beyond its original time, as confirmed by Boss. The final
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

Battle tallies use a selected single log snapshot per scope. The identified-ant
subset has 23 foes/swarm units shared by both companies; the corroborated Bastion
subset has 10 foes for Team Biscuit. Neither is a lifetime tally or personal kill
count. Swarms count as one log unit. Do not sum backups, multiply these shared
figures by companions, count corrected kills, or promote automated PC death
messages into permanent-death statistics. Team Gravy's numeric sheets are not
established by the captured biographies; missing figures remain omitted.


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
