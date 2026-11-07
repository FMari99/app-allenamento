"""Verifica la build e, su richiesta, avvia il workflow GitHub Pages del repository."""
import argparse, json, re, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

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
    return files

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--publish',action='store_true',help='avvia il workflow Pubblica PWA sul branch corrente')
    args=parser.parse_args()
    files=files_for_publication()
    print('File pubblicabili: '+', '.join(sorted(files)))
    if not args.publish: return
    result=subprocess.run(['gh','workflow','run','deploy-pages.yml'],cwd=ROOT,text=True,capture_output=True)
    if result.returncode: raise RuntimeError(result.stderr.strip())
    print('Workflow di pubblicazione avviato su GitHub.')
if __name__=='__main__': main()
