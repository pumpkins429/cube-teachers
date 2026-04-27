import { useEffect, useMemo, useRef, useState } from 'react';
import { CubeScene, type StickerSelection } from './cube/CubeVisualizer';
import { solveCubeState, validateCubeState, type SolverPlan } from './solver/solver';
import {
  applyMoves,
  COLORS,
  SOLVED_CUBE,
  expandMoves,
  formatMove,
  generateScramble,
  invertMove,
  parseNotation,
  setStickerColor,
  type Color,
  type CubeState,
  type Move,
} from './utils/cubeState';
import './App.css';

type Track = '基础手法' | '白十字' | 'F2L' | 'OLL' | 'PLL';

type Lesson = {
  id: string;
  title: string;
  track: Track;
  level: '入门' | '基础' | '进阶';
  goal: string;
  whyItMatters: string;
  notation: string;
  tips: string[];
};

type PlaybackMode = 'auto' | 'single' | null;
type Speed = 0.75 | 1 | 1.5 | 2;

const TRACKS: Array<Track | '全部'> = ['全部', '基础手法', '白十字', 'F2L', 'OLL', 'PLL'];

type PracticeSequence = {
  type: 'scramble' | 'solve' | 'manual';
  title: string;
  label: string;
  notation: string;
  goal: string;
  whyItMatters: string;
  tips: string[];
  initialState: CubeState;
  moves: Move[];
};

type ActiveAnimation = {
  move: Move;
  fromStep: number;
  toStep: number;
  mode: Exclude<PlaybackMode, null>;
};

const COLOR_LABELS: Record<Color, string> = {
  white: '白',
  yellow: '黄',
  green: '绿',
  blue: '蓝',
  red: '红',
  orange: '橙',
};

const LESSONS: Lesson[] = [
  {
    id: 'right-trigger',
    title: '右手触发器',
    track: '基础手法',
    level: '入门',
    goal: 'R U R\' U\'',
    whyItMatters: '这是后面 F2L、OLL、PLL 最常出现的手感单元。',
    notation: 'R U R\' U\'',
    tips: ['右手上提做 R，食指拨 U。', '先练顺手，再追求速度。', '注意每一步都让层对齐。'],
  },
  {
    id: 'left-trigger',
    title: '左手触发器',
    track: '基础手法',
    level: '入门',
    goal: 'L\' U\' L U',
    whyItMatters: '左手公式让你不用总是转动整个魔方找右手位。',
    notation: 'L\' U\' L U',
    tips: ['把它当成右手触发器的镜像。', '慢速跟着动画做两轮。', '左右手交替练会更稳。'],
  },
  {
    id: 'inverse-trigger',
    title: '反向触发器',
    track: '基础手法',
    level: '入门',
    goal: 'R U\' R\' U',
    whyItMatters: '它常用来拆开或调整一组角棱块。',
    notation: 'R U\' R\' U',
    tips: ['和右手触发器只差顶层方向。', '观察右前上角块的路径。', '先不要背，跟着轨迹理解。'],
  },
  {
    id: 'front-trigger',
    title: '前面触发器',
    track: '基础手法',
    level: '基础',
    goal: 'F R U R\' U\' F\'',
    whyItMatters: '这是顶层棱块翻色最常用的短公式。',
    notation: 'F R U R\' U\' F\'',
    tips: ['F 和 F\' 是外壳动作，中间是右手触发器。', '重点看顶层黄色棱块。', '动作结束后前面会被放回。'],
  },
  {
    id: 'cross-edge-flip',
    title: '顶层棱块翻色',
    track: '白十字',
    level: '入门',
    goal: 'F R U R\' U\' F\'',
    whyItMatters: '做白十字和顶层十字时，都需要理解棱块方向。',
    notation: 'F R U R\' U\' F\'',
    tips: ['盯住前上棱的位置。', '公式前后对比顶层颜色。', '练习时先只看棱块，不看角块。'],
  },
  {
    id: 'cross-lift-edge',
    title: '棱块提到顶层',
    track: '白十字',
    level: '基础',
    goal: 'R U R\'',
    whyItMatters: '白十字经常要先把错误位置的棱块提出来。',
    notation: 'R U R\'',
    tips: ['这是右手触发器的前三步。', '观察右前棱被带到哪里。', '适合配合真实魔方同步练。'],
  },
  {
    id: 'cross-replace-edge',
    title: '棱块换位',
    track: '白十字',
    level: '基础',
    goal: 'R U R\' F R\' F\' R',
    whyItMatters: '当一个棱块在错误槽位时，可以先移出再放回。',
    notation: 'R U R\' F R\' F\' R',
    tips: ['先看右侧槽位。', '中间 F 动作负责把前面接起来。', '完成后检查底层棱块方向。'],
  },
  {
    id: 'f2l-right-insert',
    title: 'F2L 右手插入',
    track: 'F2L',
    level: '基础',
    goal: 'U R U\' R\'',
    whyItMatters: '最常见的右前槽插入方式，F2L 入门第一条。',
    notation: 'U R U\' R\'',
    tips: ['先把角棱对放在右前上方。', 'U 把位置让出来，R U\' R\' 放回。', '结束后看右前槽。'],
  },
  {
    id: 'f2l-left-insert',
    title: 'F2L 左手插入',
    track: 'F2L',
    level: '基础',
    goal: 'U\' L\' U L',
    whyItMatters: '左前槽的基础插入，能减少整体转体。',
    notation: 'U\' L\' U L',
    tips: ['这是右手插入的镜像。', '注意 U\' 的方向。', '适合和右手插入成对练。'],
  },
  {
    id: 'f2l-pair-connect',
    title: 'F2L 连接角棱',
    track: 'F2L',
    level: '基础',
    goal: 'R U R\' U\' R U R\'',
    whyItMatters: '先把角棱配成一对，再整体插入。',
    notation: 'R U R\' U\' R U R\'',
    tips: ['前四步用来拆开关系。', '后三步把一对带回。', '看右前上角和右前棱。'],
  },
  {
    id: 'f2l-hidden-edge',
    title: 'F2L 边块在槽内',
    track: 'F2L',
    level: '进阶',
    goal: 'R U\' R\' U2 R U R\'',
    whyItMatters: '很多新手卡在“边块已经进错槽”，这一条就是处理它。',
    notation: 'R U\' R\' U2 R U R\'',
    tips: ['第一段先把槽里的边块请出来。', 'U2 让它换到合适位置。', '最后三步重新插入。'],
  },
  {
    id: 'oll-sune',
    title: 'OLL 小鱼',
    track: 'OLL',
    level: '基础',
    goal: 'R U R\' U R U2 R\'',
    whyItMatters: '顶层定向最经典的公式之一。',
    notation: 'R U R\' U R U2 R\'',
    tips: ['U2 在倒数第二个顶层动作。', '观察顶层角块翻色。', '先慢速，保持右手节奏。'],
  },
  {
    id: 'oll-anti-sune',
    title: 'OLL 反小鱼',
    track: 'OLL',
    level: '基础',
    goal: 'R U2 R\' U\' R U\' R\'',
    whyItMatters: '和小鱼配套，能覆盖更多顶层角块方向。',
    notation: 'R U2 R\' U\' R U\' R\'',
    tips: ['开头就是 U2。', '和小鱼对比看角块路径。', '两个公式交替练最有效。'],
  },
  {
    id: 'oll-t-shape',
    title: 'OLL T 形',
    track: 'OLL',
    level: '基础',
    goal: 'F R U R\' U\' F\'',
    whyItMatters: '顶层出现横线或 T 形时经常会用到。',
    notation: 'F R U R\' U\' F\'',
    tips: ['先把图案摆到前方。', '中间仍然是右手触发器。', '看顶层棱块是否形成十字。'],
  },
  {
    id: 'oll-l-shape',
    title: 'OLL L 形',
    track: 'OLL',
    level: '进阶',
    goal: 'F U R U\' R\' F\'',
    whyItMatters: '这是另一个常见的顶层棱块定向处理。',
    notation: 'F U R U\' R\' F\'',
    tips: ['先确认 L 形朝向。', 'U 和 U\' 控制顶层交换。', '结束后检查黄色十字。'],
  },
  {
    id: 'oll-headlights',
    title: 'OLL 车灯',
    track: 'OLL',
    level: '进阶',
    goal: 'R2 D R\' U2 R D\' R\' U2 R\'',
    whyItMatters: '这是顶层角块方向里很有代表性的进阶情况。',
    notation: 'R2 D R\' U2 R D\' R\' U2 R\'',
    tips: ['R2 会拆成两次真实旋转。', 'D 和 D\' 只动底层。', '观察一对同色角块。'],
  },
  {
    id: 'pll-t-perm',
    title: 'PLL T Perm',
    track: 'PLL',
    level: '进阶',
    goal: 'R U R\' U\' R\' F R2 U\' R\' U\' R U R\' F\'',
    whyItMatters: '相邻角块和相邻棱块交换，是 PLL 里最常用的公式之一。',
    notation: 'R U R\' U\' R\' F R2 U\' R\' U\' R U R\' F\'',
    tips: ['前四步是右手触发器。', '中间 R2 会显示为两次转层。', '最后 F\' 收回来。'],
  },
  {
    id: 'pll-j-perm',
    title: 'PLL J Perm',
    track: 'PLL',
    level: '进阶',
    goal: 'R U R\' F\' R U R\' U\' R\' F R2 U\' R\'',
    whyItMatters: 'J Perm 是 PLL 入门非常值得先练的一条。',
    notation: 'R U R\' F\' R U R\' U\' R\' F R2 U\' R\'',
    tips: ['前半段把一组块带出来。', 'F 和 F\' 控制前面连接。', 'R2 之后节奏会变快。'],
  },
  {
    id: 'pll-y-perm',
    title: 'PLL Y Perm',
    track: 'PLL',
    level: '进阶',
    goal: 'F R U\' R\' U\' R U R\' F\' R U R\' U\' R\' F R F\'',
    whyItMatters: 'Y Perm 适合练习前面和右手公式的组合。',
    notation: 'F R U\' R\' U\' R U R\' F\' R U R\' U\' R\' F R F\'',
    tips: ['它比较长，先拆成两段。', '看到 F\' 后短暂停一下。', '最后三步负责收尾。'],
  },
  {
    id: 'pll-u-perm',
    title: 'PLL U Perm',
    track: 'PLL',
    level: '进阶',
    goal: 'R U\' R U R U R U\' R\' U\' R2',
    whyItMatters: '这是只用 R/U 就能练的棱块循环，适合先避开 M 层公式。',
    notation: 'R U\' R U R U R U\' R\' U\' R2',
    tips: ['一开始连续多个 R/U，节奏要稳。', '最后 R2 拆成两次旋转。', '适合用慢速播放背结构。'],
  },
];

const SPEED_OPTIONS: Speed[] = [0.75, 1, 1.5, 2];
const SPEED_LABELS: Record<Speed, string> = {
  0.75: '0.75x',
  1: '1x',
  1.5: '1.5x',
  2: '2x',
};

function getStepStates(initialState: CubeState, moves: Move[]): CubeState[] {
  const states = [initialState];
  let current = initialState;

  for (const move of moves) {
    current = applyMoves(current, [move]);
    states.push(current);
  }

  return states;
}

function sequenceFromSolverPlan(plan: SolverPlan, type: PracticeSequence['type']): PracticeSequence {
  const moves = plan.steps.map(step => step.move);

  return {
    type,
    title: plan.title,
    label: type === 'manual' ? '录入模式 · 求解' : '练习模式 · 复原',
    notation: plan.notation,
    goal: plan.notation ? `使用公式：${plan.notation}` : '当前状态已经复原。',
    whyItMatters: '求解结果会被拆成可播放的 90 度转层，后续可以把这里替换成更强的本地求解器或大模型解释器。',
    tips: plan.steps.length > 0
      ? plan.steps.slice(0, 4).map(step => `${step.stage}: ${step.explanation}`)
      : ['这个状态已经是复原状态。'],
    initialState: plan.initialState,
    moves,
  };
}

function App() {
  const [selectedTrack, setSelectedTrack] = useState<Track | '全部'>('全部');
  const [selectedLessonId, setSelectedLessonId] = useState(LESSONS[0].id);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeAnimation, setActiveAnimation] = useState<ActiveAnimation | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(null);
  const [speed, setSpeed] = useState<Speed>(1);
  const [practiceScramble, setPracticeScramble] = useState(() => generateScramble(12));
  const [practiceSequence, setPracticeSequence] = useState<PracticeSequence | null>(null);
  const [lastScramble, setLastScramble] = useState<{ notation: string; moves: Move[]; state: CubeState } | null>(null);
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState<Color>('white');
  const [editorState, setEditorState] = useState<CubeState>(SOLVED_CUBE);
  const [editorNotice, setEditorNotice] = useState<string[]>([]);
  const animationProgressRef = useRef(0);

  const selectedLesson = useMemo(
    () => LESSONS.find(lesson => lesson.id === selectedLessonId) ?? LESSONS[0],
    [selectedLessonId],
  );
  const filteredLessons = useMemo(
    () => LESSONS.filter(lesson => selectedTrack === '全部' || lesson.track === selectedTrack),
    [selectedTrack],
  );
  const lessonMoves = useMemo(() => expandMoves(parseNotation(selectedLesson.notation)), [selectedLesson.notation]);
  const editorValidation = useMemo(() => validateCubeState(editorState), [editorState]);
  const moves = practiceSequence?.moves ?? lessonMoves;
  const initialState = practiceSequence?.initialState ?? SOLVED_CUBE;
  const displayTitle = isEditorMode ? '手动录入魔方' : practiceSequence?.title ?? selectedLesson.title;
  const displayBadge = isEditorMode ? '录入模式' : practiceSequence?.label ?? `${selectedLesson.track} · ${selectedLesson.level}`;
  const displayNotation = isEditorMode ? '选择颜色后点击模型贴纸' : practiceSequence?.notation ?? selectedLesson.notation;
  const displayGoal = isEditorMode
    ? `当前选择：${COLOR_LABELS[selectedColor]}色。${editorValidation.valid ? '基础校验通过。' : '请先修正颜色数量或中心色。'}`
    : practiceSequence?.goal ?? selectedLesson.goal;
  const displayWhy = isEditorMode
    ? '手动录入可以模拟你手上的魔方。当前版本会做基础校验，并用 Kociemba Two-Phase 尝试生成近优复原公式。'
    : practiceSequence?.whyItMatters ?? selectedLesson.whyItMatters;
  const displayTips = isEditorMode
    ? editorNotice.length > 0
      ? editorNotice
      : editorValidation.valid
        ? ['基础校验通过。点击“尝试求解”会调用本地 Kociemba 求解器。', '如果录入的是物理上不可能的状态，求解器会返回失败提示。']
        : editorValidation.issues
    : practiceSequence?.tips ?? selectedLesson.tips;
  const stepStates = useMemo(() => getStepStates(initialState, moves), [initialState, moves]);
  const activeMove = activeAnimation?.move ?? null;
  const sequenceState = stepStates[currentStep] ?? SOLVED_CUBE;
  const currentState = isEditorMode ? editorState : sequenceState;
  const currentMove = isEditorMode ? null : activeMove;
  const progressPercent = isEditorMode || moves.length === 0
    ? 0
    : Math.round(((currentStep + (activeMove ? animationProgress : 0)) / moves.length) * 100);
  const nextMove = activeMove ?? moves[currentStep] ?? null;
  const currentMoveLabel = isEditorMode
    ? `当前颜色：${COLOR_LABELS[selectedColor]}`
    : currentStep >= moves.length && !activeMove ? '已完成' : formatMove(nextMove);
  const isAutoPlaying = playbackMode === 'auto';

  useEffect(() => {
    animationProgressRef.current = animationProgress;
  }, [animationProgress]);

  useEffect(() => {
    if (!playbackMode || !activeAnimation) {
      return;
    }

    const duration = 680 / speed;
    const startedAt = performance.now() - animationProgressRef.current * duration;
    let frame = 0;

    const tick = (time: number) => {
      const nextProgress = Math.min((time - startedAt) / duration, 1);
      setAnimationProgress(nextProgress);

      if (nextProgress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [activeAnimation, playbackMode, speed]);

  const beginMove = (index: number, mode: Exclude<PlaybackMode, null>) => {
    if (index >= moves.length) {
      setPlaybackMode(null);
      return;
    }

    animationProgressRef.current = 0;
    setAnimationProgress(0);
    setActiveAnimation({
      move: moves[index],
      fromStep: index,
      toStep: index + 1,
      mode,
    });
    setPlaybackMode(mode);
  };

  const beginReverseMove = (index: number) => {
    if (index <= 0) {
      return;
    }

    const move = moves[index - 1];
    animationProgressRef.current = 0;
    setAnimationProgress(0);
    setActiveAnimation({
      move: invertMove(move),
      fromStep: index,
      toStep: index - 1,
      mode: 'single',
    });
    setPlaybackMode('single');
  };

  const handleMoveComplete = () => {
    if (!activeAnimation) return;

    const nextStep = activeAnimation.toStep;
    const shouldContinue = activeAnimation.mode === 'auto' && nextStep < moves.length;

    setCurrentStep(nextStep);
    setAnimationProgress(0);
    animationProgressRef.current = 0;

    if (shouldContinue) {
      window.setTimeout(() => beginMove(nextStep, 'auto'), 90);
      return;
    }

    setActiveAnimation(null);
    setPlaybackMode(null);
  };

  const stopAnimation = () => {
    setPlaybackMode(null);
    setActiveAnimation(null);
    setAnimationProgress(0);
  };

  const startPracticeSequence = (sequence: PracticeSequence, autoplay: boolean = true) => {
    stopAnimation();
    setIsEditorMode(false);
    setPracticeSequence(sequence);
    setCurrentStep(0);

    if (autoplay && sequence.moves[0]) {
      setActiveAnimation({
        move: sequence.moves[0],
        fromStep: 0,
        toStep: 1,
        mode: 'auto',
      });
      setPlaybackMode('auto');
    }
  };

  const handleLessonChange = (lessonId: string) => {
    stopAnimation();
    setCurrentStep(0);
    setPracticeSequence(null);
    setIsEditorMode(false);
    setSelectedLessonId(lessonId);
  };

  const handleTrackChange = (track: Track | '全部') => {
    const firstLesson = LESSONS.find(lesson => track === '全部' || lesson.track === track);

    setSelectedTrack(track);
    if (firstLesson) {
      handleLessonChange(firstLesson.id);
    }
  };

  const handlePlayPause = () => {
    if (playbackMode === 'auto') {
      setPlaybackMode(null);
      return;
    }

    if (activeAnimation) {
      setPlaybackMode('auto');
      return;
    }

    const startIndex = currentStep >= moves.length ? 0 : currentStep;
    if (currentStep >= moves.length) {
      setCurrentStep(0);
    }
    beginMove(startIndex, 'auto');
  };

  const handleReset = () => {
    stopAnimation();
    setCurrentStep(0);
  };

  const handleStepForward = () => {
    if (activeAnimation) {
      setAnimationProgress(1);
      return;
    }

    beginMove(currentStep, 'single');
  };

  const handleStepBack = () => {
    if (activeAnimation) {
      return;
    }

    beginReverseMove(currentStep);
  };

  const handleScramble = () => {
    const notation = generateScramble(14);
    const scrambleMoves = expandMoves(parseNotation(notation));
    const scrambledState = applyMoves(SOLVED_CUBE, scrambleMoves);

    stopAnimation();
    setPracticeScramble(notation);
    setLastScramble({ notation, moves: scrambleMoves, state: scrambledState });
    startPracticeSequence({
      type: 'scramble',
      title: '随机打乱演示',
      label: '练习模式 · 打乱',
      notation,
      goal: '按随机打乱公式把复原魔方打乱。',
      whyItMatters: '先看打乱过程，再用逆公式复原，能帮助你理解每一步都是可逆的。',
      tips: ['打乱动作会逐层旋转。', '完成后可以点击“演示复原”。', '复原会调用 Kociemba Two-Phase 生成近优公式。'],
      initialState: SOLVED_CUBE,
      moves: scrambleMoves,
    });
  };

  const handleSolveScramble = () => {
    if (!lastScramble) {
      return;
    }

    const result = solveCubeState(lastScramble.state, lastScramble);
    if (!result.ok) {
      setEditorNotice([result.title, ...result.issues]);
      return;
    }

    startPracticeSequence(sequenceFromSolverPlan(result, 'solve'));
  };

  const handleEnterEditor = () => {
    stopAnimation();
    setPracticeSequence(null);
    setIsEditorMode(true);
    setCurrentStep(0);
    setEditorNotice([]);
  };

  const handleLoadCurrentIntoEditor = () => {
    stopAnimation();
    setEditorState(sequenceState);
    setPracticeSequence(null);
    setIsEditorMode(true);
    setCurrentStep(0);
    setEditorNotice(['已把当前画面载入录入器。']);
  };

  const handleResetEditor = () => {
    setEditorState(SOLVED_CUBE);
    setEditorNotice(['已重置为复原状态。']);
  };

  const handleStickerClick = ({ face, row, col }: StickerSelection) => {
    if (!isEditorMode) return;

    setEditorState(state => setStickerColor(state, face, row, col, selectedColor));
    setEditorNotice([]);
  };

  const handleSolveEditorState = () => {
    const result = solveCubeState(editorState, lastScramble);
    if (!result.ok) {
      setEditorNotice([result.title, ...result.issues]);
      return;
    }

    if (result.steps.length === 0) {
      setEditorNotice(['这个状态已经是复原状态。']);
      return;
    }

    startPracticeSequence(sequenceFromSolverPlan(result, 'manual'));
  };

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Cube Teacher</p>
          <h1>魔方公式训练台</h1>
          <p className="hero-copy">
            {LESSONS.length} 条入门到进阶公式，支持真实转层动画、单步观察和速度控制。
          </p>
        </div>
        <div className="hero-card">
          <span className="hero-card-label">练习打乱</span>
          <strong>{practiceScramble}</strong>
          <div className="hero-actions">
            <button onClick={handleScramble}>随机打乱</button>
            <button onClick={handleSolveScramble} disabled={!lastScramble}>演示复原</button>
          </div>
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <div className="sidebar-section">
            <h2>公式库</h2>
            <p>{filteredLessons.length} / {LESSONS.length} 条</p>
          </div>

          <div className="track-tabs" aria-label="公式分类">
            {TRACKS.map(track => (
              <button
                key={track}
                className={selectedTrack === track ? 'active' : ''}
                onClick={() => handleTrackChange(track)}
              >
                {track}
              </button>
            ))}
          </div>

          <div className="lesson-list">
            {filteredLessons.map(lesson => (
              <button
                key={lesson.id}
                className={`lesson-item ${lesson.id === selectedLessonId ? 'selected' : ''}`}
                onClick={() => handleLessonChange(lesson.id)}
              >
                <span className="lesson-order">{lesson.track}</span>
                <strong>{lesson.title}</strong>
                <span className="lesson-level">{lesson.level}</span>
              </button>
            ))}
          </div>

          <div className="sidebar-section notation-help">
            <h3>记号速查</h3>
            <p>R/L/U/D/F/B：右、左、上、下、前、后。</p>
            <p>'：逆时针；2：连续转两次。</p>
          </div>
        </aside>

        <section className="viewer-panel">
          <div className="viewer-card">
            <div className="viewer-header">
              <div>
                <p className="badge">{displayBadge}</p>
                <h2>{displayTitle}</h2>
              </div>
              <div className="progress-block">
                <span>进度 {progressPercent}%</span>
                <div className="progress-bar">
                  <div style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>

            <div className="cube-container">
              <CubeScene
                cubeState={currentState}
                currentMove={currentMove}
                animationProgress={animationProgress}
                onMoveComplete={handleMoveComplete}
                isEditable={isEditorMode}
                onStickerClick={handleStickerClick}
              />
            </div>

            <div className="controls-panel">
              <div className="formula-card">
                <span className="label">公式</span>
                <strong>{displayNotation}</strong>
                <p>{displayGoal}</p>
              </div>

              <div className="step-card">
                <span className="label">当前动作</span>
                <strong>
                  第 {moves.length === 0 ? 0 : Math.min(currentStep + 1, moves.length)} / {moves.length} 步
                </strong>
                <p>{currentMoveLabel}</p>
              </div>

              <div className="speed-control">
                <span className="label">播放速度</span>
                <div className="speed-buttons">
                  {SPEED_OPTIONS.map(option => (
                    <button
                      key={option}
                      className={option === speed ? 'active' : ''}
                      onClick={() => setSpeed(option)}
                    >
                      {SPEED_LABELS[option]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="editor-card">
                <span className="label">手动录入</span>
                <div className="editor-actions">
                  <button onClick={handleEnterEditor} className={isEditorMode ? 'active' : ''}>录入模式</button>
                  <button onClick={handleLoadCurrentIntoEditor}>载入当前画面</button>
                  <button onClick={handleResetEditor}>重置录入</button>
                  <button onClick={handleSolveEditorState}>尝试求解</button>
                </div>
                <div className="color-palette" aria-label="选择贴纸颜色">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      className={selectedColor === color ? 'selected' : ''}
                      style={{ backgroundColor: `var(--cube-${color})` }}
                      onClick={() => setSelectedColor(color)}
                      title={COLOR_LABELS[color]}
                    >
                      {COLOR_LABELS[color]}
                    </button>
                  ))}
                </div>
                <p className={editorValidation.valid ? 'validation-ok' : 'validation-error'}>
                  {editorValidation.valid ? '基础校验通过' : editorValidation.issues[0]}
                </p>
              </div>

              <div className="controls">
                <button onClick={handleStepBack} disabled={isEditorMode || currentStep === 0 || activeAnimation !== null}>
                  上一步
                </button>
                <button onClick={handlePlayPause} disabled={isEditorMode}>
                  {isAutoPlaying ? '暂停' : activeAnimation ? '继续' : currentStep >= moves.length ? '重新演示' : '播放演示'}
                </button>
                <button onClick={handleStepForward} disabled={isEditorMode || (currentStep >= moves.length && activeAnimation === null)}>
                  下一步
                </button>
                <button onClick={handleReset} disabled={isEditorMode || (currentStep === 0 && activeAnimation === null)}>
                  回到开头
                </button>
              </div>
            </div>
          </div>

          <div className="lesson-grid">
            <article className="info-card">
              <h3>用途</h3>
              <p>{displayWhy}</p>
            </article>
            <article className="info-card">
              <h3>练习提示</h3>
              <ul>
                {displayTips.map(tip => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </article>
            <article className="info-card">
              <h3>拆解</h3>
              <p>双层动作会拆成连续两次 90 度旋转，方便观察每一次真实转层。</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
