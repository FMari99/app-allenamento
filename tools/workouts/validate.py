"""Validazione del contratto v1, senza accesso alla rete né scritture remote."""
import argparse
import json
from pathlib import Path
from uuid import UUID
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[2]
CATEGORIES = {
    'ripetizioni': {'serie', 'ripetizioni'},
    'ripetizioni_carico': {'serie', 'ripetizioni', 'carico_kg'},
    'durata': {'serie', 'durata_secondi'},
    'durata_carico': {'serie', 'durata_secondi', 'carico_kg'},
    'distanza_durata': {'distanza_metri', 'durata_secondi'},
}

def validate_structure(data):
    """Controlla il contratto anche prima di accedere al servizio remoto."""
    json.dumps(data, allow_nan=False)
    version = data.get('formato_versione', 1)
    if version not in (1, 2, 3):
        raise ValueError('Versione contratto non supportata')
    schema = json.loads((ROOT / f'schemas/scheda-v{version}.schema.json').read_text())
    errors = sorted(Draft202012Validator(schema, format_checker=FormatChecker()).iter_errors(data), key=lambda e: str(e.path))
    if errors:
        raise ValueError('; '.join(f'{"/".join(map(str,e.path))}: {e.message}' for e in errors))
    def canonical(value):
        if isinstance(value, dict):
            for key, item in value.items():
                if key == 'id' or key.endswith('_id'):
                    if str(UUID(item)) != item:
                        raise ValueError(f'Usare UUID canonici minuscoli: {key}')
                else:
                    canonical(item)
        elif isinstance(value, list):
            for item in value:
                canonical(item)
    canonical(data)
    return data


def validate(data, catalog=None):
    """catalog: contesto esportato, necessario per riferimenti preesistenti."""
    validate_structure(data)
    known = catalog or {'esercizi': [], 'strumenti': []}
    seen = set()
    def unique(items):
        for item in items:
            if item['id'] in seen:
                raise ValueError(f'ID duplicato: {item["id"]}')
            seen.add(item['id'])
    unique(data['strumenti']); unique(data['esercizi']); unique([data['scheda']])
    active_tools = [x for x in known['strumenti'] if not x.get('deleted_at')]
    active_exercises = [x for x in known['esercizi'] if not x.get('deleted_at')]
    if {x['id'] for x in data['strumenti']} & {x['id'] for x in active_tools}:
        raise ValueError('Per riutilizzare uno strumento esistente usare solo il suo ID')
    tools = {x['id'] for x in active_tools} | {x['id'] for x in data['strumenti']}
    exercises = {x['id']: x for x in active_exercises}
    for e in data['esercizi']:
        if e['id'] in exercises:
            raise ValueError('Per riutilizzare un esercizio esistente usare solo il suo ID nella scheda')
        fields = CATEGORIES[e['categoria']]
        for field, required in [('convenzione_carico','carico_kg' in fields), ('convenzione_ripetizioni','ripetizioni' in fields)]:
            if bool(e[field]) != required:
                raise ValueError(f'Convenzione incoerente: {e["nome"]}/{field}')
        refs = [x['strumento_id'] for x in e['strumenti']]
        if len(refs) != len(set(refs)) or any(x not in tools for x in refs):
            raise ValueError('Strumenti duplicati o sconosciuti')
        exercises[e['id']] = e
    names = [x['nome'].strip().casefold() for x in active_tools + data['strumenti']]
    if len(names) != len(set(names)):
        raise ValueError('Nomi strumenti duplicati')
    warmups = data['scheda'].get('riscaldamenti', [])
    warmup_ids = {w['id'] for w in warmups}
    for workout in data['scheda']['allenamenti']:
        if 'riscaldamento_id' in workout and workout['riscaldamento_id'] not in warmup_ids:
            raise ValueError('Riscaldamento sconosciuto nella scheda')
    for workout in warmups + data['scheda']['allenamenti']:
        unique([workout]); unique(workout['esercizi'])
        for entry in workout['esercizi']:
            e = exercises.get(entry['esercizio_id'])
            if e is None:
                raise ValueError('Riferimento a esercizio sconosciuto')
            if set(entry['valori']) != CATEGORIES[e['categoria']]:
                raise ValueError(f'Valori incompatibili con {e["categoria"]}')
    return data

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('file', type=Path)
    parser.add_argument('--catalogo', type=Path)
    args = parser.parse_args()
    try:
        data = validate(json.loads(args.file.read_text()), json.loads(args.catalogo.read_text()) if args.catalogo else None)
    except (ValueError, OSError, KeyError) as error:
        parser.exit(1, f'Scheda non valida: {error}\n')
    print(f"Valida: {data['scheda']['nome']}; {len(data['scheda']['allenamenti'])} allenamenti, {len(data['esercizi'])} nuovi esercizi. Nessun caricamento eseguito.")
