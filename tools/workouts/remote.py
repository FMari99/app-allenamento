"""Accesso Supabase via HTTPS con chiave pubblicabile e login personale."""
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

class RemoteError(Exception):
    def __init__(self,status,message):
        super().__init__(message)
        self.status=status

def request(url,key,path,*,token=None,data=None,method=None):
    headers={'apikey':key,'Content-Type':'application/json'}
    if token: headers['Authorization']='Bearer '+token
    body=json.dumps(data,allow_nan=False).encode() if data is not None else None
    req=Request(url+path,data=body,headers=headers,method=method)
    try:
        with urlopen(req,timeout=25) as response:
            content=response.read()
            return json.loads(content) if content else None
    except HTTPError as error:
        # Nessun header o payload nella diagnostica: possono contenere password/token.
        try:
            content=json.loads(error.read())
            message=content.get('msg') or content.get('message') or content.get('error_description') or 'Richiesta rifiutata'
        except (ValueError,AttributeError): message='Richiesta rifiutata'
        raise RemoteError(error.code,message) from None
    except (URLError,TimeoutError):
        raise RemoteError(0,'Connessione non disponibile: riprovare con la rete attiva') from None
