#!/usr/bin/env python3
"""Build the public showcase from the current selected catalog (Pillow + ffmpeg).
Sources remain untouched. Dropbox movies remain remote; only posters are published.
"""
import argparse,csv,hashlib,json,shutil,subprocess,urllib.request,urllib.parse,concurrent.futures,datetime,re
from pathlib import Path
from PIL import Image,ImageOps
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'review'

def run(cmd,timeout=180):
 p=subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError(p.stderr[-800:])
 return p.stdout

def download(url,path):
 if path.exists():return
 req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
 with urllib.request.urlopen(req,timeout=60) as r:path.write_bytes(r.read())

def raw_url(url):
 p=urllib.parse.urlsplit(url);q=dict(urllib.parse.parse_qsl(p.query));q.pop('dl',None);q['raw']='1'
 return urllib.parse.urlunsplit((p.scheme,'dl.dropboxusercontent.com',p.path,urllib.parse.urlencode(q),''))

def build(inv):
 catalog=json.loads((inv/'review-catalog.json').read_text())['items']
 excluded=set(json.loads((inv/'excluded-asset-ids.json').read_text())['ids'])
 rows={hashlib.sha256(r['path_or_url'].encode()).hexdigest()[:24]:r for r in csv.DictReader((inv/'reel-wide-net.csv').open())}
 originals={r['path']:r for r in csv.DictReader((inv/'all-files.csv').open())}
 stage=inv/'showcase-staging';stage.mkdir(exist_ok=True)
 for p in ['media/images','media/videos','media/thumbs']: (OUT/p).mkdir(parents=True,exist_ok=True)
 chapter_map={'The Sunless Citadel':'sunless-citadel','The Forge of Fury':'forge-of-fury','The Speaker in Dreams':'speaker-in-dreams','The Standing Stone':'standing-stone','Heart of Nightfang Spire':'nightfang-spire','Deep Horizon':'deep-horizon','Lord of the Iron Fortress':'iron-fortress','White Plume Mountain':'white-plume','Icewind Dale / Frostmaiden':'frostmaiden','Bastion of Broken Souls':'bastion','Team Gravy / Fungal Bloom':'fungal-bloom','Those Who Writhe Below':'writhe-below'}
 def one(i):
  assert i['id'] not in excluded
  r=rows[i['id']];target=r['path_or_url'];remote=target.startswith('http');local=Path(target) if not remote else None
  if local and r['source']=='Desktop observed media':local=stage/local.name
  dates={k:v for k,v in i.get('chronology',{}).get('dates',{}).items() if v}
  audit=i.get('chronology',{})
  original=originals.get(target,{})
  for key in ['created','modified']:
   if original.get(key):dates[key]=original[key]
  if local and local.exists():
   stat=local.stat()
   if not dates.get('modified'):dates['modified']=datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(timespec='seconds')
   # Finder copies retain source creation dates. Never use a generated web file's dates.
   if not dates.get('created') and getattr(stat,'st_birthtime',stat.st_mtime)<datetime.datetime(2026,10,27).timestamp():dates['created']=datetime.datetime.fromtimestamp(stat.st_birthtime).isoformat(timespec='seconds')
  chapters=i['chapters'];chapter=chapter_map.get(chapters[0],'between-adventures') if len(chapters)==1 else 'between-adventures'
  # Brindinford's 2021 return is plausible, but the current archive does not
  # establish its placement in Speaker. Keep those dated images in the liminal shelf.
  if i['id'] in {'98f2647719524525fff2364c','12d0fa739b58d859556e5b07','c70af5773352df7a5fbd1dd2'}:chapter='between-adventures'
  if i.get('hold') or i.get('chronology',{}).get('status')=='date conflict' or 'PROVISIONAL' in i['basis']:chapter='between-adventures'
  asset={'id':i['id'],'name':i['name'],'kind':i['kind'],'chapter':chapter,'source':i['source'],'dates':dates,'date':dates.get('modified') or dates.get('uploaded') or dates.get('dropbox_client_modified') or i.get('chronology',{}).get('date',''),'dimensions':i.get('dimensions',''),'duration':i.get('duration',''),'dateChecks':audit.get('checks',{}),'dateReason':audit.get('reason',''),'dateStatus':audit.get('status',''),'thumbnail':'media/thumbs/'+i['id']+'.jpg'}
  thumb=OUT/asset['thumbnail']
  if i['kind']=='image':
   if remote:
    ext=Path(urllib.parse.urlsplit(target).path).suffix.lower();src=stage/(i['id']+ext);download(target,src);asset['originalUrl']=target
   else:src=local;ext=src.suffix.lower()
   with Image.open(src) as im:
    im=ImageOps.exif_transpose(im);asset['dimensions']=f'{im.width}×{im.height}'
    if not thumb.exists():
     bg=Image.new('RGB',im.size,(32,30,28));rgba=im.convert('RGBA');bg.paste(rgba,mask=rgba.getchannel('A'));bg.thumbnail((720,720));bg.save(thumb,quality=84,optimize=True)
    # Preserve original formats where browsers support them. Convert only uncommon formats.
    (OUT/'media/images'/chapter).mkdir(parents=True,exist_ok=True)
    if ext not in {'.png','.jpg','.jpeg','.webp','.gif','.avif'}:
     ext='.png';dest=OUT/'media/images'/chapter/(i['id']+ext);im.save(dest)
    else:
     dest=OUT/'media/images'/chapter/(i['id']+ext)
     dest.parent.mkdir(parents=True,exist_ok=True)
     if not dest.exists():shutil.copy2(src,dest)
   asset['url']=str(dest.relative_to(OUT))
  else:
   dropbox=i['source'].startswith('Dropbox')
   src=raw_url(i['shareUrl']) if dropbox else target if remote else str(local)
   if dropbox:asset['url']=src;asset['originalUrl']=i['shareUrl']
   elif remote:asset['url']=target;asset['originalUrl']=target
   else:
    dest=OUT/'media/videos'/(i['id']+'.mp4');asset['url']=str(dest.relative_to(OUT))
    if not dest.exists():
     probe=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',src]))
     streams=probe['streams'];v=next(s for s in streams if s['codec_type']=='video');a=next((s for s in streams if s['codec_type']=='audio'),{})
     seconds=float(probe['format']['duration']);asset['duration']=round(seconds,2)
     common=['ffmpeg','-hide_banner','-loglevel','error','-y','-i',src,'-map','0:v:0','-map','0:a:0?']
     # H.264/AAC MP4 with fast-start; transcode large or incompatible video.
     if v['codec_name']=='h264' and Path(src).stat().st_size<90*1024**2:
      opts=['-c:v','copy']
     else:
      rate=min(5000,int(85*1024**2*8/seconds/1000)-160)
      opts=['-c:v','libx264','-preset','fast','-crf','21','-maxrate',f'{max(200,rate)}k','-bufsize',f'{max(400,rate*2)}k','-pix_fmt','yuv420p','-threads','2']
     opts+=['-c:a','copy'] if a.get('codec_name')=='aac' else ['-c:a','aac','-b:a','160k']
     run(common+opts+['-movflags','+faststart',str(dest)],timeout=900)
    src=str(dest)
   if not thumb.exists():
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss','0','-i',src,'-frames:v','1','-vf','scale=720:720:force_original_aspect_ratio=decrease','-pix_fmt','yuvj420p','-q:v','3','-threads','1',str(thumb)],timeout=150)
   assert thumb.is_file() and thumb.stat().st_size > 0, 'No poster extracted'
   if not asset['duration']:
    try:
     meta=json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',src],timeout=30));asset['duration']=round(float(meta['format']['duration']),2)
     v=next(s for s in meta['streams'] if s['codec_type']=='video');asset['dimensions']=f"{v['width']}×{v['height']}"
    except Exception:pass
  return asset
 results=[];errors=[]
 with concurrent.futures.ThreadPoolExecutor(4) as pool:
  tasks={pool.submit(one,i):i for i in catalog}
  for f in concurrent.futures.as_completed(tasks):
   i=tasks[f]
   try:results.append(f.result());print('OK',i['name'],flush=True)
   except Exception as e:errors.append({'id':i['id'],'name':i['name'],'error':str(e)});print('ERROR',i['name'],str(e),flush=True)
 results.sort(key=lambda i:(i['date'] or '9999',i['name'].lower(),i['id']))
 (OUT/'media.json').write_text(json.dumps({'version':2,'items':results},ensure_ascii=False,indent=2)+'\n')
 (stage/'build-report.json').write_text(json.dumps({'count':len(results),'errors':errors},indent=2))
 print('RESULT',len(results),'errors',len(errors),flush=True)
 if errors:raise SystemExit(1)
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--inventory',type=Path,default=Path.home()/'Team-Biscuit-Reel-Inventory');build(ap.parse_args().inventory)
