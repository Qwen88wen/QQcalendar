import { useRef, useMemo, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../stores/appStore';
import { getDayPosition } from './MonthGrid';
import type { Diary, FlowerType } from '../types/database';

// 花朵图片路径配置 (根据 flower_type 1-5)
const FLOWER_IMAGES: Record<FlowerType, string> = {
  1: '/flowers/rose.png',       // 粉色玫瑰
  2: '/flowers/tulip.png',      // 郁金香
  3: '/flowers/lavender.png',   // 薰衣草
  4: '/flowers/sakura.png',     // 樱花
  5: '/flowers/sunflower.png',  // 向日葵
};

// 备用颜色 (当图片加载失败时)
const FLOWER_COLORS: Record<FlowerType, string> = {
  1: '#ffb6c1', // 粉色玫瑰
  2: '#ff6347', // 郁金香
  3: '#9370db', // 薰衣草
  4: '#ffc0cb', // 樱花
  5: '#ffd700', // 向日葵
};

// 用户默认花朵映射
const USER_DEFAULT_FLOWER: Record<string, FlowerType> = {
  'QQrou': 3,   // 薰衣草
  'QQfang': 1,  // 玫瑰
  'QQwen': 4,   // 樱花
  'user-qqrou': 3,
  'user-qqfang': 1,
  'user-qqwen': 4,
};

// 根据用户获取默认花朵类型
function getDefaultFlowerType(diary: Diary): FlowerType {
  if (diary.flower_type) {
    return diary.flower_type as FlowerType;
  }
  // 根据用户名或用户ID获取默认花朵
  const userName = diary.user_name?.toLowerCase() || '';
  const userId = diary.user_id?.toLowerCase() || '';

  for (const [key, value] of Object.entries(USER_DEFAULT_FLOWER)) {
    if (userName.includes(key.toLowerCase()) || userId.includes(key.toLowerCase())) {
      return value;
    }
  }
  return 1; // 默认玫瑰
}

// 基于 ID 生成稳定的随机数
function seededRandom(seed: string, index: number = 0): number {
  let hash = 0;
  const str = seed + index;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

interface FlowerSpriteProps {
  diary: Diary;
  position: [number, number, number];
  onClick: () => void;
  randomSeed: number;
}

function FlowerSprite({ diary, position, onClick, randomSeed }: FlowerSpriteProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const flowerType = getDefaultFlowerType(diary);
  const imagePath = FLOWER_IMAGES[flowerType];

  // 随机化参数 (基于 diary.id 保持一致)
  const randomHeight = seededRandom(diary.id, 1) * 0.4 + 0.8; // 0.8 - 1.2
  const randomScale = seededRandom(diary.id, 2) * 0.3 + 0.85; // 0.85 - 1.15
  const randomRotation = seededRandom(diary.id, 3) * 0.3 - 0.15; // -0.15 - 0.15
  const stemHeight = 0.6 + seededRandom(diary.id, 4) * 0.3; // 0.6 - 0.9

  // 加载纹理
  let texture: THREE.Texture | null = null;
  try {
    texture = useLoader(THREE.TextureLoader, imagePath);
  } catch {
    // 纹理加载失败，使用备用方案
  }

  // 轻微摇摆动画
  useFrame((state) => {
    if (groupRef.current) {
      const swayAmount = hovered ? 0.08 : 0.03;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5 + randomSeed * 10) * swayAmount;
    }
  });

  // 状态显示
  const statusText = diary.status === 'complete' ? '已完成' : '未完成';

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1], position[2]]}
      scale={[randomScale, randomScale, randomScale]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* 茎 */}
      <mesh position={[0, stemHeight / 2, 0]}>
        <cylinderGeometry args={[0.025, 0.04, stemHeight, 8]} />
        <meshStandardMaterial color="#2d5a27" />
      </mesh>

      {/* 花朵 - 使用 Billboard 始终面向相机 */}
      <Billboard
        position={[0, stemHeight + 0.5 * randomHeight, 0]}
        follow={true}
      >
        {texture ? (
          <mesh rotation={[0, 0, randomRotation]}>
            <planeGeometry args={[1.3 * randomScale, 1.3 * randomScale]} />
            <meshBasicMaterial
              map={texture}
              transparent={true}
              alphaTest={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
        ) : (
          // 备用: 圆形花朵
          <mesh>
            <circleGeometry args={[0.45 * randomScale, 32]} />
            <meshBasicMaterial color={FLOWER_COLORS[flowerType]} />
          </mesh>
        )}
      </Billboard>

      {/* 叶子 */}
      <mesh position={[0.1, stemHeight * 0.4, 0.02]} rotation={[0.2, 0, -0.5]}>
        <planeGeometry args={[0.28, 0.14]} />
        <meshStandardMaterial color="#3d7a35" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.08, stemHeight * 0.25, -0.02]} rotation={[-0.2, 0, 0.4]}>
        <planeGeometry args={[0.22, 0.11]} />
        <meshStandardMaterial color="#2d6a27" side={THREE.DoubleSide} />
      </mesh>

      {/* Hover Tooltip */}
      {hovered && (
        <Html
          position={[0, stemHeight + 1.5, 0]}
          center
          style={{
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{
            background: 'rgba(20, 40, 20, 0.95)',
            color: '#a8d4a0',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            maxWidth: '200px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            border: '1px solid rgba(100, 160, 100, 0.3)',
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#c8f4c0' }}>
              {diary.customer || diary.user_name || '匿名'}
            </div>
            <div style={{
              fontSize: '12px',
              opacity: 0.9,
              color: diary.status === 'complete' ? '#4caf50' : '#ff9800'
            }}>
              {statusText}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// 单个草叶动画组件
function AnimatedGrass({ position, index }: { position: [number, number, number]; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // 基于index生成稳定的随机参数
  const params = useMemo(() => ({
    speed: 0.8 + (index % 10) * 0.15,
    amplitude: 0.08 + (index % 5) * 0.02,
    phase: index * 0.5,
    hue: 100 + (index % 20),
    saturation: 50 + (index % 20),
    lightness: 25 + (index % 15),
    rotation: (index * 1.234) % Math.PI,
  }), [index]);

  // 悬浮动画
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime;
      // 上下浮动
      meshRef.current.position.y = position[1] + Math.sin(t * params.speed + params.phase) * params.amplitude;
      // 轻微摇摆
      meshRef.current.rotation.z = Math.sin(t * params.speed * 0.7 + params.phase) * 0.1;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[0, params.rotation, 0]}
    >
      <planeGeometry args={[0.15, 0.3]} />
      <meshBasicMaterial
        color={`hsl(${params.hue}, ${params.saturation}%, ${params.lightness}%)`}
        side={THREE.DoubleSide}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

// 草地装饰组件
function GrassDecoration() {
  const grassPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    // 在整个花园区域随机分布草
    for (let i = 0; i < 150; i++) {
      const x = (Math.sin(i * 12.9898) * 43758.5453) % 1 * 60 - 30;
      const z = (Math.sin(i * 78.233) * 43758.5453) % 1 * 50 - 25;
      positions.push([x, 0.1, z]);
    }
    return positions;
  }, []);

  return (
    <group>
      {grassPositions.map((pos, i) => (
        <AnimatedGrass key={i} position={pos} index={i} />
      ))}
    </group>
  );
}

export function Flowers() {
  const { diaries, openModal } = useAppStore();

  // 按日期分组日记，计算每个日记的位置
  const flowerPositions = useMemo(() => {
    const dateGroups: Record<string, Diary[]> = {};

    // 按日期分组
    diaries.forEach((diary) => {
      const date = new Date(diary.created_at);
      const key = `${date.getMonth() + 1}-${date.getDate()}`;
      if (!dateGroups[key]) {
        dateGroups[key] = [];
      }
      dateGroups[key].push(diary);
    });

    // 计算每个日记的位置 (同一天的多个记录添加 jitter)
    const positions: { diary: Diary; position: [number, number, number]; seed: number }[] = [];

    Object.values(dateGroups).forEach((group) => {
      group.forEach((diary, index) => {
        const date = new Date(diary.created_at);
        const month = date.getMonth() + 1;
        const day = date.getDate();

        const { x, y, z } = getDayPosition(month, day, index);
        positions.push({
          diary,
          position: [x, y, z],
          seed: index,
        });
      });
    });

    return positions;
  }, [diaries]);

  return (
    <group>
      {/* 草地装饰 */}
      <GrassDecoration />

      {/* 花朵 */}
      {flowerPositions.map(({ diary, position, seed }) => (
        <FlowerSprite
          key={diary.id}
          diary={diary}
          position={position}
          onClick={() => openModal(diary)}
          randomSeed={seed}
        />
      ))}
    </group>
  );
}
