// CFOP Algorithm Data
// Cross, F2L, OLL, PLL

export interface Algorithm {
  id: string;
  name: string;
  notation: string; // e.g., "R U R' U'"
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  case?: string; // F2L case type
}

// Cross algorithms (basic setup cases)
export const crossAlgorithms: Algorithm[] = [
  {
    id: 'cross-1',
    name: '十字基础',
    notation: 'R U R\' U\' F',
    description: '标准十字第一步',
    difficulty: 'beginner',
  },
];

// F2L algorithms - 41 standard cases
export const f2lAlgorithms: Algorithm[] = [
  // Corner in top, Edge in top
  {
    id: 'f2l-01',
    name: 'F2L 1',
    notation: 'U R U\' R\' U\' F\' U F',
    description: '角块在顶层，棱块在顶层（同层）',
    difficulty: 'beginner',
    case: 'corner-top edge-top adjacent',
  },
  {
    id: 'f2l-02',
    name: 'F2L 2',
    notation: 'U\' R U R\' U R U\' R\'',
    description: '角块在顶层，棱块在顶层（分离）',
    difficulty: 'beginner',
    case: 'corner-top edge-top opposite',
  },
  {
    id: 'f2l-03',
    name: 'F2L 3',
    notation: 'R U\' R\' U\' F\' U F',
    description: '角块在顶层，棱块在中层',
    difficulty: 'beginner',
    case: 'corner-top edge-middle',
  },
  // Edge in bottom, Corner in top
  {
    id: 'f2l-04',
    name: 'F2L 4',
    notation: 'U F\' U F',
    description: '棱块在底层，角块在顶层',
    difficulty: 'beginner',
    case: 'edge-bottom corner-top',
  },
  {
    id: 'f2l-05',
    name: 'F2L 5',
    notation: 'R U R\'',
    description: '棱块在底层（已对齐），角块在顶层',
    difficulty: 'beginner',
    case: 'edge-bottom-aligned corner-top',
  },
];

// OLL algorithms - 57 cases
export const ollAlgorithms: Algorithm[] = [
  // Dot cases
  {
    id: 'oll-01',
    name: 'OLL 1',
    notation: 'R U2 R2 F R F\' U2 R\' F R F\'',
    description: '点状态 - 所有棱块正确',
    difficulty: 'advanced',
  },
  {
    id: 'oll-02',
    name: 'OLL 2',
    notation: 'F R U R\' U\' F\' f R U R\' U\' f\'',
    description: '点状态 - 小拐角',
    difficulty: 'advanced',
  },
  // Line cases
  {
    id: 'oll-03',
    name: 'OLL 3',
    notation: 'r\' U2 R U R\' U r',
    description: '横线状态',
    difficulty: 'intermediate',
  },
  {
    id: 'oll-04',
    name: 'OLL 4',
    notation: 'r U2 R\' U\' R U\' r\'',
    description: '竖线状态',
    difficulty: 'intermediate',
  },
  // L shapes
  {
    id: 'oll-05',
    name: 'OLL 5',
    notation: 'r U\' r2 U r2 U r\'',
    description: 'L形状 - 右手',
    difficulty: 'intermediate',
  },
  {
    id: 'oll-06',
    name: 'OLL 6',
    notation: 'r\' U r2 U\' r2 U\' r',
    description: 'L形状 - 左手',
    difficulty: 'intermediate',
  },
  // T shapes
  {
    id: 'oll-07',
    name: 'OLL 7',
    notation: 'F R U R\' U\' F\'',
    description: 'T字形',
    difficulty: 'beginner',
  },
  {
    id: 'oll-08',
    name: 'OLL 8',
    notation: 'f R U R\' U\' f\'',
    description: '反向T字形',
    difficulty: 'intermediate',
  },
];

// PLL algorithms - 21 cases
export const pllAlgorithms: Algorithm[] = [
  // Permutations of Edges
  {
    id: 'pll-01',
    name: 'PLL 1 - H Perm',
    notation: 'M2 U M2 U2 M2 U M2',
    description: 'H状态 - 所有棱块交换',
    difficulty: 'beginner',
  },
  {
    id: 'pll-02',
    name: 'PLL 2 - Z Perm',
    notation: 'M2 U M2 U M\' U2 M2 U2 M\' U2',
    description: 'Z状态 - 对角棱块交换',
    difficulty: 'intermediate',
  },
  {
    id: 'pll-03',
    name: 'PLL 3 - U Perm a',
    notation: 'R U\' R U R U R U\' R\' U\' R2',
    description: 'U状态 - 顺时针棱块交换',
    difficulty: 'beginner',
  },
  {
    id: 'pll-04',
    name: 'PLL 4 - U Perm b',
    notation: 'R2 U R U R\' U\' R\' U\' R\' U R\'',
    description: 'U状态 - 逆时针棱块交换',
    difficulty: 'beginner',
  },
  // Permutations of Corners
  {
    id: 'pll-05',
    name: 'PLL 5 - A Perm a',
    notation: 'R U R\' U\' R\' U R U\' R\' U\' R\' U R\'',
    description: 'A状态 - 顺时针角块交换',
    difficulty: 'intermediate',
  },
  {
    id: 'pll-06',
    name: 'PLL 6 - A Perm b',
    notation: 'R\' U\' R U R\' U\' R U\' R\' U\' R\' U\' R U R\'',
    description: 'A状态 - 逆时针角块交换',
    difficulty: 'intermediate',
  },
  {
    id: 'pll-07',
    name: 'PLL 7 - E Perm',
    notation: 'x\' R U\' R\' D R U R\' D\' x',
    description: 'E状态 - 对角角块交换',
    difficulty: 'intermediate',
  },
  // Adjacent Corner Swaps
  {
    id: 'pll-08',
    name: 'PLL 8 - T Perm',
    notation: 'R U R\' U\' R\' U\' R\' U R\' U R',
    description: 'T状态 - 相邻棱块交换',
    difficulty: 'beginner',
  },
  {
    id: 'pll-09',
    name: 'PLL 9 - J Perm a',
    notation: 'R\' U L\' U2 R U\' R\' U2 R L',
    description: 'J状态 - Aa左手',
    difficulty: 'intermediate',
  },
  {
    id: 'pll-10',
    name: 'PLL 10 - Y Perm',
    notation: 'F R U\' R\' U\' R U R\' F\' R U R\' U\' R\' F\' U\' F',
    description: 'Y状态 - 相邻角块对换',
    difficulty: 'intermediate',
  },
];

export const allAlgorithms = {
  cross: crossAlgorithms,
  f2l: f2lAlgorithms,
  oll: ollAlgorithms,
  pll: pllAlgorithms,
};

export type CFOPStage = keyof typeof allAlgorithms;
