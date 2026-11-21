import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidAccessTokenPayload,
} from "../src/utils/jwt";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "../src/utils/refreshtoken";

test("validates access token payload user IDs", () => {
  assert.equal(isValidAccessTokenPayload({ userId: 12 }), true);
  assert.equal(isValidAccessTokenPayload({ userId: 0 }), false);
  assert.equal(isValidAccessTokenPayload({ userId: "12" }), false);
  assert.equal(isValidAccessTokenPayload(null), false);
});

test("generates refresh tokens with matching hashes", () => {
  const { token, tokenHash } = generateRefreshToken();

  assert.equal(hashRefreshToken(token), tokenHash);
  assert.notEqual(token, tokenHash);
});
