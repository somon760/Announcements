export const campaignSongs = [
  {
    id: 'hail-the-hero-of-ossington',
    title: 'Hail the Hero of Ossington',
    duration: '2:27',
    description: 'The folk-metal recording from the Bastion playlist.',
    related: {href: '#/standing-stone', label: 'The Standing Stone'}
  },
  {
    id: 'the-hero-of-ossington-dark-folk',
    title: 'The Hero of Ossington (Dark Folk)',
    duration: '1:44',
    description: 'A dark-folk telling of the Ossington ballad.',
    related: {href: '#/standing-stone', label: 'The Standing Stone'}
  },
  {
    id: 'eye-of-the-hammer',
    title: 'Eye of the Hammer',
    duration: '1:58',
    description: 'A recording preserved in the Standing Stone campaign files.',
    related: {href: '#/standing-stone', label: 'The Standing Stone'}
  },
  {
    id: 'shrops-toes-heavy-metal',
    title: 'Shrop’s Toes (Heavy Metal)',
    duration: '3:30',
    description: 'A heavy-metal song about Shrop’s toes.',
    related: {href: '#/companions/shrop', label: 'Shrop Shireslasher'}
  }
];

export function renderCampaignMusic() {
  const songs = campaignSongs.map(song => `
    <article class="campaign-song" id="song-${song.id}" tabindex="-1" aria-labelledby="title-${song.id}">
      <p class="eyebrow">${song.duration}</p>
      <h2 id="title-${song.id}">${song.title}</h2>
      <p>${song.description}</p>
      <audio controls preload="none" src="media/audio/${song.id}.mp3" aria-label="${song.title}"></audio>
      <a href="${song.related.href}">${song.related.label} ↗</a>
    </article>`).join('');
  return `<div class="chapter-top"><a href="#/">← Team Biscuit home</a><a href="#/between-adventures">Films &amp; portraits ↗</a></div>
    <header class="section recollection-heading"><p class="eyebrow">Team Biscuit · The campaign archive</p>
      <h1>Campaign Music</h1><p>Listen to the songs from the Team Biscuit audio archive.</p></header>
    <section class="section campaign-songs" aria-label="Campaign songs">${songs}</section>`;
}

export function bindCampaignMusic(main, songId) {
  const players = [...main.querySelectorAll('.campaign-song audio')];
  for (const player of players) {
    player.addEventListener('play', () => {
      for (const other of players) if (other !== player) other.pause();
    });
  }
  const song = songId && document.getElementById('song-' + songId);
  if (song) requestAnimationFrame(() => {
    song.scrollIntoView({block: 'start'});
    song.focus({preventScroll: true});
  });
  return () => players.forEach(player => player.pause());
}
