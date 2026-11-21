import { writeFileSync } from 'node:fs';
import { DemoEngine } from './engine.ts';
import { demoScript } from './fixture.ts';

const engine = new DemoEngine();
const trace = [];
for (const event of demoScript()) {
  if (event.atMs === 46000) trace.push({ effects: engine.advance(45000), state: engine.snapshot() });
  const { effects, disposition } = engine.ingest(event);
  trace.push({ effects, disposition, state: engine.snapshot() });
}
for (const atMs of [49000, 51700, 52600, 57400, 58300, 63100, 64300]) {
  trace.push({ effects: engine.advance(atMs), state: engine.snapshot() });
}
const json = JSON.stringify({ fixtureSeed: 16, trace }, null, 2) + '\n';
const path = process.argv[2];
if (path) writeFileSync(path, json, 'utf8');
else process.stdout.write(json);
