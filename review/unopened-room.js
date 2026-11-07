const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const prose = values => values.map(value => `<p>${esc(value)}</p>`).join('');

export const unopenedRoom = {
  title: 'The Room We Never Entered',
  answer: 'The chest was empty.',
  subtitle: 'Nightfang Spire · Area 12 · Necromantic Seepage',
  recollection: [
    'Near the crown of Nightfang Spire, the Brotherhood chose to leave a room unexplored. Black liquid lay across the floor. A chest waited at its southern end.',
    'The company carried on through the tower. The room remained a mystery at the table for years.'
  ],
  revelation: [
    'The danger lay across the floor: necromantic seepage, sustained by the renewed beating of Ashardalon’s preserved heart.'
  ],
  hazard: [
    'Only two inches deep, the black liquid swirled and bubbled. It was a supernatural corrosive hazard tied to the heart’s power.',
    'Contact harmed flesh, wood, parchment and even corporeal undead. The muck could spread over a victim and inflict increasing damage. Stone, crystal and metals were unaffected.',
    'Samples removed from the chamber dried within moments. A cleric’s power to turn undead could cleanse a victim or banish the pool.'
  ],
  rules: [
    'Contact dealt 1d6 damage. On subsequent rounds, a failed DC 20 Fortitude save increased the damage by 1d6, to a maximum of 10d6 per round. A successful save dried the coating.',
    'Turning a 10-HD creature and affecting at least 10 total HD cleansed a victim; the corresponding 13-HD thresholds dissipated the pool. The entry allowed no other means of destroying it.'
  ],
  images: {
    reconstruction: {src:'media/unopened-nightfang/room-reconstruction.webp', alt:'An imagined view from a dry threshold into Nightfang’s curved stone chamber, with bubbling black liquid across its floor', width:1672, height:941},
    plan: {src:'media/images/nightfang-spire/204116b0c05cac1cab27fa90.png', alt:'The original numbered Level 1 plan: area 12 occupies the narrow crescent at the eastern edge', width:1320, height:1206},
    capture: {src:'media/unopened-nightfang/roll20-room-12.jpg', alt:'Actual Roll20 map capture of area 12, showing black seepage and the small brown chest at the southern end', width:395, height:545},
    overview: {src:'media/unopened-nightfang/roll20-level-1.jpg', alt:'Actual Roll20 first-floor map, with the numbered reference plan beside it and area 12 on the eastern edge', width:480, height:470}
  }
};

function figure(image, caption, linkLabel, className='') {
  return `<figure class="unopened-figure ${className}"><a href="${esc(image.src)}" target="_blank" rel="noopener" aria-label="${esc(linkLabel)}"><img src="${esc(image.src)}" alt="${esc(image.alt)}" width="${image.width}" height="${image.height}" loading="lazy"></a><figcaption>${caption}<a href="${esc(image.src)}" target="_blank" rel="noopener">${esc(linkLabel)} ↗</a></figcaption></figure>`;
}

export function renderUnopenedRoom() {
  const room=unopenedRoom;
  return `<div class="unopened-room">
    ${figure(room.images.reconstruction,'<strong>Artistic reconstruction.</strong> An imagined view of the seepage from the threshold, based on the published room. The actual campaign map appears below.','Open the reconstruction','unopened-hero')}
    <div class="unopened-intro"><p class="eyebrow">A door left behind</p>${prose(room.recollection)}</div>
    <details class="unopened-reveal" id="unopened-reveal" tabindex="-1"><summary>Reveal what waited in the room</summary><div><p class="eyebrow">Revisionist · GM-confirmed</p><h2>${esc(room.answer)}</h2>${prose(room.revelation)}</div></details>
    <section class="unopened-explanation" aria-labelledby="unopened-hazard"><div><p class="eyebrow">${esc(room.subtitle)}</p><h2 id="unopened-hazard">What the black liquid could do</h2>${prose(room.hazard)}<details class="unopened-rules"><summary>The danger in the original rules</summary><p class="unopened-edition">From the original 2001, third-edition adventure. These mechanics belong to that edition.</p>${prose(room.rules)}</details><p><a class="unopened-map-link" href="https://online.anyflip.com/myubd/mlii/mobile/index.html" target="_blank" rel="noopener">Open the Nightfang flipbook ↗</a> Area 12 is on flipbook page 10 (printed page 8).</p></div>${figure(room.images.capture,'<strong>Actual Roll20 capture.</strong> The room marker is numbered 12. The chest lies at the southern end, below the black patches.','Open the room capture','unopened-capture')}</section>
    <section class="unopened-maps" aria-labelledby="unopened-map-heading"><header><p class="eyebrow">Back to the tower</p><h2 id="unopened-map-heading">Find the room on the plan</h2><p>Level 1 sits just below the crown. The tower’s numbered floors descend from there. Area 12 follows the curved eastern wall.</p></header><div>${figure(room.images.plan,'<strong>Original numbered plan.</strong> Area 12 is the narrow chamber along the right-hand edge. Cartography: Todd Gamble, <em>Heart of Nightfang Spire</em>, Wizards of the Coast, 2001.','Open the original plan')}${figure(room.images.overview,'<strong>The campaign’s Roll20 map.</strong> The same first floor, with the numbered reference beside it. Battlemap: Rubens Duarte.','Open the floor capture')}</div><a class="unopened-map-link" href="media/images/nightfang-spire/6301ab2a9274149dea0d5169.jpg" target="_blank" rel="noopener">Open Rubens Duarte’s full battlemap and credits ↗</a></section>
    <aside class="unopened-afterword"><p class="eyebrow">Revisionist · The heart’s reach</p><h2>A warning near the beginning</h2><p>The original adventure identifies the heart’s black fire as another form of this same seepage. The room belonged to the danger that sustained Gulthias’s cult, encountered near the top of the tower before the company reached its protected core.</p><a data-story-link href="#/nightfang-spire/scene/5">Return to the heart of Nightfang ↗</a></aside>
    <details class="unopened-sources"><summary>About this account and its images</summary><p>The company’s decision to pass the room and the empty chest are confirmed by the GM. The chamber and hazard follow Bruce R. Cordell’s <em>Heart of Nightfang Spire</em>, areas 12 and 77, printed pages 8 and 28. The actual Roll20 room marker retains the seepage description and rules.</p><p>The original plan, the campaign battlemap and the Roll20 captures are shown separately from the generated reconstruction. The reconstruction illustrates the liquid and chamber; it is not an exact rendering of every prop.</p></details>
  </div>`;
}

export function renderUnopenedRoomCallout() {
  return `<aside class="section unopened-callout"><div><p class="eyebrow">A mystery left in Nightfang</p><h2>The Room We Never Entered</h2><p>Black liquid, a chest and a doorway the Brotherhood passed by. Return to the room that remained a question for years.</p><a class="solid-link" href="#/revelations/nightfang-room">Open the room’s account ↗</a></div><img src="${unopenedRoom.images.reconstruction.src}" alt="An artistic reconstruction of Nightfang’s black-slime chamber" width="1672" height="941" loading="lazy"></aside>`;
}

export function unopenedRoomSearchText() {
  return [unopenedRoom.answer,unopenedRoom.subtitle,...unopenedRoom.recollection,...unopenedRoom.revelation,...unopenedRoom.hazard,...unopenedRoom.rules].join(' ');
}
