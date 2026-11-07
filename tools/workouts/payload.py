"""Conversione contratto scheda v1 → righe della RPC salva_gruppo."""
from uuid import UUID, uuid5
from tools.workouts.validate import validate

def compile_plan(data, catalog=None):
    validate(data, catalog)
    changes=[]
    def add(table, values):
        changes.append({'tabella':table,'versione_attesa':0,'dati':values})
    for tool in data['strumenti']:
        add('strumenti', tool.copy())
    for exercise in data['esercizi']:
        add('esercizi', {key:value for key,value in exercise.items() if key!='strumenti'})
        for association in exercise['strumenti']:
            add('esercizi_strumenti', {
                'id':str(uuid5(UUID(exercise['id']), association['strumento_id'])),
                'esercizio_id':exercise['id'], **association,
            })
    plan=data['scheda']
    add('schede', {key:value for key,value in plan.items() if key not in ('allenamenti','riscaldamenti')})
    blocks = plan.get('riscaldamenti', [])
    for position, workout in enumerate(blocks + plan['allenamenti'],1):
        extra = {'tipo':'riscaldamento' if position <= len(blocks) else 'allenamento'} if data['formato_versione'] >= 3 else {}
        add('allenamenti', {key:value for key,value in workout.items() if key!='esercizi'} | {'scheda_id':plan['id'],'posizione':position} | extra)
        for position, entry in enumerate(workout['esercizi'],1):
            add('esercizi_allenamento', {
                'id':entry['id'],'esercizio_id':entry['esercizio_id'],
                'allenamento_id':workout['id'],'posizione':position,'note':entry['note'],
                **{f'{prefix}_recupero_{kind}_secondi':entry['recuperi'][key] for prefix in ['ai','corrente'] for kind,key in [('serie','tra_serie_secondi'),('esercizio','dopo_esercizio_secondi')] if 'recuperi' in entry},
                **{f'{prefix}_{key}':value for prefix in ['ai','corrente'] for key,value in entry['valori'].items()},
            })
    return {'operation_id':data['operation_id'],'modifiche':changes}
