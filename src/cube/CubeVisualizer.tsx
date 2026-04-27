import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { getMoveRotation, type Color, type CubeState, SOLVED_CUBE, type Face, type Move } from '../utils/cubeState';

// Color mapping
const COLOR_MAP: Record<Color, string> = {
  white: '#f8f4ec',
  yellow: '#f5c94a',
  green: '#48b178',
  blue: '#4f7cff',
  red: '#df5a4f',
  orange: '#f39a4c',
};

export type StickerSelection = {
  face: Face;
  row: number;
  col: number;
};

type CubieSticker = StickerSelection & {
  color: Color;
};

type CubieStickers = Partial<Record<Face, CubieSticker>>;

function Sticker({
  sticker,
  position,
  rotation = [0, 0, 0],
  isEditable,
  onStickerClick,
}: {
  sticker: CubieSticker | undefined;
  position: [number, number, number];
  rotation?: [number, number, number];
  isEditable?: boolean;
  onStickerClick?: (selection: StickerSelection) => void;
}) {
  if (!sticker) return null;

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!isEditable) return;
    event.stopPropagation();
    onStickerClick?.({ face: sticker.face, row: sticker.row, col: sticker.col });
  };

  return (
    <mesh position={position} rotation={rotation} onClick={handleClick}>
      <planeGeometry args={[0.78, 0.78]} />
      <meshStandardMaterial
        color={COLOR_MAP[sticker.color]}
        emissive={isEditable ? COLOR_MAP[sticker.color] : '#000000'}
        emissiveIntensity={isEditable ? 0.08 : 0}
        roughness={0.82}
        metalness={0.03}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Single cubie component
function Cubie({
  position,
  stickers,
  size = 0.95,
  isEditable,
  onStickerClick,
}: {
  position: [number, number, number];
  stickers: CubieStickers;
  size?: number;
  isEditable?: boolean;
  onStickerClick?: (selection: StickerSelection) => void;
}) {
  return (
    <group position={position}>
      <RoundedBox args={[size, size, size]} radius={0.08} smoothness={4}>
        <meshStandardMaterial color="#14161c" roughness={0.7} metalness={0.08} />
      </RoundedBox>
      <Sticker
        sticker={stickers.U}
        position={[0, 0.495, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        isEditable={isEditable}
        onStickerClick={onStickerClick}
      />
      <Sticker
        sticker={stickers.D}
        position={[0, -0.495, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        isEditable={isEditable}
        onStickerClick={onStickerClick}
      />
      <Sticker
        sticker={stickers.F}
        position={[0, 0, 0.495]}
        isEditable={isEditable}
        onStickerClick={onStickerClick}
      />
      <Sticker
        sticker={stickers.B}
        position={[0, 0, -0.495]}
        rotation={[0, Math.PI, 0]}
        isEditable={isEditable}
        onStickerClick={onStickerClick}
      />
      <Sticker
        sticker={stickers.L}
        position={[-0.495, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        isEditable={isEditable}
        onStickerClick={onStickerClick}
      />
      <Sticker
        sticker={stickers.R}
        position={[0.495, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        isEditable={isEditable}
        onStickerClick={onStickerClick}
      />
    </group>
  );
}

// Get cubie stickers based on position and cube state
function getCubieStickers(x: number, y: number, z: number, state: CubeState) {
  const stickers: CubieStickers = {};

  const getFaceSticker = (face: Face, row: number, col: number): CubieSticker | undefined => {
    const faceData = state[face];
    if (!faceData || !faceData[row] || faceData[row][col] === undefined) return undefined;
    return { face, row, col, color: faceData[row][col] };
  };

  if (y === 1) stickers.U = getFaceSticker('U', 2 - (z + 1), x + 1);
  if (y === -1) stickers.D = getFaceSticker('D', z + 1, x + 1);
  if (z === 1) stickers.F = getFaceSticker('F', 2 - (y + 1), x + 1);
  if (z === -1) stickers.B = getFaceSticker('B', 2 - (y + 1), 2 - (x + 1));
  if (x === -1) stickers.L = getFaceSticker('L', 2 - (y + 1), 2 - (z + 1));
  if (x === 1) stickers.R = getFaceSticker('R', 2 - (y + 1), z + 1);

  return stickers;
}

// Check if a cubie is part of the rotating layer
function isInLayer(x: number, y: number, z: number, face: Face): boolean {
  switch (face) {
    case 'R': return x === 1;
    case 'L': return x === -1;
    case 'U': return y === 1;
    case 'D': return y === -1;
    case 'F': return z === 1;
    case 'B': return z === -1;
  }
}

// Animated rotating layer component
function RotatingLayer({
  face,
  prime,
  cubeState,
  animationProgress,
  onComplete,
  isEditable,
  onStickerClick,
}: {
  face: Face;
  prime: boolean;
  cubeState: CubeState;
  animationProgress: number;
  onComplete: () => void;
  isEditable?: boolean;
  onStickerClick?: (selection: StickerSelection) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const hasCompleted = useRef(false);

  // Reset when animation starts (progress goes back to 0)
  useEffect(() => {
    if (animationProgress === 0) {
      hasCompleted.current = false;
      if (groupRef.current) {
        groupRef.current.rotation.set(0, 0, 0);
      }
    }
  }, [animationProgress]);

  // Generate cubies for this layer
  const cubies = useMemo(() => {
    const result = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;
          if (!isInLayer(x, y, z, face)) continue;
          result.push({
            position: [x, y, z] as [number, number, number],
            stickers: getCubieStickers(x, y, z, cubeState),
            key: `${x}-${y}-${z}`,
          });
        }
      }
    }
    return result;
  }, [cubeState, face]);

  const { axis, turns } = getMoveRotation(face, prime);

  useFrame(() => {
    if (!groupRef.current) return;

    // Ease out cubic
    const eased = 1 - Math.pow(1 - animationProgress, 3);
    const targetAngle = (Math.PI / 2) * eased * turns;

    if (axis === 'x') groupRef.current.rotation.x = targetAngle;
    if (axis === 'y') groupRef.current.rotation.y = targetAngle;
    if (axis === 'z') groupRef.current.rotation.z = targetAngle;

    // Animation complete callback
    if (animationProgress >= 1 && !hasCompleted.current) {
      hasCompleted.current = true;
      onComplete();
    }
  });

  return (
    <group ref={groupRef}>
      {cubies.map(cubie => (
        <Cubie
          key={cubie.key}
          position={cubie.position}
          stickers={cubie.stickers}
          isEditable={isEditable}
          onStickerClick={onStickerClick}
        />
      ))}
    </group>
  );
}

// Static layer (non-rotating cubies)
function StaticLayer({
  face,
  cubeState,
  isEditable,
  onStickerClick,
}: {
  face: Face;
  cubeState: CubeState;
  isEditable?: boolean;
  onStickerClick?: (selection: StickerSelection) => void;
}) {
  const cubies = useMemo(() => {
    const result = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;
          if (isInLayer(x, y, z, face)) continue;
          result.push({
            position: [x, y, z] as [number, number, number],
            stickers: getCubieStickers(x, y, z, cubeState),
            key: `${x}-${y}-${z}`,
          });
        }
      }
    }
    return result;
  }, [cubeState, face]);

  return (
    <>
      {cubies.map(cubie => (
        <Cubie
          key={cubie.key}
          position={cubie.position}
          stickers={cubie.stickers}
          isEditable={isEditable}
          onStickerClick={onStickerClick}
        />
      ))}
    </>
  );
}

// Full cube with animation support
function AnimatedCube({
  cubeState,
  currentMove,
  animationProgress,
  onMoveComplete,
  isEditable,
  onStickerClick,
}: {
  cubeState: CubeState;
  currentMove: Move | null;
  animationProgress: number;
  onMoveComplete: () => void;
  isEditable?: boolean;
  onStickerClick?: (selection: StickerSelection) => void;
}) {
  const staticCubies = useMemo(() => {
    const result = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;
          result.push({
            position: [x, y, z] as [number, number, number],
            stickers: getCubieStickers(x, y, z, cubeState),
            key: `${x}-${y}-${z}`,
          });
        }
      }
    }
    return result;
  }, [cubeState]);

  if (currentMove) {
    return (
      <>
        <RotatingLayer
          face={currentMove.face}
          prime={currentMove.prime}
          cubeState={cubeState}
          animationProgress={animationProgress}
          onComplete={onMoveComplete}
          isEditable={isEditable}
          onStickerClick={onStickerClick}
        />
        <StaticLayer
          face={currentMove.face}
          cubeState={cubeState}
          isEditable={isEditable}
          onStickerClick={onStickerClick}
        />
      </>
    );
  }

  return (
    <>
      {staticCubies.map(cubie => (
        <Cubie
          key={cubie.key}
          position={cubie.position}
          stickers={cubie.stickers}
          isEditable={isEditable}
          onStickerClick={onStickerClick}
        />
      ))}
    </>
  );
}

// Scene with animation controller
function CubeSceneInner({
  cubeState,
  currentMove,
  animationProgress,
  onMoveComplete,
  isEditable,
  onStickerClick,
}: {
  cubeState: CubeState;
  currentMove: Move | null;
  animationProgress: number;
  onMoveComplete: () => void;
  isEditable?: boolean;
  onStickerClick?: (selection: StickerSelection) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.85} color="#fff3d9" />
      <directionalLight position={[6, 8, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-5, 3, -6]} intensity={0.55} color="#bfd8ff" />
      <AnimatedCube
        cubeState={cubeState}
        currentMove={currentMove}
        animationProgress={animationProgress}
        onMoveComplete={onMoveComplete}
        isEditable={isEditable}
        onStickerClick={onStickerClick}
      />
      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.34}
        scale={8}
        blur={1.8}
        far={5}
        color="#0f172a"
      />
    </>
  );
}

// Main scene export
export function CubeScene({
  cubeState,
  currentMove,
  animationProgress,
  onMoveComplete,
  isEditable,
  onStickerClick,
}: {
  cubeState: CubeState;
  currentMove: Move | null;
  animationProgress: number;
  onMoveComplete: () => void;
  isEditable?: boolean;
  onStickerClick?: (selection: StickerSelection) => void;
}) {
  return (
    <Canvas
      style={{ width: '100%', height: '100%' }}
      camera={{ position: [5.8, 4.8, 5.8], fov: 42 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#101826']} />
      <fog attach="fog" args={['#101826', 9, 16]} />
      <OrbitControls enablePan={false} minDistance={5.5} maxDistance={12} />
      <CubeSceneInner
        cubeState={cubeState}
        currentMove={currentMove}
        animationProgress={animationProgress}
        onMoveComplete={onMoveComplete}
        isEditable={isEditable}
        onStickerClick={onStickerClick}
      />
    </Canvas>
  );
}

// Re-export utilities
export { SOLVED_CUBE };
