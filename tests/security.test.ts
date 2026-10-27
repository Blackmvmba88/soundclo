import { test } from "node:test";
import assert from "node:assert/strict";
import { seal, unseal } from "../lib/crypto";
import { validEvent } from "../lib/event-validation";
process.env.BLACKMAMBA_SESSION_SECRET = "test-only-secret-32-characters-long";
test("encrypted tokens reject tampering and use fresh nonces", () => {
  const a = seal({ access_token: "private" }),
    b = seal({ access_token: "private" });
  assert.notEqual(a, b);
  assert.ok(!a.includes("private"));
  assert.deepEqual(unseal(a), { access_token: "private" });
  const altered = Buffer.from(a, "base64url");
  altered[30] ^= 1;
  assert.throws(() => unseal(altered.toString("base64url")));
});
test("event input rejects invalid positions, track IDs and invented event names", () => {
  const e = {
    id: "61362bf7-bdee-4b62-a5cf-3a37e40dc9d1",
    sessionId: "71362bf7-bdee-4b62-a5cf-3a37e40dc9d1",
    trackId: "123",
    kind: "PLAY",
    positionMs: 0,
  };
  assert.equal(validEvent(e), true);
  for (const change of [
    { positionMs: -1 },
    { positionMs: NaN },
    { positionMs: 1.5 },
    { kind: "OFFICIAL_PLAY" },
    { trackId: "../secret" },
    { sessionId: "bad" },
  ])
    assert.equal(validEvent({ ...e, ...change }), false);
});

import { verifyOAuthState } from '../lib/oauth-state';
test('OAuth callback requires the encrypted nonce, matching state and unexpired proof', () => {
  const payload={state:'random-state',verifier:'a'.repeat(64),expiresAt:Date.now()+600000};
  const nonce=seal(payload);
  assert.equal(verifyOAuthState(nonce,payload.state).verifier,payload.verifier);
  assert.throws(()=>verifyOAuthState(nonce,'foreign-state'));
  assert.throws(()=>verifyOAuthState(undefined,payload.state));
  assert.throws(()=>verifyOAuthState(seal({...payload,expiresAt:Date.now()-1}),payload.state));
  assert.throws(()=>verifyOAuthState(seal({...payload,expiresAt:null}),payload.state));
});
