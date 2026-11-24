import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTreeRevision, resolveTree, type TreeRevision } from '../src/asset.ts';

test('R17B is opt-in and same-profile fallback is attempted once', async () => {
  assert.deepEqual([null, 'r16', 'unknown', 'r17b'].map(parseTreeRevision), ['R16', 'R16', 'R16', 'R17B']);
  const tries: TreeRevision[] = [];
  const result = await resolveTree('R17B', new AbortController().signal, async revision => {
    tries.push(revision);
    if (revision === 'R17B') throw new Error('bad bounds');
    return { revision, profile: 'eco', dispose() {} };
  });
  assert.deepEqual(tries, ['R17B', 'R16']);
  assert.equal(result.asset.profile, 'eco');
  assert.equal(result.fallbackReason, 'bad bounds');
});

test('abort prevents fallback and disposes an asset returned after abort', async () => {
  const a = new AbortController();
  let disposed = 0;
  await assert.rejects(resolveTree('R17B', a.signal, async () => {
    a.abort();
    return { dispose() { disposed++; } };
  }), { name: 'AbortError' });
  assert.equal(disposed, 1);
  let calls = 0;
  const b = new AbortController();
  await assert.rejects(resolveTree('R17B', b.signal, async () => {
    calls++;
    b.abort();
    throw new Error('import rejected after abort');
  }), { name: 'AbortError' });
  assert.equal(calls, 1);
});

test('reports both failures and never retries a failed default R16', async () => {
  await assert.rejects(resolveTree('R17B', new AbortController().signal, async revision => {
    throw new Error(revision + ' missing');
  }), /R17B missing.*R16 missing/);
  let calls = 0;
  await assert.rejects(resolveTree('R16', new AbortController().signal, async () => {
    calls++;
    throw new Error('R16 missing');
  }), /R16 missing/);
  assert.equal(calls, 1);
});
