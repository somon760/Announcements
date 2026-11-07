import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';import {resolve} from 'node:path';
import {renderMapWall,mapViewerItems} from '../review/map-wall.js';
const root=resolve(import.meta.dirname,'../review'),read=n=>JSON.parse(readFileSync(resolve(root,n),'utf8')),data=read('map-wall.json'),media=read('media.json').items,stories=read('stories.json');
assert.equal(new Set(data.maps.map(m=>m.id)).size,data.maps.length);assert.equal(new Set(data.groups.map(g=>g.id)).size,data.groups.length);
for(const map of data.maps){assert(data.groups.some(g=>g.id===map.group));assert(['dungeon','town','region','reference'].includes(map.kind));assert(map.paragraphs.length>0);if(map.media)assert(media.some(i=>i.id===map.media));if(map.story)assert(stories[map.story.chapter]?.scenes[map.story.scene-1]);for(const path of [map.url,map.thumbnail])assert(existsSync(resolve(root,path)),path);if(map.originalUrl)assert(map.originalUrl.startsWith('https://files.d20.io/'));assert(!/\bboss\b/i.test(map.paragraphs.join(' ')))}
for(const id of ['journal-497','journal-691']){const map=data.maps.find(m=>m.id===id);assert.equal(map.group,'between-adventures');assert(!map.story,'Unknown map must not gain an invented played scene')}
const html=renderMapWall(data);assert.equal((html.match(/data-map-entry=/g)??[]).length,data.maps.length);assert(!html.includes('undefined'));assert.equal((html.match(/<h1>/g)??[]).length,1);
const viewer=mapViewerItems(data,media);assert.equal(viewer.length,data.maps.length);for(const item of viewer){assert(item.kind==='image');assert(item.dates);assert(item.mapContext.title&&item.mapContext.paragraphs.length>0)}
console.log(`Map wall: ${data.maps.length} maps and versions in ${data.groups.length} groups; all images, scene links, reference qualifications and viewer records passed.`);
