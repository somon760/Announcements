const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const paragraphs = values => (values ?? []).map(value => `<p>${escape(value)}</p>`).join('');

const hindsight = notes => (notes ?? []).map(note => `<aside class="story-hindsight" aria-label="Hindsight">
  <p class="hindsight-label">Hindsight</p><h4>${escape(note.title)}</h4>${paragraphs(note.paragraphs)}
</aside>`).join('');

export function renderStory(story) {
  if (!story) return '';
  const scenes = (story.scenes ?? []).map((scene,index) => `<section id="story-scene-${index+1}" tabindex="-1" class="story-scene${scene.image ? ' story-scene-illustrated' : ''}">
    <div class="story-prose"><h3>${escape(scene.title)}</h3>${paragraphs(scene.paragraphs)}${hindsight(scene.hindsight)}</div>
    ${scene.image ? `<figure class="story-illustration"><img src="${escape(scene.image.src)}" alt="${escape(scene.image.alt)}"${scene.image.width&&scene.image.height?` width="${Number(scene.image.width)}" height="${Number(scene.image.height)}"`:""} loading="lazy"><figcaption>${escape(scene.image.caption)}</figcaption></figure>` : ''}
  </section>`).join('');
  const companions = story.companions ? `<section class="story-companions" aria-label="The companions">
    <h3>${escape(story.companions.title)}</h3><div class="story-companion-grid">${story.companions.people.map(person => `<article class="story-companion">
      ${person.portrait ? `<img src="${escape(person.portrait)}" alt="${escape(person.alt)}" loading="lazy">` : ''}<h4>${escape(person.name)}</h4><p>${escape(person.text)}</p>${paragraphs(person.paragraphs)}
    </article>`).join('')}</div>
  </section>` : '';
  return `<article class="chapter-story" aria-label="The story of this adventure">
    <header class="story-opening story-prose"><p class="eyebrow">${escape(story.eyebrow ?? 'The tale of Team Biscuit')}</p><h2>${escape(story.title)}</h2>${paragraphs(story.opening)}</header>
    ${scenes}${companions}
    ${story.closing ? `<footer class="story-closing story-prose"><h3>${escape(story.closing.title)}</h3>${paragraphs(story.closing.paragraphs)}</footer>` : ''}
  </article>`;
}
