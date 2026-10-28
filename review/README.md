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

All twelve adventures/interludes now have narrated treatments in `stories.json`: 85
scenes through the return to Bastion and its later recorded fighting. The northern
account includes Frostblight, the Red Keep/Reclamation, and the demon army. Bastion
adds Windglum, Eco and Desayeus, Findula’s farewell, Ernie’s return and protective
rings, and the fight towards Ashardalon. The unplayed final confrontation and
epilogues deliberately remain open for the GM’s later outcome. Galleries and the
ordered bottom navigation are preserved.

Scenes may include a `hindsight` array of `{title, paragraphs}` notes. These render
as visible, labelled retrospective asides within the story, using the same palette.
They reveal hidden motives and later connections without changing the party’s
recorded actions. The twelve narrated chapters contain 26 such notes.

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
