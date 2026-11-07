"""Prepara o disattiva solo i dati fittizi del collaudo Android F5. Nessuna chiave admin."""
import argparse, json, sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from tools.workouts.cli import load_config, session_token  # noqa: E402
from tools.workouts.payload import compile_plan  # noqa: E402
from tools.workouts.transfer import Transfer, save_private  # noqa: E402
FOLDER=ROOT/'private/collaudo-telefono-f5'
def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('action',choices=['create','cleanup']);args=parser.parse_args()
    url,key=load_config(); client=Transfer(url,key,session_token(url,key))
    owner=client.call('/auth/v1/user')['id']
    path=FOLDER/'fixture.json'
    if args.action=='create':
        if path.exists():
            fixture=json.loads(path.read_text())
        else:
            mapping={}
            def fresh(value):
                if isinstance(value,dict): return {k:fresh(v) for k,v in value.items()}
                if isinstance(value,list): return [fresh(v) for v in value]
                if isinstance(value,str):
                    try: UUID(value)
                    except ValueError: return value
                    return mapping.setdefault(value,str(uuid4()))
                return value
            fixture=fresh(json.loads((ROOT/'examples/scheda-demo.json').read_text()))
            fixture['scheda']['nome']='Collaudo F5 — prova sul telefono'
            fixture['scheda']['note']='Solo test dei pulsanti e della sincronizzazione. Non occorre eseguire fisicamente gli esercizi. Questi dati verranno disattivati dopo la prova.'
            for workout in fixture['scheda']['allenamenti']:
                workout['nome']='Prova offline'; workout['note']='Conferma i valori dimostrativi e passa al successivo.'
            for exercise in fixture['esercizi']:
                exercise['nome']='Collaudo — '+exercise['nome']
                exercise['istruzioni']='Dati fittizi per la prova tecnica: conferma senza eseguire fisicamente l’esercizio.'
            save_private(path,fixture)
            save_private(FOLDER/'owner.json',{'owner':owner,'url':url})
        if json.loads((FOLDER/'owner.json').read_text())!={'owner':owner,'url':url}: raise ValueError('Account o progetto diverso dal collaudo preparato')
        client.call('/rest/v1/rpc/salva_gruppo',data=compile_plan(fixture))
        print('Scheda di collaudo pronta: '+fixture['scheda']['nome'])
        return
    fixture=json.loads(path.read_text())
    if json.loads((FOLDER/'owner.json').read_text())!={'owner':owner,'url':url}: raise ValueError('Account/progetto inatteso')
    original=compile_plan(fixture)
    ids={table:set() for table in ['strumenti','esercizi','esercizi_strumenti','attrezzatura_disponibile','schede','allenamenti','esercizi_allenamento','sessioni','esercizi_sessione']}
    for change in original['modifiche']: ids[change['tabella']].add(change['dati']['id'])
    remote={table:client.rows(table) for table in ids}
    ids['sessioni']={r['id'] for r in remote['sessioni'] if r['allenamento_id'] in ids['allenamenti']}
    ids['esercizi_sessione']={r['id'] for r in remote['esercizi_sessione'] if r['sessione_id'] in ids['sessioni']}
    journal=FOLDER/'cleanup.json'
    if journal.exists(): payload=json.loads(journal.read_text())
    else:
        now=datetime.now(timezone.utc).isoformat()
        changes=[]
        for table,rows in remote.items():
            for row in rows:
                if row['id'] not in ids[table] or row['deleted_at']: continue
                data={'id':row['id'],'deleted_at':now}
                if table=='schede': data['revisione']=row['revisione']+1
                changes.append({'tabella':table,'versione_attesa':row['row_version'],'dati':data})
        if not changes: print('Collaudo già disattivato'); return
        payload={'operation_id':str(uuid4()),'modifiche':changes};save_private(journal,payload)
    client.call('/rest/v1/rpc/salva_gruppo',data=payload)
    print('Dati di collaudo disattivati. Sul telefono premi Sincronizza; non creare nuove sessioni di prova.')
if __name__=='__main__':main()
