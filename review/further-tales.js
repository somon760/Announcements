const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paragraphs = values => (values ?? []).map(value => `<p>${escape(value)}</p>`).join('');
const sceneLink = link => `<a data-story-link href="#/${escape(link.chapter)}/scene/${Number(link.scene)}">${escape(link.label)} ↗</a>`;
const links = values => values?.length ? `<nav class="tale-links" aria-label="Continue in the chapters">${values.map(sceneLink).join('')}</nav>` : '';
const revisionist = () => '<p class="tale-revisionist">Revisionist · Hindsight</p>';
const personLink = person => `<a href="#/companions/${escape(person.slug)}">${escape(person.name)} ↗</a>`;

function illustration(reference, context, className='') {
  if (!reference) return '';
  let image;
  if (reference.src) image=reference;
  else if (reference.media) {
    const item=context.items.find(item=>item.id===reference.media);
    if(item) image={src:item.kind==='image'?item.url:item.thumbnail,alt:`${item.kind==='video'?'Campaign film still: ':''}${context.assetStories[item.id]?.title??item.name}`};
  } else if (reference.person) {
    const person=context.people.find(person=>person.slug===reference.person);
    if(person) image={src:person.token,alt:`${person.name}’s original campaign token`};
  } else image=context.stories[reference.chapter]?.scenes?.[reference.scene-1]?.image;
  return image ? `<figure class="tale-art ${className}"><img src="${escape(image.src)}" alt="${escape(image.alt)}" loading="lazy">${image.caption?`<figcaption>${escape(image.caption)}</figcaption>`:''}</figure>` : '';
}

function cards(data, context) {
  return `<div class="tale-destinations">${data.sections.map((section,index)=>`<a class="tale-destination" href="#/further-tales/${escape(section.slug)}">${illustration(section.image,context)}<div><p class="eyebrow">${String(index+1).padStart(2,'0')} · ${escape(section.eyebrow)}</p><h2>${escape(section.title)}</h2><p>${escape(section.description)}</p><span class="tale-read">Open the tale ↗</span></div></a>`).join('')}</div>`;
}

function threads(data, context) {
  return `<nav class="tale-jumps" aria-label="Choose a thread">${data.threads.map(thread=>`<a data-story-link href="#/further-tales/threads-of-fate/${escape(thread.id)}">${escape(thread.title)} ↓</a>`).join('')}</nav>${data.threads.map(thread=>`<section class="fate-thread" id="tale-${escape(thread.id)}" tabindex="-1"><header class="tale-split"><div><p class="eyebrow">Across the adventures</p><h2>${escape(thread.title)}</h2><p>${escape(thread.intro)}</p></div>${illustration(thread.image,context)}</header><ol class="fate-steps">${thread.nodes.map((node,index)=>`<li><span class="fate-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span>${node.revisionist?revisionist():''}<h3>${escape(node.title)}</h3><p>${escape(node.text)}</p>${sceneLink(node.link)}</li>`).join('')}</ol></section>`).join('')}`;
}

function twentyYears(data, context) {
  return `<p class="tale-lead">The dream returned them to their eighth-level lives. The escape carried them twenty years beyond the present they had left.</p><ol class="missing-years">${data.years.map((stage,index)=>`<li id="tale-${escape(stage.id)}" tabindex="-1"><span class="year-marker" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><div>${stage.revisionist?revisionist():''}<h2>${escape(stage.title)}</h2>${paragraphs(stage.paragraphs)}${links(stage.links)}</div>${illustration(stage.image,context)}</li>`).join('')}</ol><aside class="tale-distinction" aria-label="Three calamities and their causes"><h2>What each calamity left behind</h2><div class="tale-three"><div><h3>The lava</h3><p>The diverted flow led to Brindinford’s destruction and the desmodu’s extinction during the missing years.</p></div><div><h3>Pengu</h3><p>The spirit drained magic. After the northern ritual and defeat, magic began its gradual recovery.</p></div><div><h3>Ashardalon</h3><p>The dragon consumed unborn souls. The vision’s twenty-year famine remained unresolved as the company returned to the Bastion.</p></div></div></aside>`;
}

function treasury(data, context) {
  return `<div class="treasury-tools"><div class="tale-filters" aria-label="Treasury categories">${[['all','All possessions'],['weapons','Weapons'],['arcana','Arcana'],['keepsakes','Keepsakes']].map(([key,label])=>`<button type="button" data-treasury-group="${key}" aria-pressed="${key==='all'}">${label}</button>`).join('')}</div><p id="treasury-count" role="status">${data.treasury.length} histories</p></div><div class="treasury-grid">${data.treasury.map(item=>`<article class="treasury-entry" data-treasury-entry="${escape(item.group)}" id="tale-${escape(item.id)}" tabindex="-1">${illustration(item.image,context)}<div class="treasury-copy"><p class="tale-status">${escape(item.status)}</p><h2>${escape(item.title)}</h2>${paragraphs(item.paragraphs)}${links(item.links)}${item.id==='small-things'?'<nav class="tale-links" aria-label="Personal inventories"><a href="#/companions/thunder/inventory">Thunder’s inventory ↗</a><a href="#/companions/terry/inventory">Terry’s inventory ↗</a><a href="#/companions/grim/inventory">Grim’s inventory ↗</a></nav>':''}</div></article>`).join('')}</div>`;
}

function leftBehind(data, context) {
  return `<p class="tale-lead">The road to the Bastion left companions on other planes, a letter in an empty room and gifts beside an unexplained departure. These are their last established appearances.</p><div class="farewell-list">${data.leftBehind.map(entry=>`<article class="farewell-entry" id="tale-${escape(entry.id)}" tabindex="-1"><div class="farewell-copy">${entry.revisionist?revisionist():''}<p class="tale-status">${escape(entry.status)}</p><h2>${escape(entry.title)}</h2>${paragraphs(entry.paragraphs)}${entry.people?`<nav class="gravy-farewell" aria-label="Team Gravy companions">${entry.people.map(slug=>context.people.find(person=>person.slug===slug)).map(person=>`<a href="#/companions/${escape(person.slug)}"><img src="${escape(person.token)}" alt="" loading="lazy"><span>${escape(person.shortName)}</span></a>`).join('')}</nav>`:''}${links(entry.links)}</div>${illustration(entry.image,context)}</article>`).join('')}</div>`;
}

function filmButton(id, context, compact=false) {
  const item=context.items.find(item=>item.id===id);
  if(!item) return '';
  const title=context.assetStories[id]?.title??item.name;
  return `<button type="button" class="tale-film${compact?' compact':''}" data-tale-film="${escape(id)}" aria-label="Play ${escape(title)}"><span class="tale-film-poster"><img src="${escape(item.thumbnail)}" alt="" loading="lazy"><span aria-hidden="true">▶</span></span><span>${escape(title)}<small>Campaign film · Play</small></span></button>`;
}

function voices(data, context) {
  return `<p class="tale-lead">Four quotations typed in the Roll20 chat, with their original wording. The films are separate campaign pieces, not recordings or transcriptions of these lines.</p><div class="table-voices">${data.quotes.map(quote=>{
    const person=context.people.find(person=>person.slug===quote.speaker);
    return `<article class="table-voice"><header><img src="${escape(person.token)}" alt="" loading="lazy"><div><p class="eyebrow">Typed at the table · ${escape(person.shortName)}</p><h2>${escape(quote.title)}</h2></div></header><blockquote><p>${escape(quote.quote)}</p><cite>${escape(person.name)}</cite></blockquote><p>${escape(quote.context)}</p>${links([quote.link])}${quote.film?filmButton(quote.film,context,true):''}</article>`;
  }).join('')}</div><section class="tale-film-collection"><p class="eyebrow">From the campaign’s films</p><h2>Familiar faces, moving again.</h2><p>Ernie’s gesture, Eco’s doorway and Pengu’s address, preserved with their chapter contexts. Open a film to read the story beside it.</p><div class="tale-films">${data.films.map(id=>filmButton(id,context)).join('')}</div></section>`;
}

function epilogues(data, context) {
  const ending=data.epilogues;
  return `<div class="tale-lead">${paragraphs(ending.intro)}</div><section class="epilogue-reckoning"><p class="eyebrow">The final reckoning · Outcome not yet recorded</p><h2>At the dragon’s heart</h2><div class="tale-three">${ending.company.map(entry=>`<article><h3>${escape(entry.title)}</h3><p>${escape(entry.text)}</p></article>`).join('')}</div><a class="tale-read" href="#/bastion/scene/14">Return to the last recorded approach ↗</a></section><section class="epilogue-characters"><h2>Eight lives beyond the last page</h2><div class="epilogue-grid">${ending.characters.map(entry=>{
    const person=context.people.find(person=>person.slug===entry.person);
    return `<article id="tale-${escape(entry.person)}" tabindex="-1"><img src="${escape(person.token)}" alt="" loading="lazy"><p class="eyebrow">${escape(person.company)} · Open ending</p><h3>${escape(person.name)}</h3><p>${escape(entry.text)}</p>${personLink(person)}</article>`;
  }).join('')}</div></section><section class="epilogue-threads"><h2>What the final battle may leave unfinished</h2><div class="tale-two">${ending.looseEnds.map(entry=>`<article><h3>${escape(entry.title)}</h3><p>${escape(entry.text)}</p><a href="${escape(entry.href)}">Follow this thread ↗</a></article>`).join('')}</div></section><div class="unwritten-page"><p class="eyebrow">Reserved for the GM’s final account</p><h2>What happened next.</h2><p>The company’s choices, the fate of the souls and the companions’ own endings will take their place here when they are known.</p></div>`;
}

const renderers={'threads-of-fate':threads,'twenty-years':twentyYears,treasury,'those-left-behind':leftBehind,voices,epilogues};

export function renderFurtherTales(data, section, context) {
  const selected=data.sections.find(entry=>entry.slug===section);
  if(section&&!selected) return '<section class="section"><h1>That tale wandered off.</h1><a href="#/further-tales">Return to Further Tales →</a></section>';
  const title=selected?.title??'Further Tales';
  const nav=`<nav class="tales-navigation" aria-label="Further Tales"><a href="#/further-tales"${!section?' aria-current="page"':''}>All tales</a>${data.sections.map(entry=>`<a href="#/further-tales/${escape(entry.slug)}"${entry.slug===section?' aria-current="page"':''}>${escape(entry.title)}</a>`).join('')}</nav>`;
  const index=selected?data.sections.indexOf(selected):-1;
  return `<div class="chapter-top"><a href="${selected?'#/further-tales':'#/'}">← ${selected?'All Further Tales':'Team Biscuit home'}</a></div><header class="section tales-heading"><p class="eyebrow">${escape(selected?.eyebrow??'Across the whole campaign')}</p><h1>${escape(title)}</h1><p>${escape(selected?.description??'Follow a possession through several adventures, revisit the world the company missed, and hear the companions in their own words. Revisionist passages reveal connections they did not know at the time.')}</p></header>${nav}<article class="section further-tales ${selected?'tales-'+escape(section):'tales-index'}">${selected?renderers[section](data,context):cards(data,context)}</article><nav class="chapter-pagination" aria-label="Continue through the tales">${index>0?`<a href="#/further-tales/${escape(data.sections[index-1].slug)}"><small>Previous tale</small>← ${escape(data.sections[index-1].title)}</a>`:'<a href="#/timeline"><small>The adventures</small>← Return to the journey</a>'}${index>=0&&index<data.sections.length-1?`<a href="#/further-tales/${escape(data.sections[index+1].slug)}"><small>Next tale</small>${escape(data.sections[index+1].title)} →</a>`:'<a href="#/companions"><small>The eight companions</small>Return to the companions →</a>'}</nav>`;
}

export function bindFurtherTales(main, openFilm) {
  main.querySelectorAll('[data-treasury-group]').forEach(button=>button.addEventListener('click',()=>{
    const group=button.dataset.treasuryGroup;
    main.querySelectorAll('[data-treasury-group]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
    let count=0;
    main.querySelectorAll('[data-treasury-entry]').forEach(card=>{card.hidden=group!=='all'&&card.dataset.treasuryEntry!==group;if(!card.hidden)count++});
    main.querySelector('#treasury-count').textContent=`${count} ${count===1?'history':'histories'}`;
  }));
  main.querySelectorAll('[data-tale-film]').forEach(button=>button.addEventListener('click',()=>openFilm(button.dataset.taleFilm)));
}

export function renderTalesCallout() {
  return '<section class="section tales-callout"><div><p class="eyebrow">05 — Further Tales</p><h2>The threads between<br>the adventures.</h2><p>Follow Xanthar’s borrowed face, the weapons’ grievance and the twenty years the company missed. Revisit old companions, hear words from the table and turn towards the unwritten epilogues.</p><a class="solid-link" href="#/further-tales">Explore Further Tales ↗</a></div><nav aria-label="Featured Further Tales"><a href="#/further-tales/threads-of-fate"><span>01</span> Threads of Fate ↗</a><a href="#/further-tales/twenty-years"><span>02</span> The Twenty Years We Lost ↗</a><a href="#/further-tales/treasury"><span>03</span> The Treasury ↗</a></nav></section>';
}

const chapterTales={
  'deep-horizon':[['threads-of-fate/lava','The village they saved'],['twenty-years','The missing twenty years']],
  'writhe-below':[['threads-of-fate/xanthar','Xanthar’s borrowed face']],
  'white-plume':[['twenty-years','The world beyond the dream'],['treasury','The weapons’ histories']],
  frostmaiden:[['threads-of-fate/weapons','The sacrifice and its witnesses'],['threads-of-fate/magic','Magic and the soul famine']],
  'fungal-bloom':[['threads-of-fate/two-companies','Where the companies parted'],['those-left-behind/gravy','Team Gravy’s last known destination']],
  bastion:[['those-left-behind','Friends beyond the last door'],['epilogues','The unwritten epilogues']]
};

export function renderChapterTales(slug) {
  const related=chapterTales[slug];
  return related?`<aside class="chapter-tales" aria-label="Across the campaign"><p class="eyebrow">Across the campaign · Further Tales</p><nav>${related.map(([href,label])=>`<a href="#/further-tales/${escape(href)}">${escape(label)} ↗</a>`).join('')}</nav></aside>`:'';
}
