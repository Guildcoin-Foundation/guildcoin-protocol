"""Offline structural checks for the proposed OpenAPI contract and examples."""
from pathlib import Path
import re
import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
spec = yaml.safe_load((ROOT / 'openapi/guildcoin-v0.1.yaml').read_text())
assert spec['openapi'] == '3.1.1'
assert all(server['url'].endswith('.example') for server in spec['servers'])
assert set(spec['paths']) == {
    '/v1/checkouts', '/v1/checkouts/{checkout_id}', '/v1/refunds',
    '/v1/refunds/{refund_id}', '/v1/transactions'
}
assert spec['components']['schemas']['Checkout']['properties']['state']['enum'] == [
    'open', 'completed', 'cancelled', 'expired'
]
assert spec['components']['schemas']['Refund']['properties']['state']['enum'] == [
    'pending', 'succeeded', 'rejected'
]

for route in ('/v1/checkouts', '/v1/refunds'):
    op = spec['paths'][route]['post']
    assert any(p['name'] == 'Idempotency-Key' and p['required'] for p in op['parameters'])

amount = spec['components']['schemas']['Amount']
Draft202012Validator.check_schema(amount)
for value in ('1', '100', '1250'):
    assert Draft202012Validator(amount).is_valid(value)
for value in ('0', '-1', '0.99', '1e5', 100, '9'*20):
    assert not Draft202012Validator(amount).is_valid(value)

sdk = (ROOT / 'sdk/typescript/src/index.ts').read_text()
for marker in ('createCheckout(', 'getCheckout(', 'createRefund(', 'getRefund(', 'listTransactions('):
    assert marker in sdk
assert 'No live endpoint' in (ROOT / 'SECURITY.md').read_text()
print('Proposed Guildcoin contract: structural checks passed')
