import assert from "node:assert/strict";
import test from "node:test";
import { validateCitationGrounding } from "../src/services/citation.services";

const citation = {
  source: 1,
  chunkId: 10,
  chunkIndex: 0,
  content: "The project retention policy is thirty days.",
  distance: 0.12,
};

test("accepts an answer grounded in mocked retrieved content", () => {
  const result = validateCitationGrounding(
    [citation],
    "The project retention policy is thirty days.",
  );

  assert.equal(result.grounded, true);
  assert.deepEqual(result.citations, [citation]);
});

test("rejects an answer with no meaningful overlap", () => {
  const result = validateCitationGrounding(
    [citation],
    "The system supports encrypted exports.",
  );

  assert.equal(result.grounded, false);
  assert.deepEqual(result.citations, []);
});

test("rejects malformed mocked citations", () => {
  const result = validateCitationGrounding(
    [{ ...citation, distance: -1 }],
    "The project retention policy is thirty days.",
  );

  assert.equal(result.grounded, false);
  assert.deepEqual(result.citations, []);
});
