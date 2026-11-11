import assert from 'node:assert/strict';
import test from 'node:test';
import { oauthCallbackRedirect } from './oauthCallback';

test('legacy Google redirects for every role go through the auth callback', () => {
  for (const path of ['/passport', '/admin', '/staff', '/guide/schedules']) {
    assert.equal(oauthCallbackRedirect(path, '?token=test-jwt'), '/oauth2/callback?token=test-jwt');
  }
});

test('accessToken is supported and its value round trips without query injection', () => {
  const token = 'test+token/&?extra=value';
  const target = oauthCallbackRedirect('/passport', `?${new URLSearchParams({ accessToken: token, returnTo: '/passport' })}`);
  const url = new URL(target!, 'http://localhost');
  assert.equal(url.searchParams.get('token'), token);
  assert.equal(url.searchParams.size, 1);
});

test('callback does not redirect itself and ordinary navigation is unchanged', () => {
  assert.equal(oauthCallbackRedirect('/oauth2/callback', '?token=test-jwt'), null);
  for (const search of ['', '?schedule=16', '?token=', '?returnTo=%2Fpassport']) {
    assert.equal(oauthCallbackRedirect('/tours/43', search), null);
  }
});
