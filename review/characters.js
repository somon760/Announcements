import { renderCompanyHonours } from './battles.js?v=battle-chronicle-2';
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));
const prose = values => values.map(value => `<p>${escape(value)}</p>`).join('');
const profileUrl = person => `#/companions/${person.slug}`;
const numbered = value => new Intl.NumberFormat('en').format(value);
const statBlock = (sheet, label) => `${sheet.metrics.length ? `<dl class="character-stat-grid" aria-label="${escape(label)} statistics">${sheet.metrics.map(([name,value]) => `<div><dt>${escape(name)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>` : ''}
  ${sheet.abilities.length ? `<dl class="ability-scores" aria-label="${escape(label)} ability scores">${sheet.abilities.map(([name,value]) => `<div><dt>${escape(name)}</dt><dd>${Number(value)}</dd></div>`).join('')}</dl>` : ''}
  ${sheet.saves?.length ? `<div class="signature-skills"><h4>Saving throws</h4><dl>${sheet.saves.map(([name,value]) => `<div><dt>${escape(name)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl></div>` : ''}
  ${sheet.skills.length ? `<div class="signature-skills"><h4>Skills</h4><dl>${sheet.skills.map(([name,value]) => `<div><dt>${escape(name)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl></div>` : ''}`;

function statistics(person) {
  const stats = person.statistics;
  if (!stats) return '';
  return `<section id="character-statistics" tabindex="-1" class="character-section">
    <p class="eyebrow">The character at the table</p><h2>In numbers.</h2><p class="character-stat-note">${escape(stats.intro)}</p>
    ${stats.metrics.length ? `<h3 class="sheet-snapshot-heading">Latest available sheet · 1 September 2026</h3>${statBlock(stats, 'Latest sheet')}` : ''}
    ${stats.journalSnapshot ? `<div class="battle-snapshot"><h3 class="sheet-snapshot-heading">At the Bastion</h3><p class="character-stat-note">${escape(stats.journalSnapshot.intro)}</p><dl class="character-stat-grid" aria-label="Bastion battle snapshot">${stats.journalSnapshot.metrics.map(([name,value]) => `<div><dt>${escape(name)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl></div>` : ''}
    <div class="leveling-record"><h3>Levels &amp; earned experience</h3><p>${escape(stats.leveling)}</p>
      ${stats.awards.length ? `<table class="character-record-table"><caption>Recorded personal adventure awards</caption><thead><tr><th scope="col">Adventure</th><th scope="col">Bonus XP</th></tr></thead><tbody>${stats.awards.map(([name,value]) => `<tr><th scope="row">${escape(name)}</th><td>${numbered(value)}</td></tr>`).join('')}</tbody></table><p class="character-stat-note">${escape(stats.awardsNote)}</p>` : ''}
    </div>
  </section>`;
}


function possessions(person) {
  return `${person.inventory ? `<section id="character-inventory" tabindex="-1" class="character-section"><p class="eyebrow">Steel, keepsakes &amp; small eccentricities</p><h2>Inside the pack.</h2><p class="character-stat-note">Distinctive belongings from the character’s sheets, biography and adventures. A remembered possession is not a guarantee that it was carried or attuned at every point in the journey.</p>${person.inventoryNote ? `<p class="character-stat-note">${escape(person.inventoryNote)}</p>` : ''}<dl class="character-possession-list">${person.inventory.map(item => `<div><dt>${escape(item.name)}</dt><dd>${escape(item.text)}</dd></div>`).join('')}</dl></section>` : ''}
    ${person.traits ? `<section id="character-traits" tabindex="-1" class="character-section"><p class="eyebrow">Habits, talents &amp; contradictions</p><h2>Distinctly ${escape(person.shortName)}.</h2><dl class="character-trait-list">${person.traits.map(trait => `<div><dt>${escape(trait.name)}</dt><dd>${escape(trait.text)}</dd></div>`).join('')}</dl></section>` : ''}`;
}

export function renderCompanions(people) {
  return `<article class="companions-index">
    <header class="section companions-intro"><p class="eyebrow">The people who made the tale</p>
      <h1>Eight lives.<br><em>One tangled story.</em></h1>
      <p>Before the dragons, the broken cities and the roads between worlds, there were people with reasons to leave home. Meet the two companies: their beginnings, their changing gifts, and the secrets waiting behind their adventures.</p>
      <p class="revisionist-key"><strong>Revisionist</strong> notes open the curtain on hidden history or offer a retrospective reading of an arc. They do not give a character knowledge they never had. Unanswered mysteries remain unanswered.</p>
      <nav class="company-jump" aria-label="Choose a company"><a href="#/companions/team-biscuit">Team Biscuit ↓</a><a href="#/companions/team-gravy">Team Gravy ↓</a></nav>
    </header>
    ${['Team Biscuit', 'Team Gravy'].map((company, index) => `<section id="${index ? 'team-gravy' : 'team-biscuit'}" tabindex="-1" class="section company-section">
      <div class="section-intro"><div><p class="eyebrow">${index ? 'The other company' : 'The familiar four'}</p><h2>${company}</h2></div><p>${index ? 'An expedition through the fungal dark, a falling boat, and a fight alongside Team Biscuit in sunken Brindinford—before the Wrinkle’s trap left all four lost in Hell.' : 'From the Citadel to the Bastion: a soldier, a scholar, a priest and a performer, carrying more history than they first understood.'}</p></div>
      <div class="companion-cards">${people.filter(person => person.company === company).map(person => `<a class="companion-card" href="${profileUrl(person)}">
        <img src="${escape(person.portrait)}" alt="${escape(person.portraitAlt)}" loading="lazy" width="300" height="300">
        <div><p class="eyebrow">${escape(person.facts[0][1])} · ${escape(person.facts[1][1])}</p><h3>${escape(person.name)}</h3><p>${escape(person.summary)}</p><span class="explore">Read ${escape(person.shortName)}’s story ↗</span></div>
      </a>`).join('')}</div>
    </section>`).join('')}
    <nav class="chapter-pagination" aria-label="Return to the campaign"><a href="#/timeline">← Follow the adventures</a><a href="#/between-adventures">Between adventures →</a></nav>
  </article>`;
}

export function renderCharacter(person, people, chapters, battles) {
  const index = people.indexOf(person);
  const sameArtwork = person.portrait === person.token;
  const chapterLink = step => {
    const chapter = chapters.find(chapter => chapter.slug === step.chapter);
    return chapter ? `<a href="#/${escape(chapter.slug)}${step.scene ? `/scene/${Number(step.scene)}` : ''}">In the tale: ${escape(chapter.title)} ↗</a>` : '';
  };
  return `<article class="character-profile">
    <div class="chapter-top"><a href="#/companions">← All companions</a><span aria-hidden="true"> / </span><a href="#/companions/${person.company === 'Team Biscuit' ? 'team-biscuit' : 'team-gravy'}">${escape(person.company)}</a></div>
    <header class="character-hero">
      <figure class="character-portrait"><img src="${escape(person.portrait)}" alt="${escape(person.portraitAlt)}" width="420" height="420" fetchpriority="high"><figcaption>${sameArtwork ? 'The original campaign portrait token' : 'The campaign journal portrait'}</figcaption></figure>
      <div><p class="eyebrow">${escape(person.company)} · A life in the company</p><h1>${escape(person.name)}</h1><p class="character-title">${escape(person.title)}</p><p class="character-deck">${escape(person.summary)}</p>
        <dl class="character-facts">${person.facts.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>
        <nav class="profile-jump" aria-label="Within this character’s story"><a href="#/companions/${person.slug}/beginnings">Beginnings</a><a href="#/companions/${person.slug}/statistics">In numbers</a><a href="#/companions/${person.slug}/progression">The road</a><a href="#/companions/${person.slug}/battles">Battle record</a><a href="#/companions/${person.slug}/inventory">Inventory</a><a href="#/companions/${person.slug}/traits">Traits</a><a href="#/companions/${person.slug}/revisionist">Revisionist</a><a href="#/companions/${person.slug}/portraits">Portraits &amp; tokens</a></nav>
      </div>
    </header>
    <div class="character-reading">
      <section id="character-beginnings" tabindex="-1" class="character-section story-prose"><p class="eyebrow">Before the company</p><h2>Where the road began.</h2>${prose(person.backstory)}</section>
      ${statistics(person)}
      <section id="character-progression" tabindex="-1" class="character-section"><p class="eyebrow">A life in motion</p><h2>What the journey made.</h2><ol class="character-milestones">${person.progression.map(step => `<li><h3>${escape(step.title)}</h3><p>${escape(step.text)}</p>${chapterLink(step)}</li>`).join('')}</ol></section>
      ${renderCompanyHonours(person,battles,chapters)}
      <section class="character-section"><p class="eyebrow">Gifts, keepsakes &amp; burdens</p><h2>What they carried.</h2><div class="character-gifts">${person.gifts.map(gift => `<section><h3>${escape(gift.name)}</h3><p>${escape(gift.text)}</p></section>`).join('')}</div></section>
      ${possessions(person)}
      <section id="character-revisionist" tabindex="-1" class="character-section"><p class="eyebrow">Behind the tale</p><h2>What the road concealed.</h2><p class="revisionist-explainer">These notes speak from beyond the character’s viewpoint. Hidden history reveals a cause or design; a retrospective reading offers an interpretation. Unfinished endings still have room to be written.</p>${person.revisionist.map(note => `<aside class="character-revisionist" aria-label="Revisionist: ${escape(note.kind)}"><p class="eyebrow">Revisionist · ${escape(note.kind)}</p><h3>${escape(note.title)}</h3>${prose(note.paragraphs)}</aside>`).join('')}</section>
      <section class="character-section story-prose"><p class="eyebrow">Threads still loose</p><h2>The unwritten pages.</h2>${prose(person.unfinished)}</section>
      <section id="character-portraits" tabindex="-1" class="character-section"><p class="eyebrow">Faces from the table</p><h2>Portraits &amp; tokens.</h2><div class="character-art">
        <figure><a href="${escape(person.portrait)}" target="_blank" rel="noopener"><img src="${escape(person.portrait)}" alt="${escape(person.portraitAlt)}" loading="lazy" width="300" height="300"></a><figcaption>${sameArtwork ? 'The journal uses this same original artwork as its portrait and token. Open the image ↗' : 'The campaign journal portrait. Open the image ↗'}</figcaption></figure>
        ${sameArtwork ? '' : `<figure><a href="${escape(person.token)}" target="_blank" rel="noopener"><img class="map-token" src="${escape(person.token)}" alt="${escape(person.tokenAlt)}" loading="lazy" width="200" height="200"></a><figcaption>The original map token, with its campaign border. Open the token ↗</figcaption></figure>`}
        ${person.memories.map(image => `<figure><a href="${escape(image.src)}" target="_blank" rel="noopener"><img src="${escape(image.src)}" alt="${escape(image.alt)}" loading="lazy" width="300" height="300"></a><figcaption>${escape(image.caption)}</figcaption></figure>`).join('')}
      </div></section>
    </div>
    <nav class="chapter-pagination" aria-label="Other companions">${index > 0 ? `<a href="${profileUrl(people[index - 1])}"><small>Previous companion</small>← ${escape(people[index - 1].name)}</a>` : '<a href="#/companions"><small>The two companies</small>← All companions</a>'}${index < people.length - 1 ? `<a href="${profileUrl(people[index + 1])}"><small>Next companion</small>${escape(people[index + 1].name)} →</a>` : '<a href="#/companions"><small>The two companies</small>All companions →</a>'}</nav>
  </article>`;
}
