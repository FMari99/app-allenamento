"""Verifica la build e la pubblica sulla branch gh-pages, separata dai sorgenti."""
import argparse, base64, json, re, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def gh(*args, body=None, optional=False):
    result=subprocess.run(['gh',*args],input=json.dumps(body) if body is not None else None,text=True,capture_output=True)
    if result.returncode:
        if optional and ('404' in result.stderr or 'Git Repository is empty' in result.stderr): return None
        raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout) if result.stdout.strip() else None

def api(path,body=None,optional=False,method=None):
    args=['api',path]
    if method: args+=['--method',method]
    if body is not None: args+=['--input','-']
    return gh(*args,body=body,optional=optional)

def repository_from_remote():
    result=subprocess.run(['git','remote','get-url','origin'],cwd=ROOT,text=True,capture_output=True)
    if result.returncode: raise ValueError('Repository non rilevato: usare --repository proprietario/nome')
    match=re.search(r'github\.com(?::|/)([^/]+/[^/]+?)(?:\.git)?$',result.stdout.strip())
    if not match: raise ValueError('Il remote origin non è un repository GitHub riconoscibile')
    return match.group(1)

def files_for_publication():
    directory=ROOT/'app/dist'
    required={'index.html','manifest.webmanifest','icon-192.png','icon-512.png','sw.js'}
    files={p.relative_to(directory).as_posix():p.read_bytes() for p in directory.rglob('*') if p.is_file()}
    if not required <= files.keys(): raise ValueError('Build incompleta: eseguire npm run build')
    if any(name not in required and not re.fullmatch(r'assets/[A-Za-z0-9_-]+\.(js|css)',name) for name in files): raise ValueError('File inatteso nella build: pubblicazione bloccata')
    # Confronto con i token effettivi locali; la chiave pubblicabile è prevista nel frontend.
    session=ROOT/'private/session.json'
    if session.exists():
        private=json.loads(session.read_text())
        def secrets(value):
            if isinstance(value,dict):
                for key,item in value.items():
                    if key in ('access_token','refresh_token') and isinstance(item,str): yield item
                    else: yield from secrets(item)
            elif isinstance(value,list):
                for item in value: yield from secrets(item)
        for secret in secrets(private):
            if any(secret.encode() in data for data in files.values()): raise ValueError('Token personale presente nella build')
    files['.nojekyll']=b''
    return files

def publish(repository,files):
    ref=api(f'repos/{repository}/git/ref/heads/gh-pages',optional=True)
    if ref is None:
        main=api(f'repos/{repository}/git/ref/heads/main')
        parent=main['object']['sha']
    else: parent=ref['object']['sha']
    entries=[]
    for path,content in sorted(files.items()):
        blob=api(f'repos/{repository}/git/blobs',{'content':base64.b64encode(content).decode(),'encoding':'base64'})
        entries.append({'path':path,'mode':'100644','type':'blob','sha':blob['sha']})
    tree=api(f'repos/{repository}/git/trees',{'tree':entries})
    commit=api(f'repos/{repository}/git/commits',{'message':'Pubblica build PWA','tree':tree['sha'],'parents':[parent]})
    if ref is None:
        api(f'repos/{repository}/git/refs',{'ref':'refs/heads/gh-pages','sha':commit['sha']})
    else:
        api(f'repos/{repository}/git/refs/heads/gh-pages',{'sha':commit['sha'],'force':False},method='PATCH')
    api(f'repos/{repository}/pages',{'source':{'branch':'gh-pages','path':'/'},'build_type':'legacy'},method='PUT')
    api(f'repos/{repository}/pages/builds',method='POST')
    print('Commit build: '+commit['sha'])

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--publish',action='store_true',help='pubblica la build sulla branch gh-pages')
    parser.add_argument('--repository',help='repository GitHub proprietario/nome; per default usa origin')
    args=parser.parse_args()
    files=files_for_publication()
    print('File pubblicabili: '+', '.join(sorted(files)))
    if not args.publish: return
    publish(args.repository or repository_from_remote(),files)
if __name__=='__main__': main()
