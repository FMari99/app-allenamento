import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from uuid import uuid4

from tools.workouts import transfer
from tools.workouts.remote import RemoteError
from tools.workouts.validate import validate


class TransferTest(unittest.TestCase):
    def test_ai_context_shows_only_available_live_tools_with_notes(self):
        data = {table: [] for table in transfer.TABLES}
        data.update(meta={}, operazioni_sync=[{'risultato': [{'nome': 'Attrezzo non disponibile'}]}])
        data['strumenti'] = [{'id': 'yes', 'nome': 'Manubri', 'note': 'Fino a 10 kg'},
                             {'id': 'park', 'nome': 'Sbarra', 'note': 'Al parco'},
                             {'id': 'no', 'nome': 'Panca'}, {'id': 'gone', 'nome': 'Eliminato', 'deleted_at': 'oggi'}]
        data['attrezzatura_disponibile'] = [{'strumento_id': 'yes'}, {'strumento_id': 'park'}, {'strumento_id': 'gone'}, {'strumento_id': 'no', 'deleted_at': 'oggi'}]
        data['esercizi_strumenti'] = [{'esercizio_id': 'e1', 'strumento_id': 'yes', 'ruolo': 'necessario'},
                                      {'esercizio_id': 'e2', 'strumento_id': 'no', 'ruolo': 'necessario'},
                                      {'esercizio_id': 'e3', 'strumento_id': 'gone', 'ruolo': 'necessario'},
                                      {'esercizio_id': 'e4', 'strumento_id': 'no', 'ruolo': 'utile'}]
        before = copy.deepcopy(data)
        result = transfer.ai_context(data)
        self.assertEqual([r['id'] for r in result['strumenti']], ['yes', 'park'])
        self.assertEqual(result['strumenti'][1]['note'], 'Al parco')
        self.assertEqual(result['esercizi_non_compatibili'], ['e2'])
        self.assertEqual(len(result['esercizi_strumenti']), 1)
        self.assertNotIn('operazioni_sync', result)
        self.assertEqual(data, before)

    def setUp(self):
        self.data = json.loads(Path('examples/scheda-demo.json').read_text())

    def test_pagination_does_not_assume_server_page_size(self):
        client = transfer.Transfer('https://test.invalid', 'public', 'token')
        with patch.object(client, 'call', side_effect=[[{'id': 'a'}], [{'id': 'b'}], []]) as call:
            self.assertEqual(client.rows('schede'), [{'id': 'a'}, {'id': 'b'}])
        self.assertIn('id=gt.a', call.call_args_list[1].args[0])

    def test_pagination_keeps_receipt_filter(self):
        client = transfer.Transfer('https://test.invalid', 'public', 'token')
        with patch.object(client, 'call', side_effect=[[{'operation_id': 'a'}], []]) as call:
            client.rows('operazioni_sync', filters={'operation_id': 'eq.a'})
        from urllib.parse import parse_qs, urlsplit
        query = parse_qs(urlsplit(call.call_args_list[1].args[0]).query)
        self.assertEqual(query['and'], ['(operation_id.eq.a,operation_id.gt.a)'])

    def test_private_export_preserves_old_references_and_excludes_session_secrets(self):
        client = transfer.Transfer('https://test.invalid', 'public', 'token')
        old = {'id': 'old', 'deleted_at': '2026-10-01'}
        with tempfile.TemporaryDirectory() as directory, patch.object(transfer, 'ROOT', Path(directory)):
            destination = Path(directory) / 'private/contesto.json'
            with patch.object(client, 'rows', return_value=[old]):
                result = client.export(destination)
            self.assertEqual(result['esercizi'][0], old)
            self.assertNotIn('token', destination.read_text())
            self.assertEqual(destination.stat().st_mode & 0o777, 0o600)
            with self.assertRaises(ValueError):
                transfer.save_private(Path(directory) / 'app/public/context.json', {})

    def test_lost_response_reuses_saved_payload_even_after_catalog_populated(self):
        client = transfer.Transfer('https://test.invalid', 'public', 'token')
        sent = []
        def call(path, **kwargs):
            if path == '/auth/v1/user':
                return {'id': 'personal-user'}
            sent.append(copy.deepcopy(kwargs['data']))
            if len(sent) == 1:
                raise RemoteError(0, 'Risposta persa dopo commit')
            return [{}] * len(kwargs['data']['modifiche'])
        with tempfile.TemporaryDirectory() as directory, patch.object(transfer, 'ROOT', Path(directory)):
            with patch.object(client, 'call', side_effect=call), patch.object(client, 'rows', return_value=[]):
                with self.assertRaises(RemoteError):
                    client.upload(self.data, report=lambda _: None)
            with patch.object(client, 'call', side_effect=call), patch.object(client, 'catalog', side_effect=AssertionError('Catalogo non necessario')):
                client.upload(self.data, report=lambda _: None)
                changed = copy.deepcopy(self.data)
                changed['scheda']['nome'] = 'Modifica dopo il primo tentativo'
                with self.assertRaisesRegex(ValueError, 'contenuto diverso'):
                    client.upload(changed, report=lambda _: None)
            self.assertEqual(sent[0], sent[1])

    def test_existing_remote_receipt_without_journal_reconstructs_same_payload(self):
        from tools.workouts.payload import compile_plan
        client = transfer.Transfer('https://test.invalid', 'public', 'token')
        def rows(table, **kwargs):
            if table == 'esercizi':
                return self.data['esercizi']
            if table == 'operazioni_sync':
                return [{'operation_id': self.data['operation_id']}]
            return []
        expected = compile_plan(self.data)
        def call(path, **kwargs):
            if path == '/auth/v1/user':
                return {'id': 'personal-user'}
            self.assertEqual(kwargs['data'], expected)
            return [{}] * len(expected['modifiche'])
        with tempfile.TemporaryDirectory() as directory, patch.object(transfer, 'ROOT', Path(directory)):
            with patch.object(client, 'call', side_effect=call), patch.object(client, 'rows', side_effect=rows):
                client.upload(self.data, report=lambda _: None)

    def test_existing_plan_id_is_not_reused_for_another_operation(self):
        client = transfer.Transfer('https://test.invalid', 'public', 'token')
        def rows(table, **kwargs):
            return [{'id': self.data['scheda']['id']}] if table == 'schede' else []
        with tempfile.TemporaryDirectory() as directory, patch.object(transfer, 'ROOT', Path(directory)):
            with patch.object(client, 'call', return_value={'id': 'personal-user'}) as call, patch.object(client, 'rows', side_effect=rows):
                with self.assertRaisesRegex(ValueError, 'ID già presente'):
                    client.upload(self.data, report=lambda _: None)
                self.assertEqual(call.call_count, 1)  # Solo verifica utente, nessuna RPC.

    def test_deleted_catalog_and_nonfinite_measures_rejected(self):
        catalog = {'esercizi': copy.deepcopy(self.data['esercizi']), 'strumenti': []}
        catalog['esercizi'][0]['deleted_at'] = '2026-10-01'
        data = copy.deepcopy(self.data)
        data['esercizi'] = []
        with self.assertRaisesRegex(ValueError, 'sconosciuto'):
            validate(data, catalog)
        self.data['scheda']['allenamenti'][0]['esercizi'][1]['valori']['carico_kg'] = float('nan')
        with self.assertRaises(ValueError):
            validate(self.data)

    def test_tool_reuse_requires_reference_instead_of_recreation(self):
        identifier = str(uuid4())
        self.data['strumenti'] = [{'id': identifier, 'nome': 'Manubrio'}]
        with self.assertRaisesRegex(ValueError, 'strumento esistente'):
            validate(self.data, {'strumenti': self.data['strumenti'], 'esercizi': []})
