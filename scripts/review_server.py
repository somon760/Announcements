#!/usr/bin/env python3
"""Loopback-only media review. Reads only explicit catalog files, never whole directories."""
import argparse,csv,hashlib,json,mimetypes,re,os,base64
from pathlib import Path
from urllib.parse import urlparse,unquote
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
ROOT=Path(__file__).resolve().parents[1]
def catalog_from_csv(path):
    items=[]; media={}; seen=set()
    exclusions_path=path.parent/'excluded-asset-ids.json'
    excluded=set(json.loads(exclusions_path.read_text()).get('ids',[])) if exclusions_path.exists() else set()
    health_path=path.parent/'remote-image-health.json'
    health=json.loads(health_path.read_text()) if health_path.exists() else []
    missing={entry['id'] for entry in health if entry.get('missing') and entry.get('result',{}).get('http') in (404,410) and (entry.get('confirmation') or {}).get('http') in (404,410)}
    links_path=path.parent/'dropbox-shared-links.json'
    links=json.loads(links_path.read_text()).get('links',[]) if links_path.exists() else []
    shared={link['path_lower']:link['url'] for link in links if link.get('audience')=='public' and link.get('allow_download') and not link.get('password_protected')}
    for r in csv.DictReader(path.open()):
        target=r['path_or_url']; id=hashlib.sha256(target.encode()).hexdigest()[:24]
        if id in seen or id in missing or id in excluded: continue
        seen.add(id)
        remote=target.startswith(('https://','http://')); p=Path(target) if not remote else None
        suffix=Path(urlparse(target).path).suffix.lower()
        kind='image' if suffix in {'.png','.jpg','.jpeg','.webp','.gif','.heic','.avif','.tiff'} else 'video' if suffix in {'.mp4','.mov','.webm'} else 'audio' if suffix in {'.mp3','.m4a','.wav','.aiff','.aifc'} else 'project'
        available=False
        if p and kind!='project':
            try: available=p.is_file() and os.access(p,os.R_OK)
            except OSError:pass
            if available:media[id]=p.resolve()
        items.append(dict(id=id,name=r['filename'],source=r['source'],url=target if remote else '',kind=kind,localAvailable=available,chapters=[c for c in r['suggested_chapters'].split('; ') if c!='Unassigned'],basis=r['basis'],hold=r['review_status'].startswith('HOLD'),group=re.sub('[^a-z0-9]','',Path(r['filename']).stem.lower()),duration=r['duration_seconds'],dimensions=r['dimensions']))
    for item in items:
        if item['source'].startswith('Dropbox'):
            item['shareUrl']=shared.get('/'+item['name'].lower(),'')
        if item['kind']=='image' and not item['url']:
            preview_path=path.parent/'image-previews'/(item['id']+'.jpg')
            if preview_path.is_file():
                item['previewData']='data:image/jpeg;base64,'+base64.b64encode(preview_path.read_bytes()).decode('ascii')
                item['previewNote']='Reduced review copy (up to 800 pixels); use original for the final film.'
            else:
                item['previewNote']='Source could not be read for preview. Choose the local file; this is not a rejected image.'
    audit_path=path.parent/'chronology-audit.json'
    if audit_path.exists():
        audit=json.loads(audit_path.read_text()).get('items',{})
        by_id={hashlib.sha256(target.encode()).hexdigest()[:24]:entry for target,entry in audit.items()}
        for item in items:
            item['chronology']=by_id.get(item['id'],{})
    items.sort(key=lambda x:(0 if x['source'].startswith('Dropbox') else 1,x['name'].lower()))
    return {'version':1,'items':items},media

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--catalog',type=Path,default=Path.home()/'Team-Biscuit-Reel-Inventory/reel-wide-net.csv');ap.add_argument('--port',type=int,default=48742);ap.add_argument('--export',type=Path);args=ap.parse_args()
    catalog,media=catalog_from_csv(args.catalog)
    if args.export:args.export.write_text(json.dumps(catalog,ensure_ascii=False,indent=2));print('Exported catalog to',args.export)
    payload=json.dumps(catalog).encode()
    class Handler(BaseHTTPRequestHandler):
        def do_HEAD(self):self.serve(False)
        def do_GET(self):self.serve(True)
        def serve(self,body):
            if self.headers.get('Host','').split(':')[0] not in {'127.0.0.1','localhost'}:self.send_error(403);return
            path=unquote(urlparse(self.path).path)
            if path=='/review/api/catalog':
                self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(payload)));self.send_header('Cache-Control','no-store');self.end_headers()
                if body:self.wfile.write(payload)
                return
            if path.startswith('/review/media/'):
                f=media.get(path.removeprefix('/review/media/'))
            elif path in {'/','/review','/review/','/review/index.html'}:f=ROOT/'review/index.html'
            elif path in {'/review/review.js','/review/review.css','/review/excluded-asset-ids.json'}:f=ROOT/path.lstrip('/')
            else:f=None
            if f is None:self.send_error(404);return
            try:
                with f.open('rb') as stream:
                    size=os.fstat(stream.fileno()).st_size;start=0;end=size-1;partial=False
                    raw=self.headers.get('Range')
                    if raw:
                        m=re.fullmatch(r'bytes=(\d*)-(\d*)',raw)
                        if not m or not any(m.groups()):self.send_error(416);return
                        a,b=m.groups()
                        if a:start=int(a);end=min(int(b),size-1) if b else size-1
                        else:start=max(0,size-int(b))
                        if start>=size or end<start:
                            self.send_response(416);self.send_header('Content-Range',f'bytes */{size}');self.end_headers();return
                        partial=True
                    self.send_response(206 if partial else 200);self.send_header('Content-Type',mimetypes.guess_type(f)[0] or 'application/octet-stream');self.send_header('Accept-Ranges','bytes');self.send_header('Content-Length',str(end-start+1));self.send_header('X-Content-Type-Options','nosniff');self.send_header('Cache-Control','no-store')
                    if partial:self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
                    self.end_headers()
                    if body:
                        stream.seek(start);left=end-start+1
                        while left:
                            chunk=stream.read(min(left,1024*1024))
                            if not chunk:break
                            self.wfile.write(chunk);left-=len(chunk)
            except (PermissionError,FileNotFoundError):self.send_error(404,'Source unavailable')
            except (BrokenPipeError,ConnectionResetError):pass
        def log_message(self,*args):pass
    print(f'Team Biscuit: http://127.0.0.1:{args.port}/review/ — {len(catalog["items"])} entries, {len(media)} local previews',flush=True)
    ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
if __name__=='__main__':main()
