import copy
import json
from pathlib import Path
import unittest
from tools.workouts.validate import validate

class ContractTest(unittest.TestCase):
    def setUp(self):
        self.data = json.loads(Path('examples/scheda-demo.json').read_text())
    def test_five_categories(self):
        validate(self.data)
        self.assertEqual(len(self.data['esercizi']), 5)
    def test_invalid(self):
        mutations = [
            lambda d: d['scheda']['allenamenti'][0]['esercizi'][0]['valori'].update(serie=0),
            lambda d: d['scheda']['allenamenti'][0]['esercizi'][0].update(esercizio_id=d['scheda']['id']),
            lambda d: d['esercizi'][0].update(convenzione_carico='totale'),
            lambda d: d['esercizi'][1].update(id=d['esercizi'][0]['id']),
            lambda d: d.update(password='segreta'),
            lambda d: d['scheda']['allenamenti'][0]['esercizi'][0].update(valori={'serie':3,'durata_secondi':30}),
        ]
        for mutation in mutations:
            with self.subTest(mutation=mutation):
                d=copy.deepcopy(self.data); mutation(d)
                with self.assertRaises(ValueError): validate(d)
    def test_existing_catalog(self):
        catalog={'esercizi':self.data.pop('esercizi'),'strumenti':[]}
        self.data['esercizi']=[]
        validate(self.data,catalog)
    def test_compile_preserves_ai_and_current(self):
        from tools.workouts.payload import compile_plan
        payload=compile_plan(self.data)
        self.assertEqual(payload['operation_id'],self.data['operation_id'])
        rows=[x['dati'] for x in payload['modifiche'] if x['tabella']=='esercizi_allenamento']
        self.assertEqual(len(rows),5)
        for row in rows:
            for key in list(row):
                if key.startswith('ai_'): self.assertEqual(row[key],row['corrente_'+key[3:]])

    def test_rest_v2_and_legacy_v1(self):
        from tools.workouts.payload import compile_plan
        rows=[m['dati'] for m in compile_plan(self.data)['modifiche'] if m['tabella']=='esercizi_allenamento']
        self.assertEqual(rows[0]['ai_recupero_serie_secondi'],10)
        bad=copy.deepcopy(self.data)
        bad['scheda']['allenamenti'][0]['esercizi'][0]['recuperi']['tra_serie_secondi']=-1
        with self.assertRaises(ValueError): validate(bad)
        legacy=copy.deepcopy(self.data);legacy['formato_versione']=1
        for w in legacy['scheda']['allenamenti']:
            for e in w['esercizi']:e.pop('recuperi')
        oldrows=[m['dati'] for m in compile_plan(legacy)['modifiche'] if m['tabella']=='esercizi_allenamento']
        self.assertNotIn('ai_recupero_serie_secondi',oldrows[0])

    def test_warmups_v3_compile_once_and_reuse_selectively(self):
        from tools.workouts.payload import compile_plan
        d=json.loads(Path('examples/scheda-riscaldamenti-demo.json').read_text())
        warm=d['scheda']['riscaldamenti'][0]
        specific=copy.deepcopy(warm);specific['id']='00000000-0000-0000-0000-0000000000c0';specific['esercizi'][0]['id']='00000000-0000-0000-0000-0000000000c1'
        d['scheda']['riscaldamenti'].append(specific)
        third=copy.deepcopy(d['scheda']['allenamenti'][1]);third['id']='00000000-0000-0000-0000-0000000000c2';third['esercizi'][0]['id']='00000000-0000-0000-0000-0000000000c3';third['riscaldamento_id']=specific['id'];d['scheda']['allenamenti'].append(third)
        rows=compile_plan(d)['modifiche'];blocks=[r['dati'] for r in rows if r['tabella']=='allenamenti']
        self.assertEqual(len(blocks),5)
        self.assertEqual([r['riscaldamento_id'] for r in blocks if r['tipo']=='allenamento'],[warm['id'],warm['id'],specific['id']])
        entries=[r for r in rows if r['tabella']=='esercizi_allenamento' and r['dati']['allenamento_id']==warm['id']]
        self.assertEqual(len(entries),1)
        bad=copy.deepcopy(d);bad['scheda']['allenamenti'][0]['riscaldamento_id']=third['id']
        with self.assertRaisesRegex(ValueError,'Riscaldamento sconosciuto'):compile_plan(bad)
        bad=copy.deepcopy(d);bad['scheda']['riscaldamenti'][0]['esercizi'][0]['id']=third['esercizi'][0]['id']
        with self.assertRaisesRegex(ValueError,'ID duplicato'):compile_plan(bad)

    def test_legacy_v2_has_no_new_warmup_fields(self):
        from tools.workouts.payload import compile_plan
        rows=compile_plan(self.data)['modifiche']
        for row in rows:
            self.assertNotIn('tipo',row['dati'])
            self.assertNotIn('riscaldamento_id',row['dati'])
