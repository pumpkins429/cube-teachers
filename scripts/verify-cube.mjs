import assert from 'node:assert/strict';
import { applyMove, applyMoves, getMoveRotation, isSolved, parseNotation, SOLVED_CUBE } from '../src/utils/cubeState.ts';
import { solveCubeState } from '../src/solver/solver.ts';

const FACES = ['R', 'L', 'U', 'D', 'F', 'B'];
const COLORS = ['white', 'yellow', 'green', 'blue', 'red', 'orange'];

function countColors(state) {
  const counts = Object.fromEntries(COLORS.map(color => [color, 0]));

  for (const face of Object.values(state)) {
    for (const row of face) {
      for (const color of row) {
        counts[color] += 1;
      }
    }
  }

  return counts;
}

function assertColorCounts(state, label) {
  assert.deepEqual(
    countColors(state),
    {
      white: 9,
      yellow: 9,
      green: 9,
      blue: 9,
      red: 9,
      orange: 9,
    },
    `${label}: color counts drifted`,
  );
}

function stateSignature(state) {
  return ['U', 'R', 'F', 'D', 'L', 'B']
    .map(face => state[face].flat().join(','))
    .join('|');
}

function emptyState() {
  return Object.fromEntries(
    ['U', 'D', 'F', 'B', 'L', 'R'].map(face => [face, Array.from({ length: 3 }, () => Array(3))]),
  );
}

function rotateVector([x, y, z], axis, turns) {
  switch (axis) {
    case 'x': return turns === 1 ? [x, -z, y] : [x, z, -y];
    case 'y': return turns === 1 ? [z, y, -x] : [-z, y, x];
    case 'z': return turns === 1 ? [-y, x, z] : [y, -x, z];
    default: throw new Error(`Unknown axis ${axis}`);
  }
}

function normalToFace([x, y, z]) {
  if (y === 1) return 'U';
  if (y === -1) return 'D';
  if (z === 1) return 'F';
  if (z === -1) return 'B';
  if (x === -1) return 'L';
  return 'R';
}

function positionToFaceIndex(face, [x, y, z]) {
  switch (face) {
    case 'U': return [2 - (z + 1), x + 1];
    case 'D': return [z + 1, x + 1];
    case 'F': return [2 - (y + 1), x + 1];
    case 'B': return [2 - (y + 1), 2 - (x + 1)];
    case 'L': return [2 - (y + 1), 2 - (z + 1)];
    case 'R': return [2 - (y + 1), z + 1];
    default: throw new Error(`Unknown face ${face}`);
  }
}

function stickersFromState(state) {
  const stickers = [];
  const add = (face, row, col, position, normal) => {
    stickers.push({ color: state[face][row][col], position, normal });
  };

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        if (y === 1) add('U', 2 - (z + 1), x + 1, [x, y, z], [0, 1, 0]);
        if (y === -1) add('D', z + 1, x + 1, [x, y, z], [0, -1, 0]);
        if (z === 1) add('F', 2 - (y + 1), x + 1, [x, y, z], [0, 0, 1]);
        if (z === -1) add('B', 2 - (y + 1), 2 - (x + 1), [x, y, z], [0, 0, -1]);
        if (x === -1) add('L', 2 - (y + 1), 2 - (z + 1), [x, y, z], [-1, 0, 0]);
        if (x === 1) add('R', 2 - (y + 1), z + 1, [x, y, z], [1, 0, 0]);
      }
    }
  }

  return stickers;
}

function visualAnimationEndState(state, move) {
  const { axis, layer, turns } = getMoveRotation(move.face, move.prime);
  const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  const next = emptyState();

  for (const sticker of stickersFromState(state)) {
    const shouldRotate = sticker.position[axisIndex] === layer;
    const position = shouldRotate ? rotateVector(sticker.position, axis, turns) : sticker.position;
    const normal = shouldRotate ? rotateVector(sticker.normal, axis, turns) : sticker.normal;
    const face = normalToFace(normal);
    const [row, col] = positionToFaceIndex(face, position);
    next[face][row][col] = sticker.color;
  }

  return next;
}

for (const face of FACES) {
  const move = { face, prime: false, double: false };
  const inverse = { face, prime: true, double: false };

  const once = applyMove(SOLVED_CUBE, move);
  assert.equal(
    stateSignature(visualAnimationEndState(SOLVED_CUBE, move)),
    stateSignature(once),
    `${face} visual animation should land on the same state as applyMove`,
  );
  const undone = applyMove(once, inverse);
  assert.ok(isSolved(undone), `${face} then ${face}' should return to solved`);
  assertColorCounts(once, `${face} once`);

  const fourTurns = applyMoves(SOLVED_CUBE, [move, move, move, move]);
  assert.ok(isSolved(fourTurns), `${face} four times should return to solved`);
}

const sexySix = applyMoves(SOLVED_CUBE, parseNotation("R U R' U' R U R' U'"));
assert.ok(!isSolved(sexySix), 'repeating the right trigger twice should not already solve');
assertColorCounts(sexySix, 'double right trigger');

const solvedAfterInverse = applyMoves(
  sexySix,
  parseNotation("U R U' R' U R U' R'"),
);
assert.ok(isSolved(solvedAfterInverse), 'sequence followed by its inverse should solve');

const sampleScramble = parseNotation("R U2 F' L D2 B R' U'");
const sampleExpanded = sampleScramble.flatMap(move => (
  move.double
    ? [
        { face: move.face, prime: false, double: false },
        { face: move.face, prime: false, double: false },
      ]
    : [{ ...move, double: false }]
));
const inverseScramble = sampleExpanded
  .map(move => ({ face: move.face, prime: !move.prime, double: false }))
  .reverse();
const scrambled = applyMoves(SOLVED_CUBE, sampleExpanded);
const restored = applyMoves(scrambled, inverseScramble);
assert.ok(isSolved(restored), 'expanded scramble followed by its inverse should solve');

const historySolution = solveCubeState(scrambled, { state: scrambled, moves: sampleExpanded });
assert.equal(historySolution.ok, true, 'history-backed scramble should be solvable');
if (historySolution.ok) {
  assert.ok(historySolution.steps.length > 0, 'history-backed solver should return steps');
}

const arbitrarySolution = solveCubeState(scrambled, null);
assert.equal(arbitrarySolution.ok, true, 'arbitrary valid state should be solved by Kociemba');
if (arbitrarySolution.ok) {
  let animatedState = scrambled;
  for (const { move } of arbitrarySolution.steps) {
    assert.equal(move.double, false, 'solver steps should be expanded to 90-degree turns for animation');
    assert.equal(
      stateSignature(visualAnimationEndState(animatedState, move)),
      stateSignature(applyMove(animatedState, move)),
      `solver move ${move.face}${move.prime ? '\'' : ''} should not jump after animation`,
    );
    animatedState = applyMove(animatedState, move);
  }

  const solvedByKociemba = applyMoves(scrambled, arbitrarySolution.steps.map(step => step.move));
  assert.ok(isSolved(solvedByKociemba), 'Kociemba solution should solve the cube');
}

console.log('Cube verification passed.');
