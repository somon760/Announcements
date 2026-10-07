import fs from 'node:fs';

const input = '/Users/madworks/Documents/GitHub/Announcements/CastleNaerytar_ThirdFloor_CheckItOut.json';
const output = '/Users/madworks/Documents/GitHub/Announcements/.codex/CastleNaerytar_ThirdFloor_CIO_Overlay.svg';
const data = JSON.parse(fs.readFileSync(input, 'utf8'));
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const pathToD = path => path.map(([command, x, y]) => `${command}${x},${y}`).join(' ');
const label = token => token.name.replace(/^Naerytar 3F — /, '');

const shapes = [];
for (const entry of data.entries) {
  const token = entry.token;
  const { left, top, region = {} } = token;
  if (entry.kind === 'room' && Array.isArray(entry.path)) {
    shapes.push(`<g class="room"><path d="${pathToD(entry.path)}" transform="translate(${left} ${top})"/><text x="${left + 8}" y="${top + 22}">${esc(label(token))}</text></g>`);
  } else {
    const width = region.width || 0;
    const height = region.height || 0;
    shapes.push(`<g class="detail"><rect x="${left}" y="${top}" width="${width}" height="${height}"/><text x="${left + 6}" y="${top + 18}">${esc(label(token))}</text></g>`);
  }
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="2240" height="2940" viewBox="0 0 2240 2940">
  <style>
    .room path { fill: #28a745; fill-opacity: .28; stroke: #087f23; stroke-width: 5; }
    .room text { fill: #075d18; font: 700 22px sans-serif; paint-order: stroke; stroke: #fff; stroke-width: 5px; }
    .detail rect { fill: #1683d8; fill-opacity: .2; stroke: #075b9d; stroke-width: 4; }
    .detail text { fill: #064a80; font: 600 16px sans-serif; paint-order: stroke; stroke: #fff; stroke-width: 4px; }
  </style>
  ${shapes.join('\n  ')}
</svg>
`;
fs.writeFileSync(output, svg);
console.log(output);
