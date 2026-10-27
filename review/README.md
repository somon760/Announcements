# Team Biscuit showcase

Public, static retrospective at `/review/`. `index.html`, `showcase.css`, and
`showcase.js` render the timeline and hash-routed chapter galleries.
`chapters.json` contains chronology notes and cover credits; `media.json` contains
only the 312 selected memories, with original source dates and public media URLs.

- 253 images, 59 films. Previously excluded assets remain excluded.
- 198 local images and 20 local/Desktop films are hosted as web copies here.
- Dropbox's 37 published films remain in Dropbox; only their posters are hosted.
- Roll20 images have cached copies; its two selected video URLs remain remote.
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
The report in staging must show 312 items and zero errors before publishing.

Use `npm run dev` for local static-site preview. `npm run build` validates and
copies the whole site to dist. GitHub Pages publishes the main branch root.
