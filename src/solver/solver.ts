import Cube from 'cubejs';
import {
  COLORS,
  FACES,
  SOLVED_CUBE,
  expandMoves,
  movesToNotation,
  parseNotation,
  statesEqual,
  stateToFacelets,
  type Color,
  type CubeState,
  type Move,
} from '../utils/cubeState.ts';

let solverInitialized = false;

export type SolverStep = {
  move: Move;
  stage: string;
  explanation: string;
};

export type SolverPlan = {
  ok: true;
  title: string;
  notation: string;
  steps: SolverStep[];
  initialState: CubeState;
};

export type SolverFailure = {
  ok: false;
  title: string;
  issues: string[];
};

export type SolverResult = SolverPlan | SolverFailure;

export type CubeValidation = {
  valid: boolean;
  issues: string[];
  colorCounts: Record<Color, number>;
};

export type HistoryHint = {
  state: CubeState;
  moves: Move[];
};

function ensureSolverInitialized() {
  if (solverInitialized) return;
  Cube.initSolver();
  solverInitialized = true;
}

export function validateCubeState(state: CubeState): CubeValidation {
  const colorCounts = Object.fromEntries(COLORS.map(color => [color, 0])) as Record<Color, number>;
  const issues: string[] = [];

  for (const face of FACES) {
    for (const row of state[face]) {
      for (const color of row) {
        colorCounts[color] += 1;
      }
    }
  }

  for (const color of COLORS) {
    if (colorCounts[color] !== 9) {
      issues.push(`${color} 数量是 ${colorCounts[color]}，应为 9`);
    }
  }

  for (const face of FACES) {
    const expectedCenter = SOLVED_CUBE[face][1][1];
    const actualCenter = state[face][1][1];
    if (actualCenter !== expectedCenter) {
      issues.push(`${face} 面中心应为 ${expectedCenter}，当前是 ${actualCenter}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    colorCounts,
  };
}

export function solveCubeState(state: CubeState, historyHint: HistoryHint | null): SolverResult {
  const validation = validateCubeState(state);
  if (!validation.valid) {
    return {
      ok: false,
      title: '状态还不能求解',
      issues: validation.issues,
    };
  }

  if (statesEqual(state, SOLVED_CUBE)) {
    return {
      ok: true,
      title: '已经复原',
      notation: '',
      initialState: state,
      steps: [],
    };
  }

  try {
    ensureSolverInitialized();
    const cube = Cube.fromString(stateToFacelets(state));
    const notation = cube.solve().trim();
    const solveMoves = expandMoves(parseNotation(notation));

    return {
      ok: true,
      title: 'Kociemba 近优复原',
      notation,
      initialState: state,
      steps: solveMoves.map((move, index) => ({
        move,
        stage: 'Two-Phase',
        explanation: `第 ${index + 1} 手：执行 ${movesToNotation([move])}。`,
      })),
    };
  } catch (error) {
    if (historyHint && statesEqual(state, historyHint.state)) {
      return {
        ok: false,
        title: '近优求解失败',
        issues: [
          error instanceof Error ? error.message : 'cubejs 无法求解当前状态。',
          '这个状态来自本应用的随机打乱，仍可退回到历史逆公式复原。',
        ],
      };
    }

    return {
      ok: false,
      title: '当前状态无法由 Kociemba 求解',
      issues: [
        error instanceof Error ? error.message : 'cubejs 无法求解当前状态。',
        '如果这是手动录入状态，通常是贴纸位置组成了真实魔方不可能出现的状态。',
      ],
    };
  }
}
