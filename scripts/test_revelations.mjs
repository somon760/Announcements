import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {buildSearchIndex,searchRecords,normalise,revealTruth,renderRevelations,renderRevelationsCallout,sections} from '../review/revelations.js';
const root=resolve(import.meta.dirname,'../review'),read=n=>JSON.parse(readFileSync(resolve(root,n),'utf8'));
const context={people:read('characters.json').people,items:read('media.json').items,stories:read('stories.json'),assetStories:read('asset-stories.json'),chapters:read('chapters.json'),tales:read('further-tales.json'),explorerData:read('time-and-places.json'),mapWallData:read('map-wall.json'),battles:read('battles.json'),revelations:read('revelations.json')};
const data=context.revelations;
function unique(entries){assert.equal(new Set(entries.map(x=>x.id)).size,entries.length)}
for(const entries of [data.reveals,data.chains,data.cast,data.remembrance])unique(entries);
function references(value){if(!value||typeof value!=='object')return;if(value.chapter&&value.scene){const scene=context.stories[value.chapter]?.scenes[value.scene-1];assert(scene,JSON.stringify(value));if(value.hindsight!==undefined)assert(scene.hindsight?.[value.hindsight]);if(Object.keys(value).length===2)assert(scene.image,'Illustration reference needs an image: '+JSON.stringify(value))}if(value.src)assert(existsSync(resolve(root,value.src)));if(value.person)assert(context.people.some(p=>p.slug===value.person)||data.cast.some(p=>p.id===value.person));if(value.media)assert(context.items.some(i=>i.id===value.media));for(const child of Object.values(value))references(child)}
references(data);
for(const reveal of data.reveals)assert(revealTruth(reveal,context).length>0);
const castIds=new Set(data.cast.map(n=>n.id)),edgeIds=new Set;
for(const edge of data.relationships){assert(castIds.has(edge.a)&&castIds.has(edge.b));assert.notEqual(edge.a,edge.b);const key=[edge.a,edge.b].sort().join('/');assert(!edgeIds.has(key),'Duplicate relationship');edgeIds.add(key)}
for(const node of data.cast)assert(data.relationships.some(e=>e.a===node.id||e.b===node.id),'Disconnected figure '+node.id);
assert(!data.relationships.some(e=>[e.a,e.b].includes('ernie')&&[e.a,e.b].includes('xanthar')),'Do not imply Ernie’s complicity');
for(const chain of data.chains){unique(chain.steps);assert(chain.steps.length>=3)}
assert(data.chains.find(c=>c.id==='souls').steps.at(-1).kind==='Open ending');
assert(data.remembrance.findIndex(s=>s.id==='iron')<data.remembrance.findIndex(s=>s.id==='dream'));
assert.deepEqual(data.remembrance.find(s=>s.id==='together').companions,['shrop','grim','terry','thunder','nox','brunn','rook','elira']);
assert(data.remembrance.at(-1).text.includes('await the final telling'));
const index=buildSearchIndex(context);assert.equal(new Set(index.map(r=>r.id)).size,index.length);
assert(index.filter(r=>r.category==='memories').length===context.items.length);
assert.equal(normalise('Shrooma Froboz Keruptus Brun'),'shoomma frobozz keraptis brunn');
for(const query of ['Pengu','Xanthar','Ernie','Blackrazor','Soul Totem','Brun','Shrooma','Froboz','Team Biscut','Fugus Grotto','Earnie'])assert(searchRecords(index,query).length>0,query);
assert.equal(searchRecords(index,'zzqxv-no-such-campaign-word').length,0);
assert(searchRecords(index,'empty chest').some(r=>r.href==='#/revelations/nightfang-room'));
assert(searchRecords(index,'necromantic seepage').some(r=>r.href==='#/revelations/nightfang-room'));
const roomHTML=renderRevelations(data,'nightfang-room',context);assert(roomHTML.includes('The chest was empty.'));assert(roomHTML.includes('Artistic reconstruction.'));assert(roomHTML.includes('Actual Roll20 capture.'));assert(!roomHTML.includes('saved script state'));assert(roomHTML.includes('third-edition'));assert(roomHTML.includes('#/deep-horizon'));
const poPath='#/revelations/meepo-po';
const poPage=renderRevelations(data,'meepo-po',context);
assert(poPage.includes('Revisionist · Off-screen backstory'));
assert(poPage.includes('#/sunless-citadel/scene/2')&&poPage.includes('#/bastion/scene/11'));
assert(searchRecords(index,'Sarka receipt').some(r=>r.href===poPath+'/3'));
assert(data.relationships.some(edge=>edge.a==='ashardalon'&&edge.b==='meepo-po'&&edge.kind==='family'));
for(const [chapter,scene] of [['sunless-citadel',2],['bastion',11]])assert(context.stories[chapter].scenes[scene-1].links.some(link=>link.href===poPath));
const sonsPath='#/revelations/stolen-sons';
const sonsPage=renderRevelations(data,'stolen-sons',context);
assert(sonsPage.includes('ebce53de9a481357f6762460.gif')&&sonsPage.includes('prefers-reduced-motion: reduce'));
assert(searchRecords(index,'Nuno').some(r=>r.href===sonsPath+'/3'));
assert(renderRevelationsCallout().includes(sonsPath)&&renderRevelationsCallout().includes(poPath));
assert.equal(searchRecords(index,'').length,0);
assert(searchRecords(index,'Pengu','memories').every(r=>r.category==='memories'));
assert(searchRecords(index,'Shrop Pengu').every(r=>r.normalised.includes('shrop')&&r.normalised.includes('pengu')));
assert(searchRecords(index,'Blackrazor').some(r=>r.category==='possessions'));
for(const record of index){assert(!record.href.includes('undefined'));const [slug,section,entry]=record.href.slice(2).split('/');if(section==='scene')assert(context.stories[slug]?.scenes[Number(entry)-1]);else if(slug==='companions')assert(context.people.some(p=>p.slug===section));else if(slug==='further-tales')assert(context.tales.sections.some(s=>s.slug===section));else if(slug==='revelations')assert(sections.some(([id])=>id===section));else if(slug==='battle-chronicle'){assert(section==='target');assert(context.battles.events.some(e=>e.target===decodeURIComponent(entry)))}else if(slug==='time-and-places')assert(section==='maps'?context.mapWallData.maps.some(p=>p.id===entry):context.explorerData.places.some(p=>p.id===entry));else assert(context.stories[slug]||context.chapters.some(c=>c.slug===slug))}
let count=0;
for(const page of [null,...sections.map(([id])=>id)]){const html=renderRevelations(data,page,context);assert(!html.includes('undefined'));assert(!/\bboss\b|fifty.year/i.test(html));assert.equal((html.match(/<h1>/g)??[]).length,1);assert(html.lastIndexOf(page==='nightfang-room'?'Adjacent adventures':'Continue the remembrance')>html.lastIndexOf('</article>'));for(const [,src] of html.matchAll(/<img[^>]+src="([^"]+)"/g)){assert(existsSync(resolve(root,src)),src);count++}}
assert(renderRevelationsCallout().includes('#/revelations/remembrance'));
console.log(`Revelations: ${data.reveals.length} reveals, ${data.chains.length} consequence chains, ${data.cast.length} figures, ${data.relationships.length} relationships, ${data.remembrance.length} tour stops; ${index.length} searchable passages and ${count} rendered image references passed.`);
