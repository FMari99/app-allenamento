import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from tools.workouts import cli

class RemoteAccessTest(unittest.TestCase):
    def test_accepts_only_project_root_https_urls(self):
        self.assertEqual(cli.validate_project_url('https://example.supabase.co/'),'https://example.supabase.co')
        for url in ['', 'http://example.supabase.co', 'https://example.supabase.co/rest/v1', 'https://example.supabase.co?x=1']:
            with self.subTest(url=url),self.assertRaises(ValueError): cli.validate_project_url(url)
    def test_rejects_administrative_keys(self):
        for key in ['sb_secret_test','', 'service_role']:
            with self.subTest(key=key),self.assertRaises(ValueError): cli.validate_public_key(key)
        cli.validate_public_key('sb_publishable_example_for_tests')
    def test_session_permissions_and_atomic_replace(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'private/session.json'
            with patch.object(cli,'SESSION',path):
                cli.save_session({'refresh_token':'fittizio'})
                cli.save_session({'refresh_token':'nuovo'})
            self.assertEqual(json.loads(path.read_text())['refresh_token'],'nuovo')
            self.assertEqual(os.stat(path).st_mode & 0o777,0o600)
            self.assertEqual(os.stat(path.parent).st_mode & 0o777,0o700)
            self.assertEqual(len(list(path.parent.iterdir())),1)
