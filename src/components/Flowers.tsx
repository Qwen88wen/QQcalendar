import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
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
  1: '#ffb6c1', // 粉色
  2: '#ff6347', // 红色
  3: '#9370db', // 紫色
  4: '#ffc0cb', // 淡粉
  5: '#ffd700', // 金色
};

interface FlowerSpriteProps {
  diary: Diary;
  position: [number, number, number];
  onClick: () => void;
}

function FlowerSprite({ diary, position, onClick }: FlowerSpriteProps) {
  const groupRef = useRef<THREE.Group>(null);
  const flowerType = (diary.flower_type || 1) as FlowerType;
  const imagePath = FLOWER_IMAGES[flowerType];

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
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.02;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {/* 茎 */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.8, 6]} />
        <meshStandardMaterial color="#228b22" />
      </mesh>

      {/* 花朵 - 使用 Billboard 始终面向相机 */}
      <Billboard position={[0, 1, 0]} follow={true} lockX={false} lockY={false} lockZ={false}>
        {texture ? (
          <mesh>
            <planeGeometry args={[1.2, 1.2]} />
            <meshBasicMaterial
              map={texture}
              transparent={true}
              alphaTest={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
        ) : (
          // 备用: 简单圆形
          <mesh>
            <circleGeometry args={[0.4, 32]} />
            <meshBasicMaterial color={FLOWER_COLORS[flowerType]} />
          </mesh>
        )}
      </Billboard>

      {/* 叶子 */}
      <mesh position={[0.12, 0.35, 0]} rotation={[0, 0, -0.6]}>
        <planeGeometry args={[0.25, 0.12]} />
        <meshStandardMaterial color="#32cd32" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.1, 0.25, 0]} rotation={[0, 0, 0.5]}>
        <planeGeometry args={[0.2, 0.1]} />
        <meshStandardMaterial color="#228b22" side={THREE.DoubleSide} />
      </mesh>
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
    const positions: { diary: Diary; position: [number, number, number] }[] = [];

    Object.values(dateGroups).forEach((group) => {
      group.forEach((diary, index) => {
        const date = new Date(diary.created_at);
        const month = date.getMonth() + 1;
        const day = date.getDate();

        const { x, y, z } = getDayPosition(month, day, index);
        positions.push({
          diary,
          position: [x, y, z],
        });
      });
    });

    return positions;
  }, [diaries]);

  return (
    <group>
      {flowerPositions.map(({ diary, position }) => (
        <FlowerSprite
          key={diary.id}
          diary={diary}
          position={position}
          onClick={() => openModal(diary)}
        />
      ))}
    </group>
  );
}
