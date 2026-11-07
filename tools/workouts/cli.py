"""Accesso, esportazione e caricamento schede: nessuna password negli argomenti o nella chat."""
import argparse
import base64
import getpass
import json
import os
from pathlib import Path
import tempfile
from urllib.parse import urlparse
from tools.workouts.remote import RemoteError, request
from tools.workouts.validate import ROOT, validate, validate_structure
from tools.workouts.transfer import Transfer, read_json, summary

SESSION=ROOT/'private/session.json'

def load_config():
    path=ROOT/'.env.local'
    if not path.exists(): raise ValueError('Prima eseguire configure')
    config=dict(line.split('=',1) for line in path.read_text().splitlines() if line and not line.startswith('#') and '=' in line)
    url=config.get('VITE_SUPABASE_URL','').strip()
    key=config.get('VITE_SUPABASE_PUBLISHABLE_KEY','').strip()
    validate_project_url(url)
    if not key: raise ValueError('Configurazione incompleta: chiave Publishable assente')
    return url,key

def validate_project_url(url):
    parsed=urlparse(url)
    if parsed.scheme!='https' or not parsed.netloc or parsed.path not in ('','/') or parsed.params or parsed.query or parsed.fragment:
        raise ValueError('Usare l’URL HTTPS del progetto Supabase, senza percorsi aggiuntivi')
    return url.rstrip('/')

def validate_public_key(key):
    if key.startswith('sb_publishable_') and len(key)>20: return
    # Compatibilità con la chiave anon JWT, mai con service_role.
    try:
        part=key.split('.')[1]
        claims=json.loads(base64.urlsafe_b64decode(part+'='*(-len(part)%4)))
        if claims.get('role')=='anon': return
    except (IndexError,ValueError,TypeError): pass
    raise ValueError('Usare la chiave Publishable (sb_publishable_...) oppure la legacy anon; mai secret/service_role')

def save_session(data):
    SESSION.parent.mkdir(mode=0o700,exist_ok=True)
    os.chmod(SESSION.parent,0o700)
    # Scrittura atomica: nessun intervallo in cui il file token è leggibile da altri.
    fd,temp=tempfile.mkstemp(dir=SESSION.parent,prefix='session-',suffix='.tmp')
    try:
        with os.fdopen(fd,'w') as stream: json.dump(data,stream)
        os.replace(temp,SESSION)
    finally:
        if os.path.exists(temp): os.unlink(temp)

def session_token(url,key):
    if not SESSION.exists(): raise ValueError('Prima eseguire login')
    session=json.loads(SESSION.read_text())
    if session.get('project_url')!=url: raise ValueError('Sessione associata a un altro progetto')
    # Il refresh permette a più invocazioni successive di usare una sessione persistente.
    result=request(url,key,'/auth/v1/token?grant_type=refresh_token',data={'refresh_token':session['refresh_token']})
    result['project_url']=url
    save_session(result)
    return result['access_token']

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    subparsers=parser.add_subparsers(dest='command',required=True)
    for name in ('configure','login','check'):
        subparsers.add_parser(name)
    export=subparsers.add_parser('export',help='Esporta catalogo, schede, attrezzatura e storico sincronizzato')
    export.add_argument('--output',type=Path,default=ROOT/'private/contesto.json')
    prepare=subparsers.add_parser('prepare',help='Valida e riepiloga senza rete o caricamento')
    prepare.add_argument('file',type=Path)
    prepare.add_argument('--catalogo',type=Path)
    upload=subparsers.add_parser('upload',help='Valida sul catalogo reale e invia un gruppo atomico ripetibile')
    upload.add_argument('file',type=Path)
    args=parser.parse_args()
    try:
        if args.command=='prepare':
            data=read_json(args.file)
            validate(data,read_json(args.catalogo) if args.catalogo else None)
            print(summary(data)+'. Nessun caricamento eseguito.')
            return
        if args.command=='configure':
            url=validate_project_url(input('URL del progetto Supabase (https://…supabase.co): ').strip())
            key=getpass.getpass('Chiave Publishable da Project Settings > API Keys: ').strip()
            validate_public_key(key)
            (ROOT/'.env.local').write_text(f'VITE_SUPABASE_URL={url}\nVITE_SUPABASE_PUBLISHABLE_KEY={key}\n')
            print('Configurazione salvata per il progetto previsto. Nessuna password salvata.')
            return
        url,key=load_config()
        validate_public_key(key)
        if args.command=='login':
            email=input('Email del tuo account dell’app: ').strip()
            password=getpass.getpass('Password dell’account dell’app (non del database): ')
            result=request(url,key,'/auth/v1/token?grant_type=password',data={'email':email,'password':password})
            result['project_url']=url
            save_session(result)
            print('Accesso riuscito. Sessione conservata localmente con permessi riservati.')
            return
        # Rifiuta struttura/JSON errati prima di qualsiasi richiesta di upload.
        if args.command=='upload':
            data=validate_structure(read_json(args.file))
        token=session_token(url,key)
        transfer=Transfer(url,key,token)
        if args.command=='export':
            data=transfer.export(args.output)
            print(f"Contesto esportato in {args.output}: {len(data['schede'])} schede, "
                  f"{len(data['esercizi'])} esercizi, {len(data['sessioni'])} sessioni (incluse righe disattivate).")
            return
        if args.command=='upload':
            transfer.upload(data)
            print('Scheda salvata. Ripetere lo stesso file riutilizza la stessa operazione senza duplicati.')
            return
        user=request(url,key,'/auth/v1/user',token=token)
        rows=request(url,key,'/rest/v1/strumenti?select=id&limit=1',token=token)
        if not user.get('id') or not isinstance(rows,list): raise ValueError('Risposta inattesa dal servizio')
        # Non è una prova RLS: la diagnosi RLS separata usa righe reali temporanee.
        print('Login, rinnovo sessione e lettura Data API riusciti. Le verifiche SQL restano separate.')
    except (RemoteError,ValueError,OSError,KeyError) as error:
        retry = ('\nSe l’invio è già partito, conservare file e diario: ripetere lo stesso comando '
                 'senza cambiare ID o contenuto per recuperare la ricevuta.' if args.command=='upload' else '')
        parser.exit(1,f'Operazione non completata: {error}{retry}\n')

if __name__=='__main__': main()
