#!/usr/bin/env python3
"""Create private, reduced review copies; never upload or alter source images."""
import argparse,csv,hashlib,json,subprocess,concurrent.futures
from pathlib import Path
from PIL import Image

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--catalog',type=Path,default=Path.home()/'Team-Biscuit-Reel-Inventory/reel-wide-net.csv');args=ap.parse_args()
    root=args.catalog.parent;out=root/'image-previews';out.mkdir(exist_ok=True)
    rows=[r for r in csv.DictReader(args.catalog.open()) if r['source'] in ('local image','Desktop observed media') and Path(r['path_or_url']).suffix.lower() in {'.png','.jpg','.jpeg','.webp','.gif','.heic','.avif','.tiff'}]
    def build(r):
        ident=hashlib.sha256(r['path_or_url'].encode()).hexdigest()[:24];source=Path(r['path_or_url']);dest=out/(ident+'.jpg')
        result={'id':ident,'name':r['filename']}
        try:
            with source.open('rb') as f:f.read(1)
            if not dest.exists() or dest.stat().st_mtime<source.stat().st_mtime:
                run=subprocess.run(['sips','-s','format','jpeg','-s','formatOptions','75','-Z','800',str(source),'--out',str(dest)],capture_output=True,text=True,timeout=30)
                if run.returncode or not dest.exists():raise ValueError('Preview conversion failed')
            # sips can retain large source metadata; fresh encoding keeps the catalog compact.
            with Image.open(dest) as image:
                clean=Image.new('RGB',image.size)
                clean.paste(image.convert('RGB'))
                clean.save(dest,'JPEG',quality=65,optimize=True)
            result.update(available=True,file=dest.name,bytes=dest.stat().st_size)
        except (OSError,ValueError,subprocess.TimeoutExpired) as e:result.update(available=False,error=type(e).__name__)
        return result
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results=[]
        for i,result in enumerate(pool.map(build,rows),1):
            results.append(result)
            if i%250==0:print(f'{i}/{len(rows)} previews checked',flush=True)
    (root/'image-preview-manifest.json').write_text(json.dumps({'items':results},indent=2))
    print(json.dumps({'total':len(results),'available':sum(x['available'] for x in results),'unavailable':[x for x in results if not x['available']]}),flush=True)
if __name__=='__main__':main()
