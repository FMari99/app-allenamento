"""Esportazione del contesto e invii atomici ripetibili tramite l'account personale."""
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import tempfile
from urllib.parse import urlencode

from tools.workouts.payload import compile_plan
from tools.workouts.remote import request
from tools.workouts.validate import ROOT, validate_structure

TABLES = ('strumenti', 'esercizi', 'esercizi_strumenti', 'attrezzatura_disponibile',
          'schede', 'allenamenti', 'esercizi_allenamento', 'sessioni', 'esercizi_sessione')
PAGE_SIZE = 500


def ai_context(data):
    """Contesto di generazione: solo strumenti attivi dichiarati disponibili, con note."""
    available = {row['strumento_id'] for row in data['attrezzatura_disponibile'] if not row.get('deleted_at')}
    live_tools = {row['id'] for row in data['strumenti'] if not row.get('deleted_at')}
    selected = available & live_tools
    result = {key: value for key, value in data.items() if key != 'operazioni_sync'}
    result['strumenti'] = [{**row, 'note': row.get('note', '')} for row in data['strumenti'] if row['id'] in selected]
    result['attrezzatura_disponibile'] = [row for row in data['attrezzatura_disponibile'] if not row.get('deleted_at') and row['strumento_id'] in selected]
    links = [row for row in data['esercizi_strumenti'] if not row.get('deleted_at') and row['strumento_id'] in live_tools]
    result['esercizi_strumenti'] = [row for row in links if row['strumento_id'] in selected]
    result['esercizi_non_compatibili'] = sorted({row['esercizio_id'] for row in links if row['ruolo'] == 'necessario' and row['strumento_id'] not in selected})
    result['meta'] = {**data['meta'], 'contesto_ai': True,
                      'attrezzatura': 'Solo strumenti presenti e disponibili. Considerare le note libere. '
                      'Le schede esistenti restano invariate; nessuna sostituzione automatica.'}
    return result


def read_json(path):
    def invalid(value):
        raise ValueError(f'Numero JSON non valido: {value}')
    return json.loads(Path(path).read_text(), parse_constant=invalid)


def save_private(path, data):
    """Scrive atomicamente solo nella cartella privata del progetto."""
    path = Path(path).resolve()
    private = (ROOT / 'private').resolve()
    if not path.is_relative_to(private) or path == private:
        raise ValueError('Salvare dati personali soltanto nella cartella private del progetto')
    path.parent.mkdir(parents=True, mode=0o700, exist_ok=True)
    os.chmod(private, 0o700)
    os.chmod(path.parent, 0o700)
    fd, temporary = tempfile.mkstemp(dir=path.parent, prefix='.scrittura-', suffix='.tmp')
    try:
        with os.fdopen(fd, 'w') as stream:
            json.dump(data, stream, ensure_ascii=False, indent=2, allow_nan=False)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    return path


class Transfer:
    def __init__(self, url, key, token):
        self.url, self.key, self.token = url, key, token

    def call(self, path, **kwargs):
        return request(self.url, self.key, path, token=self.token, **kwargs)

    def rows(self, table, *, filters=None):
        if table not in (*TABLES, 'operazioni_sync'):
            raise ValueError('Tabella non consentita')
        column = 'operation_id' if table == 'operazioni_sync' else 'id'
        result, cursor = [], None
        while True:
            query = {'select': '*', 'order': f'{column}.asc', 'limit': PAGE_SIZE, **(filters or {})}
            if cursor is not None:
                if column in query:
                    query['and'] = f'({column}.{query.pop(column)},{column}.gt.{cursor})'
                else:
                    query[column] = f'gt.{cursor}'
            page = self.call('/rest/v1/' + table + '?' + urlencode(query))
            if not isinstance(page, list):
                raise ValueError('Risposta Data API inattesa')
            if not page:
                return result
            next_cursor = page[-1][column]
            if cursor is not None and next_cursor <= cursor:
                raise ValueError('Paginazione Data API non avanza')
            result.extend(page)
            cursor = next_cursor
            # Anche con limiti server inferiori a PAGE_SIZE, proseguire fino alla pagina vuota.

    def catalog(self):
        return {table: self.rows(table, filters={'deleted_at': 'is.null'})
                for table in ('strumenti', 'esercizi')}

    def export(self, path, *, for_ai=False):
        started = datetime.now(timezone.utc).isoformat()
        data = {table: self.rows(table) for table in TABLES}
        data['operazioni_sync'] = self.rows('operazioni_sync')
        data['meta'] = {
            'formato_versione': 1, 'project_url': self.url,
            'iniziata_at': started, 'esportata_at': datetime.now(timezone.utc).isoformat(),
            'nota': 'Solo dati già sincronizzati. Letture paginate, non uno snapshot transazionale. '
                    'Conservare le righe disattivate per ricostruire lo storico; '
                    'usare solo voci attive nelle nuove schede.',
        }
        if for_ai:
            data = ai_context(data)
        save_private(path, data)
        return data

    def upload(self, data, *, report=print):
        validate_structure(data)
        user = self.call('/auth/v1/user')
        owner = user['id']
        digest = hashlib.sha256(json.dumps(data, sort_keys=True, allow_nan=False).encode()).hexdigest()
        journal_path = ROOT / 'private' / 'invii' / owner / (data['operation_id'] + '.json')
        if journal_path.exists():
            journal = read_json(journal_path)
            if (journal['project_url'], journal['user_id'], journal['source_hash']) != (self.url, owner, digest):
                raise ValueError('Operazione già preparata con contenuto diverso: ripristinare il file originale; '
                                 'per una nuova scheda usare nuovi ID e operation_id')
            payload = journal['payload']
        else:
            catalog = self.catalog()
            receipt = self.rows('operazioni_sync', filters={'operation_id': 'eq.' + data['operation_id']})
            if receipt:
                # Ripartenza senza diario locale: ricostruisce lo stesso payload.
                # La RPC controlla che l'impronta sia identica all'operazione già registrata.
                for table in ('strumenti', 'esercizi'):
                    new_ids = {row['id'] for row in data[table]}
                    catalog[table] = [row for row in catalog[table] if row['id'] not in new_ids]
            payload = compile_plan(data, catalog)
            if not receipt:
                # Non trasformare una creazione in un aggiornamento o in un reinvio di un'altra operazione.
                for table in {change['tabella'] for change in payload['modifiche']}:
                    existing = {row['id'] for row in self.rows(table)}
                    if any(change['dati']['id'] in existing for change in payload['modifiche']
                           if change['tabella'] == table):
                        raise ValueError(f'ID già presente in {table}: per una nuova scheda usare nuovi ID')
            journal = {'project_url': self.url, 'user_id': owner, 'source_hash': digest,
                       'payload': payload, 'stato': 'preparato'}
            save_private(journal_path, journal)
        report(summary(data) + f"; {len(payload['modifiche'])} righe nel gruppo atomico.")
        result = self.call('/rest/v1/rpc/salva_gruppo', data=payload)
        if not isinstance(result, list) or len(result) != len(payload['modifiche']):
            raise ValueError('Risposta RPC inattesa: conservare file e diario per ripetere lo stesso invio')
        journal.update(stato='confermato', risultato=result)
        save_private(journal_path, journal)
        return result


def summary(data):
    workouts = data['scheda']['allenamenti']
    warmups = data['scheda'].get('riscaldamenti', [])
    def count(number, singular, plural):
        return f'{number} {singular if number == 1 else plural}'
    return (f"Scheda: {data['scheda']['nome']}; "
            f"{count(len(workouts), 'allenamento', 'allenamenti')}, {len(warmups)} blocchi riscaldamento, "
            f"{count(sum(len(w['esercizi']) for w in warmups + workouts), 'voce', 'voci')}; "
            f"{count(len(data['esercizi']), 'nuovo esercizio', 'nuovi esercizi')} e "
            f"{count(len(data['strumenti']), 'nuovo strumento', 'nuovi strumenti')}")
