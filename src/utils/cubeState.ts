import Cube from 'cubejs';

// Cube State Management

export type Face = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';
export type Color = 'white' | 'yellow' | 'green' | 'blue' | 'red' | 'orange';
export type CubeState = Record<Face, Color[][]>;

export const COLORS: Color[] = ['white', 'yellow', 'green', 'blue', 'red', 'orange'];
export const FACES: Face[] = ['U', 'D', 'F', 'B', 'L', 'R'];
export const FACELET_ORDER: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

const COLOR_TO_FACELET: Record<Color, Face> = {
  white: 'U',
  red: 'R',
  green: 'F',
  yellow: 'D',
  orange: 'L',
  blue: 'B',
};

const FACELET_TO_COLOR: Record<Face, Color> = {
  U: 'white',
  R: 'red',
  F: 'green',
  D: 'yellow',
  L: 'orange',
  B: 'blue',
};

const FACELET_COORDS: Record<Face, Array<[number, number]>> = {
  U: [
    [2, 0], [2, 1], [2, 2],
    [1, 0], [1, 1], [1, 2],
    [0, 0], [0, 1], [0, 2],
  ],
  R: [
    [0, 2], [0, 1], [0, 0],
    [1, 2], [1, 1], [1, 0],
    [2, 2], [2, 1], [2, 0],
  ],
  F: [
    [0, 0], [0, 1], [0, 2],
    [1, 0], [1, 1], [1, 2],
    [2, 0], [2, 1], [2, 2],
  ],
  D: [
    [2, 0], [2, 1], [2, 2],
    [1, 0], [1, 1], [1, 2],
    [0, 0], [0, 1], [0, 2],
  ],
  L: [
    [0, 2], [0, 1], [0, 0],
    [1, 2], [1, 1], [1, 0],
    [2, 2], [2, 1], [2, 0],
  ],
  B: [
    [0, 0], [0, 1], [0, 2],
    [1, 0], [1, 1], [1, 2],
    [2, 0], [2, 1], [2, 2],
  ],
};

export const SOLVED_CUBE: CubeState = {
  U: [
    ['white', 'white', 'white'],
    ['white', 'white', 'white'],
    ['white', 'white', 'white'],
  ],
  D: [
    ['yellow', 'yellow', 'yellow'],
    ['yellow', 'yellow', 'yellow'],
    ['yellow', 'yellow', 'yellow'],
  ],
  F: [
    ['green', 'green', 'green'],
    ['green', 'green', 'green'],
    ['green', 'green', 'green'],
  ],
  B: [
    ['blue', 'blue', 'blue'],
    ['blue', 'blue', 'blue'],
    ['blue', 'blue', 'blue'],
  ],
  L: [
    ['orange', 'orange', 'orange'],
    ['orange', 'orange', 'orange'],
    ['orange', 'orange', 'orange'],
  ],
  R: [
    ['red', 'red', 'red'],
    ['red', 'red', 'red'],
    ['red', 'red', 'red'],
  ],
};

export interface Move {
  face: Face;
  prime: boolean;
  double: boolean;
}

export type MoveRotation = {
  axis: 'x' | 'y' | 'z';
  layer: number;
  turns: 1 | -1;
};

export function parseNotation(notation: string): Move[] {
  const moves: Move[] = [];
  const regex = /([RLUDFB])(['2])?/g;
  let match;

  while ((match = regex.exec(notation)) !== null) {
    const face = match[1] as Face;
    const prime = match[2] === '\'';
    const double = match[2] === '2';
    moves.push({ face, prime, double });
  }

  return moves;
}

export function formatMove(move: Move | null): string {
  if (!move) return '准备开始';
  return `${move.face}${move.double ? '2' : move.prime ? '\'' : ''}`;
}

function clone(state: CubeState): CubeState {
  return {
    U: state.U.map(row => [...row]),
    D: state.D.map(row => [...row]),
    F: state.F.map(row => [...row]),
    B: state.B.map(row => [...row]),
    L: state.L.map(row => [...row]),
    R: state.R.map(row => [...row]),
  };
}

export function getMoveRotation(face: Face, prime: boolean): MoveRotation {
  const base = {
    R: { axis: 'x' as const, layer: 1, turns: -1 as const },
    L: { axis: 'x' as const, layer: -1, turns: 1 as const },
    U: { axis: 'y' as const, layer: 1, turns: -1 as const },
    D: { axis: 'y' as const, layer: -1, turns: 1 as const },
    F: { axis: 'z' as const, layer: 1, turns: -1 as const },
    B: { axis: 'z' as const, layer: -1, turns: 1 as const },
  }[face];

  return {
    ...base,
    turns: prime ? (base.turns === 1 ? -1 : 1) : base.turns,
  };
}

export function stateToFacelets(state: CubeState): string {
  return FACELET_ORDER
    .map(face => FACELET_COORDS[face].map(([row, col]) => COLOR_TO_FACELET[state[face][row][col]]).join(''))
    .join('');
}

export function faceletsToState(facelets: string): CubeState {
  const state = clone(SOLVED_CUBE);
  let offset = 0;

  for (const face of FACELET_ORDER) {
    for (const [row, col] of FACELET_COORDS[face]) {
      const facelet = facelets[offset] as Face;
      state[face][row][col] = FACELET_TO_COLOR[facelet];
      offset += 1;
    }
  }

  return state;
}

export function applyMove(state: CubeState, move: Move): CubeState {
  const cube = Cube.fromString(stateToFacelets(state));
  cube.move(formatMove(move));
  return faceletsToState(cube.asString());
}

export function applyMoves(state: CubeState, moves: Move[]): CubeState {
  let result = state;
  for (const move of moves) {
    if (move.double) {
      result = applyMove(result, { face: move.face, prime: false, double: false });
      result = applyMove(result, { face: move.face, prime: false, double: false });
    } else {
      result = applyMove(result, move);
    }
  }
  return result;
}

export function expandMoves(moves: Move[]): Move[] {
  return moves.flatMap(move => (
    move.double
      ? [
          { face: move.face, prime: false, double: false },
          { face: move.face, prime: false, double: false },
        ]
      : [{ ...move, double: false }]
  ));
}

export function invertMove(move: Move): Move {
  return {
    face: move.face,
    prime: !move.prime,
    double: false,
  };
}

export function invertMoves(moves: Move[]): Move[] {
  return expandMoves(moves).map(invertMove).reverse();
}

export function movesToNotation(moves: Move[]): string {
  return moves.map(formatMove).join(' ');
}

export function setStickerColor(
  state: CubeState,
  face: Face,
  row: number,
  col: number,
  color: Color,
): CubeState {
  const next = clone(state);
  next[face][row][col] = color;
  return next;
}

export function statesEqual(a: CubeState, b: CubeState): boolean {
  return FACES.every(face => (
    a[face].every((row, rowIndex) => (
      row.every((color, colIndex) => color === b[face][rowIndex][colIndex])
    ))
  ));
}

export function generateScramble(length: number = 20): string {
  const faces: Face[] = ['R', 'L', 'U', 'D', 'F', 'B'];
  const modifiers = ['', '\'', '2'];
  let lastFace = '';
  let scramble = '';

  for (let i = 0; i < length; i++) {
    let face: Face;
    do {
      face = faces[Math.floor(Math.random() * faces.length)];
    } while (face === lastFace);

    lastFace = face;
    const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
    scramble += `${face}${modifier} `;
  }

  return scramble.trim();
}

export function isSolved(state: CubeState): boolean {
  for (const face of ['U', 'D', 'F', 'B', 'L', 'R'] as Face[]) {
    const colors = state[face].flat();
    if (!colors.every(c => c === colors[0])) return false;
  }
  return true;
}
