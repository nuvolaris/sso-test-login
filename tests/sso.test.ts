import { test, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { getProviderLogoutUrl, resolveRouting, startDeviceAuthorization, pollForSession } from '../src/lib/sso.ts';

const device = { flow_id: 'opaque-flow', user_code: 'ABCD-EFGH', verification_uri: 'https://keycloak.example/device', expires_in: 60, interval: 1 };
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
function location(hostname = 'localhost') {
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { hostname } } });
}
function replies(values: Array<[number, unknown]>) {
  return mock.method(globalThis, 'fetch', async () => {
    const next = values.shift();
    assert.ok(next, 'Unexpected extra request');
    return new Response(JSON.stringify(next[1]), { status: next[0], headers: { 'Content-Type': 'application/json' } });
  });
}
function fastPolling() {
  const realTimeout = globalThis.setTimeout;
  mock.method(globalThis, 'setTimeout', ((fn, delay, ...args) => realTimeout(fn, delay < 20000 ? 0 : delay, ...args)) as typeof setTimeout);
}
afterEach(() => {
  mock.restoreAll();
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});

test('routes local development through proxy, without binding a workspace', () => {
  assert.deepEqual(resolveRouting({ hostname: 'localhost' }), { apiBase: '', namespace: null });
});
test('does not mistake APIHOST test.psn.n7s.co for a workspace', () => {
  assert.deepEqual(resolveRouting({ hostname: 'test.psn.n7s.co' }), { apiBase: 'http://test.psn.n7s.co', namespace: null });
});
test('resolves ssotest workspace and rejects nested or unrelated domains', () => {
  assert.equal(resolveRouting({ hostname: 'ssotest.test.psn.n7s.co' }).namespace, 'ssotest');
  assert.equal(resolveRouting({ hostname: 'a.b.test.psn.n7s.co' }).namespace, null);
  assert.equal(resolveRouting({ hostname: 'ssotest.example.com' }).namespace, null);
});
test('passes requested workspace to the backend', async () => {
  location('ssotest.test.psn.n7s.co');
  const fetch = replies([[200, device]]);
  await startDeviceAuthorization();
  assert.deepEqual(JSON.parse(fetch.mock.calls[0].arguments[1].body as string), { namespace: 'ssotest' });
});
test('rejects unsafe verification URLs and incomplete device responses', async () => {
  location();
  replies([[200, { ...device, verification_uri: 'javascript:alert(1)' }], [200, {}]]);
  await assert.rejects(startDeviceAuthorization(), /URL di verifica/);
  await assert.rejects(startDeviceAuthorization(), /incompleta/);
});
test('polls pending responses and discards credentials on success', async () => {
  location(); fastPolling();
  replies([[202, { status: 'pending' }], [200, { LOGIN: 'ssotest', NAMESPACE: 'ssotest', AUTH: 'must-not-retain', access_token: 'must-not-retain' }]]);
  assert.deepEqual(await pollForSession(device), { login: 'ssotest', namespace: 'ssotest' });
});
test('rejects forbidden or wrong-workspace responses', async () => {
  location('ssotest.test.psn.n7s.co'); fastPolling();
  replies([[403, { message: 'Forbidden' }], [200, { LOGIN: 'other', NAMESPACE: 'other' }]]);
  await assert.rejects(pollForSession(device), /Forbidden/);
  await assert.rejects(pollForSession(device), /diverso/);
});
test('cancellation prevents polling and expiry cannot produce a session', async () => {
  location();
  const fetch = replies([]);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(pollForSession(device, controller.signal), { name: 'AbortError' });
  await assert.rejects(pollForSession({ ...device, expires_in: 0 }), /scaduto/);
  assert.equal(fetch.mock.callCount(), 0);
});
test('rejects HTML responses with a useful routing diagnostic', async () => {
  location();
  mock.method(globalThis, 'fetch', async () => new Response('<html>404</html>', { status: 404 }));
  await assert.rejects(startDeviceAuthorization(), /non restituisce JSON/);
});


test('provider logout uses the realm endpoint without tokens or unregistered redirect', () => {
  const url = new URL(getProviderLogoutUrl('https://idp.test/realms/psn/', 'test-client'));
  assert.equal(url.pathname, '/realms/psn/protocol/openid-connect/logout');
  assert.equal(url.searchParams.get('client_id'), 'test-client');
  assert.equal(url.searchParams.has('id_token_hint'), false);
  assert.equal(url.searchParams.has('post_logout_redirect_uri'), false);
  assert.throws(() => getProviderLogoutUrl('javascript:alert(1)', 'client'));
});

test('late success cannot authenticate after reset has aborted the request', async () => {
  location(); fastPolling();
  const controller = new AbortController();
  mock.method(globalThis, 'fetch', async () => ({
    ok: true, status: 200,
    json: async () => {
      controller.abort();
      return { LOGIN: 'michelem', NAMESPACE: 'michelem' };
    },
  }) as Response);
  await assert.rejects(pollForSession(device, controller.signal), { name: 'AbortError' });
});
