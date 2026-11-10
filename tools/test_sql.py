"""Esegue migrazione e test su un cluster effimero senza socket o Docker."""
from pathlib import Path
import subprocess
import argparse
import tempfile

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--setup',action='store_true',help='Verifica il pacchetto SQL Editor al posto delle singole migrazioni')
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
versions=sorted(Path('/usr/lib/postgresql').glob('*/bin/postgres'),key=lambda p:int(p.parents[1].name))
if not versions: raise SystemExit('PostgreSQL locale non disponibile: eseguire i test in F2.')
postgres=versions[-1]; initdb=postgres.parent/'initdb'
with tempfile.TemporaryDirectory(prefix='allenamento-sql-') as directory:
    subprocess.run([str(initdb),'-D',directory,'-A','trust','--no-locale','-E','UTF8'],check=True,stdout=subprocess.DEVNULL)
    migrations=[root/'supabase/setup/01_installazione.sql'] if args.setup else sorted((root/'supabase/migrations').glob('*.sql'))
    files=[root/'supabase/tests/bootstrap_locale.sql',*migrations,root/'supabase/tests/fondazioni.sql',root/'supabase/tests/recuperi.sql',root/'supabase/tests/riscaldamenti.sql',root/'supabase/tests/prossima_esecuzione.sql',root/'supabase/tests/attrezzatura.sql']
    # Il backend single-user legge un comando per riga: manteniamo ogni file su una riga.
    import re
    commands="select set_config('app.test_single_user','true',false);\n"+'\n'.join(re.sub(r'--[^\n]*','',p.read_text()).replace('\n',' ').replace('; set local role authenticated;', ';\nset local role authenticated;\n').replace('; select set_config', ';\nselect set_config').replace('; do $test$', ';\ndo $test$') for p in files)+'\n'
    result=subprocess.run([str(postgres),'--single','-D',directory,'postgres'],input=commands,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    if result.returncode or 'ERROR:' in result.stdout or 'FATAL:' in result.stdout:
        print(result.stdout); raise SystemExit(1)
    print('SQL: migrazione, proprietà nelle RPC, rollback, conflitti e reinvii verificati su PostgreSQL '+postgres.parents[1].name)
    print('RLS non verificata: il backend single-user la disabilita. Verifica reale richiesta in F2.')
