import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const solvePath = require.resolve('cubejs/lib/solve');
const before = "Cube = this.Cube || require('./cube');";
const after = 'Cube = (typeof this !== "undefined" && this.Cube) || require(\'./cube\');';
const source = readFileSync(solvePath, 'utf8');

if (source.includes(after)) {
  process.exit(0);
}

if (!source.includes(before)) {
  throw new Error('cubejs solve.js no longer matches the expected patch target.');
}

writeFileSync(solvePath, source.replace(before, after));
