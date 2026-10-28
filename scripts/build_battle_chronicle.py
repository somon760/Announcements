"""Reconcile captured Roll20 logbooks into a private ledger and public chronicle.

Usage: python3 scripts/build_battle_chronicle.py --knowledge-base /absolute/KB
Raw captures stay private. Repeated enemies within one log are separate events.
"""
from pathlib import Path
from html.parser import HTMLParser
import argparse,collections,hashlib,json,re,sqlite3

class Plain(HTMLParser):
    def __init__(self): super().__init__(); self.parts=[]
    def handle_starttag(self,tag,attrs):
        if tag in ('p','div','br','li','h1','h2','h3','h4'): self.parts.append('\n')
    def handle_endtag(self,tag):
        if tag in ('p','div','li','h1','h2','h3','h4'): self.parts.append('\n')
    def handle_data(self,data): self.parts.append(data)

def normalized(value): return re.sub(r'\s+',' ',value).strip()
PATTERN=re.compile(r'Party killed\s*[-:]?\s*(.*?)\s+for\s*([^\n]*?)\s*experience points\.?|Correction\s*:*\s*Party did not kill\s*[-:]?\s*(.*?)\.\s*([^\n]*?)\s*experience points removed\.?',re.I)

def parse_events(text):
    events=[]
    for m in PATTERN.finditer(text):
        target=normalized(m[1] if m[1] is not None else m[3]); xp=m[2] if m[1] is not None else m[4]
        tail=text[m.end():text.find('\n',m.end()) if '\n' in text[m.end():] else len(text)]
        events.append(dict(kind='kill' if m[1] is not None else 'correction',target=target,xp=int(xp.replace(',','')) if re.fullmatch(r'[\d,]+',xp) else None,xpToken=xp,
                           position=m.start(),nonlethal=bool(re.search(r'defeated,?\s*not killed',tail[:75],re.I)),raw=m[0]+(tail[:75] if 'not killed' in tail[:75].lower() else '')))
    return events

def key(e): return e['kind'],normalized(e['target']).casefold(),e['xp'],e['nonlethal']

def reconcile(events):
    """A correction cancels the most recent preceding unmatched identical award.

    Unmatched corrections stay in review; they never subtract a future kill.
    """
    waiting=collections.defaultdict(list)
    for e in events:
        e['status']='active' if e['kind']=='kill' else 'unmatched_correction'
        k=(normalized(e['target']).casefold(),e['xp'])
        if e['kind']=='kill': waiting[k].append(e)
        elif waiting[k]:
            prior=waiting[k].pop(); prior['status']='corrected'; prior['correctedBy']=e['id']
            e['status']='applied_correction'; e['cancels']=prior['id']
    return events

PLACEHOLDERS={'','something','party target','loot bot','minstrel','the minstrel'}
PARTY={'grimbledee','grimbledee brightburrow','thunderdrum','thunderdrum stringcutter','shrop','shrop shireslasher','terry','terry stronginthearm','brunn ironbelly','rook kestrel','nox veyra','elira moss-weaver'}
def review_reason(e):
    n=e['target'].casefold()
    if n in PARTY: return 'Party-member target; no foe identity established'
    if n in PLACEHOLDERS or n.isdecimal(): return 'Blank, placeholder or unidentified target'
    if e.get('stream')=='bastion' and e['ordinal']<10: return 'Unplaced preliminary entries in the current log; play context unconfirmed'
    return None

def classify(target):
    """Conservative display groups, not an invented official monster taxonomy."""
    n=target.casefold(); species=target; family='Other & unclassified'
    if n in ['orc','orc with longbow','orc mercenary','orc war chief']: return 'Orc','Orcs'
    if n in ['goblin','hobgoblin','bugbear','bugbear gardener']:
        return ('Bugbear' if n=='bugbear gardener' else target),'Goblinoids'
    if n in ['rat','dire rat','giant rat','giant plaguerat']: return 'Rat','Beasts & vermin'
    if n in ['wererat','wererat heavy']: return 'Wererat','Shapechangers'
    if n in ['skeleton','robed skeleton']: return 'Skeleton','Undead'
    if n in ['giant ant behemoth','spitter','brood medic swarm','burrower ambush swarm','devouring ant swarm']: return 'Giant ant','Ants'
    if n in ['young black dragon','ancient black dragon']: return 'Black dragon','Dragons'
    if n in ['young blue dragon','adult blue dragon']: return 'Blue dragon','Dragons'
    if n in ['ancient white dragon']: return 'White dragon','Dragons'
    if n in ['young imperial dragon']: return 'Imperial dragon','Dragons'
    if n in ['young remorhaz','ancient remorhaz','remorhaz']: return 'Remorhaz','Other & unclassified'
    if n in ['salamander','noble salamander']: return 'Salamander','Elemental foes'
    if n in ['hell hound','axiomatic hell hound']: return 'Hell hound','Fiendish foes'
    if n in ['giant, jotun']: return 'Jotun giant','Giants & ogres'
    if n.startswith('elven '): return 'Elf','Elves'
    if n.startswith('githyanki '): return 'Githyanki','Githyanki'
    if 'skeleton' in n or any(w in n for w in ['zombie','specter','wraith','wight','vampire','lich','undead','flameskull']) or n in ['mohrg','boneclaw','ghoul']: family='Undead'
    elif 'dragon' in n: family='Dragons'
    elif any(w in n for w in ['golem','clockwork','animated ']) or n in ['steel predator','retriever','advanced retriever']: family='Constructed foes'
    elif any(w in n for w in ['fungus','shroom','shrieker','blight','tree']) or n in ['shambling mound','hydra plant']: family='Fungi & plants'
    elif 'elemental' in n or n in ['water weird','invisible stalker','gargoyle','advanced gargoyle','fire snake']: family='Elemental foes'
    elif n in ['glabrezu','nalfeshnee','hezrou','vrock','balor','marilith','goristro','chasme','imp','barghest','night hag','hellcat','shadow demon','yochlol','draegloth','abyssal ripper','ultroloth ascendant'] or 'devil' in n or 'fiend' in n: family='Fiendish foes'
    elif 'giant' in n and any(w in n for w in ['hill giant','fire giant','cloud giant']) or n.startswith('ogre'): family='Giants & ogres'
    elif any(w in n for w in ['ooze','pudding','jelly']): family='Oozes'
    elif n in ['wolf','dire wolf','brown bear','ape','hawk','owl','weasel','rat','lion','elephant','scorpion','giant boar','giant lizard','giant poisonous snake','poisonous snake','giant scorpion','giant shark','giant walrus','ice seal','giant crayfish','huge giant crab','frog','stirge','swarm of quippers']: family='Beasts & vermin'
    return species,family

def chapter_for(stream,index,position,boundaries):
    if stream=='sunless': return 'sunless-citadel','explicit log and adjoining Forge overlap'
    if stream=='history':
        if position<boundaries['speaker']:return 'forge-of-fury','explicit Forge/Speaker series transition'
        if position<boundaries['standing']:return 'speaker-in-dreams','Speaker series and departure for Ossington'
        if position<boundaries['nightfang']:return 'standing-stone','Ossington series and town attack'
        if position<boundaries['deep']:return 'nightfang-spire','Mooncalf/Gulthias sequence and early snapshot boundaries'
        return None,'No secure chapter boundary in the surviving flat log'
    if stream=='dream':return 'white-plume','Separate post-Brindinford dream branch; module-specific encounters'
    if stream=='north':
        if position<boundaries['fungus']:return 'frostmaiden','Spine of the World log: northern road and demon-army sequence'
        return 'fungal-bloom','Fungal targets followed by the joined-company ant sequence'
    if stream=='bastion' and index>=10:return 'bastion','Current Bastion log and recorded encounters'
    return None,'Play context unconfirmed'

def company_for(stream,index,position,boundaries):
    if stream=='north' and position>=boundaries['ants']:return 'shared'
    if stream=='north' and position>=boundaries['fungus']:return 'unassigned'
    return 'biscuit'

def slug(value): return re.sub(r'[^a-z0-9]+','-',value.casefold()).strip('-')

def build(kb,out):
    logs={}
    for path in sorted((kb/'records').glob('*/*.json')):
        r=json.loads(path.read_text())
        if 'party log book' not in r.get('name','').lower():continue
        p=Plain();p.feed(r.get('notes') or '');text=''.join(p.parts)
        parsed=parse_events(text)
        represented={event['position'] for event in parsed if event['kind']=='kill'}
        missing=[match.start() for match in re.finditer('Party killed',text,re.I) if match.start() not in represented]
        assert not missing, f'Unparsed kill entries in {path.name}: review the parser before publishing'
        assert text.strip(), f'Empty log capture: reload and capture {path.name}'
        logs[f'{r["campaignId"]}/{r["id"]}']=dict(record=r,text=text,events=parsed)
    history=logs['18767569/-Nnzn8LQoHRlKYUTb57e']['events']
    north=logs['17983003/-M40BkydbuZpyb2uWqHz']['events']
    dream=logs['14900268/-M40BkydbuZpyb2uWqHz']['events']
    sunless=logs['14900268/-M7R0SfEEaQK6ps7AG1f']['events']
    bastion=logs['21514921/-OkOmVNL0s6TuTP1NnZZ']['events']
    # These boundaries are verified ordered overlaps, not name-set deduplication.
    prefix=next((i for i,(a,b) in enumerate(zip(dream,history)) if key(a)!=key(b)),min(len(dream),len(history)))
    overlap=max(n for n in range(1,min(len(sunless),len(history))+1) if list(map(key,sunless[-n:]))==list(map(key,history[:n])))
    assert prefix>=180 and dream[prefix-1]['target']=='Brute Squad' and overlap==12, 'Review the diverging dream and Sunless/Forge boundaries'
    history_text=logs['18767569/-Nnzn8LQoHRlKYUTb57e']['text'];north_text=logs['17983003/-M40BkydbuZpyb2uWqHz']['text']
    boundaries={'speaker':history_text.index('Start of Adventure 8 in TSiD Series.'),'standing':history_text.index('[Party leaves for Ossington]'),'nightfang':history_text.index('Party killed - Mooncalf'),'deep':history_text.index('Party killed - Desmodu'),'fungus':north_text.index('Party killed - Strobing Fungus'),'ants':north_text.index('Party killed - Soldier',north_text.rindex('Party killed - Pyrohydra'))}
    sunless_length=len(sunless)-overlap
    streams={'sunless':sunless[:sunless_length],'history':history,'dream':dream[prefix:],'north':north,'bastion':bastion}
    all_events=[]; byref={}
    for stream,items in streams.items():
        for index,original in enumerate(items):
            ordinal=index+prefix if stream=='dream' else index
            e=dict(original,id=f'{stream}-{ordinal:04d}',stream=stream,ordinal=ordinal,observations=[])
            e['chapter'],e['chapterBasis']=chapter_for(stream,ordinal,e['position'],boundaries);e['company']=company_for(stream,ordinal,e['position'],boundaries)
            named_context={'Helkitrin':'deep-horizon','Imperagon':'iron-fortress','Crimson Crazuk':'white-plume'}
            if e['chapter'] is None and e['target'] in named_context:
                e['chapter']=named_context[e['target']];e['chapterBasis']='Named foe established in the narrated chapter; surrounding unplaced rows are not inferred'
            e['species'],e['family']=classify(e['target']);e['targetId']=slug(e['target']);e['speciesId']=slug(e['species'])
            all_events.append(e);byref[e['id']]=e
    observations=[];source_info=[]
    for source,log in logs.items():
        entries=log['events'];refs=[]
        if source=='14900268/-M7R0SfEEaQK6ps7AG1f': refs=[f'sunless-{i:04d}' if i<sunless_length else f'history-{i-sunless_length:04d}' for i in range(len(entries))]
        elif source=='14900268/-M40BkydbuZpyb2uWqHz':refs=[f'history-{i:04d}' if i<prefix else f'dream-{i:04d}' for i in range(len(entries))]
        elif source.startswith('21514921/'):refs=[f'bastion-{i:04d}' for i in range(len(entries))]
        elif source.endswith('/-Nnzn8LQoHRlKYUTb57e') or source.split('/')[0] in ['14048666','15055611','15055613','15055635']:
            assert list(map(key,entries))==list(map(key,history[:len(entries)])),source
            refs=[f'history-{i:04d}' for i in range(len(entries))]
        elif source.split('/')[0] in ['17983003','18767569','6011383']:
            assert list(map(key,entries))==list(map(key,north[:len(entries)])),source
            refs=[f'north-{i:04d}' for i in range(len(entries))]
        else:raise ValueError('Unreviewed source '+source)
        for i,ref in enumerate(refs):
            assert key(entries[i])==key(byref[ref]),(source,i,ref)
            obs=dict(source=source,ordinal=i,eventId=ref,position=entries[i]['position']);observations.append(obs);byref[ref]['observations'].append(obs)
        r=log['record'];source_info.append(dict(id=source,name=r['name'],url=r['url'],capturedAt=r.get('capturedAt'),events=len(entries),sha256=hashlib.sha256(log['text'].encode()).hexdigest()))
    for stream in streams: reconcile([e for e in all_events if e['stream']==stream])
    for e in all_events:
        if e['status']!='active':continue
        why=review_reason(e)
        if why:e['status']='review';e['reviewReason']=why
        elif e['nonlethal']:e['status']='nonlethal'
    accepted=[e for e in all_events if e['status']=='active'];nonlethal=[e for e in all_events if e['status']=='nonlethal']
    private=kb/'battles';private.mkdir(exist_ok=True)
    (private/'reconciled-ledger.json').write_text(json.dumps(dict(sources=source_info,events=all_events),ensure_ascii=False,indent=2)+'\n')
    db=sqlite3.connect(private/'ledger.sqlite');db.executescript('DROP VIEW IF EXISTS target_totals; DROP VIEW IF EXISTS species_totals; DROP TABLE IF EXISTS sources; DROP TABLE IF EXISTS events; DROP TABLE IF EXISTS observations; CREATE TABLE sources(id TEXT PRIMARY KEY,name TEXT,url TEXT,captured_at TEXT,sha256 TEXT); CREATE TABLE events(id TEXT PRIMARY KEY,kind TEXT,target TEXT,species TEXT,family TEXT,xp INTEGER,status TEXT,chapter TEXT,company TEXT,stream TEXT,ordinal INTEGER,position INTEGER,raw TEXT,corrected_by TEXT,cancels TEXT,review_reason TEXT); CREATE TABLE observations(source_id TEXT,ordinal INTEGER,event_id TEXT,position INTEGER,PRIMARY KEY(source_id,ordinal)); CREATE INDEX event_targets ON events(species,status);')
    db.executescript("CREATE VIEW target_totals AS SELECT target,COUNT(*) AS kills,SUM(xp) AS known_xp,SUM(xp IS NULL) AS unknown_xp_entries FROM events WHERE status='active' GROUP BY target; CREATE VIEW species_totals AS SELECT species,COUNT(*) AS kills,SUM(xp) AS known_xp,SUM(xp IS NULL) AS unknown_xp_entries FROM events WHERE status='active' GROUP BY species;")
    db.executemany('INSERT INTO sources VALUES(?,?,?,?,?)',[(s['id'],s['name'],s['url'],s['capturedAt'],s['sha256']) for s in source_info])
    db.executemany('INSERT INTO events VALUES('+','.join('?'*16)+')',[(e['id'],e['kind'],e['target'],e['species'],e['family'],e['xp'],e['status'],e['chapter'],e['company'],e['stream'],e['ordinal'],e['position'],e['raw'],e.get('correctedBy'),e.get('cancels'),e.get('reviewReason')) for e in all_events])
    db.executemany('INSERT INTO observations VALUES(?,?,?,?)',[(o['source'],o['ordinal'],o['eventId'],o['position']) for o in observations]);db.commit();db.close()
    fields=['id','target','targetId','species','speciesId','family','xp','chapter','company']
    public=[{k:e[k] for k in fields}|{'unit':'swarm' if 'swarm' in e['target'].casefold() else 'group' if any(w in e['target'].casefold() for w in ['squad','cluster']) else 'target','date':None} for e in accepted]
    stats=dict(kills=len(accepted),species=len({e['speciesId'] for e in accepted}),targets=len({e['targetId'] for e in accepted}),loggedXP=sum(e['xp'] or 0 for e in accepted),unknownXP=sum(e['xp'] is None for e in accepted),nonlethal=len(nonlethal),reviewKills=sum(e['status']=='review' for e in all_events),correctionsApplied=sum(e['status']=='applied_correction' for e in all_events),unmatchedCorrections=sum(e['status']=='unmatched_correction' for e in all_events),observedEntries=len(observations),uniqueEntries=len(all_events),duplicateObservations=len(observations)-len(all_events),sourceCount=len(logs),unplacedKills=sum(e['chapter'] is None for e in accepted),swarmUnits=sum('swarm' in e['target'].casefold() for e in accepted))
    named={'Calcryx':'sunless-citadel','Belak the Outcast':'sunless-citadel','Durnn':'sunless-citadel','Great Ulfe':'forge-of-fury','Gulthias':'nightfang-spire','Imperagon':'iron-fortress','Helkitrin':'deep-horizon','Crimson Crazuk':'white-plume','Ctenmiir':'white-plume','General Nagaro':'frostmaiden','Grandmaster Ryu Hayabusa':'frostmaiden','Advanced Retriever':'bastion','Po':'bastion','Grisly':'bastion','Krushar':'bastion','Thalidorus':'bastion'}
    data=dict(version=1,updated='2026-10-28',title='The Battle Chronicle',stats=stats,events=public,nonlethal=[{k:e[k] for k in fields} for e in nonlethal],sources=[{k:s[k] for k in ['name','url']} for s in source_info],memorable=[dict(target=t,chapter=c) for t,c in named.items() if any(e['target']==t for e in accepted)],methodology=[
        'The counters describe logged kills, not personal finishing blows or a complete census of every creature in the campaign.',
        'Whole matching log passages and verified prefixes are counted once across backups. Identical enemies within a passage remain separate logged targets.',
        'A correction cancels the nearest preceding uncancelled entry with the same target and XP. An unmatched correction stays in review and never erases a later entry.',
        'Explicitly nonlethal defeats, party-member targets, placeholders and the unconfirmed preliminary current-log entries are held outside kill totals.',
        'Species and foe groups keep their original labels as variants. Named or unclear targets remain unclassified rather than receiving invented species.',
        'Each swarm, squad or cluster is one logged unit. A zero-XP target can still count; an absent XP figure stays unknown.',
        'Chapter and company assignments use identifiable log passages; unplaced events and unattributed companies remain visible. There is no reliable per-kill calendar timeline.',
        'Logged monster XP is not personal earned XP. The Ashardalon finale remains open.'
    ])
    out.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');(private/'summary.json').write_text(json.dumps(stats,indent=2)+'\n')
    print(json.dumps(stats,indent=2));return data

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--knowledge-base',required=True,type=Path);parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'review/battles.json');args=parser.parse_args();build(args.knowledge_base,args.output)
