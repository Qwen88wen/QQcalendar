import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../stores/appStore';
import { getDayPosition } from './MonthGrid';
import type { Diary, FlowerType } from '../types/database';

// 花朵颜色配置 (根据 flower_type 1-5)
const FLOWER_COLORS: Record<FlowerType, { petal: string; center: string }> = {
  1: { petal: '#ff6b6b', center: '#ffd93d' }, // 红玫瑰
  2: { petal: '#4ecdc4', center: '#ffe66d' }, // 青色郁金香
  3: { petal: '#a855f7', center: '#fbbf24' }, // 紫色薰衣草
  4: { petal: '#f472b6', center: '#fde047' }, // 粉色樱花
  5: { petal: '#fbbf24', center: '#92400e' }, // 向日葵
};

interface FlowerProps {
  diary: Diary;
  position: [number, number, number];
  onClick: () => void;
}

function Flower({ diary, position, onClick }: FlowerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const flowerType = (diary.flower_type || 1) as FlowerType;
  const colors = FLOWER_COLORS[flowerType];

  // 轻微摇摆动画
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.05;
    }
  });

  // 花瓣几何体
  const petalShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.2, 0.3, 0, 0.6);
    shape.quadraticCurveTo(-0.2, 0.3, 0, 0);
    return shape;
  }, []);

  const petalGeometry = useMemo(() => {
    return new THREE.ShapeGeometry(petalShape);
  }, [petalShape]);

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
        <cylinderGeometry args={[0.03, 0.05, 0.8, 8]} />
        <meshStandardMaterial color="#228b22" />
      </mesh>

      {/* 花朵头部 */}
      <group position={[0, 0.85, 0]}>
        {/* 花瓣 - 围绕中心排列 */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh
            key={i}
            geometry={petalGeometry}
            position={[0, 0, 0]}
            rotation={[0.3, 0, (i * Math.PI * 2) / 6]}
          >
            <meshStandardMaterial
              color={colors.petal}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}

        {/* 花心 */}
        <mesh position={[0, 0.05, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color={colors.center} />
        </mesh>
      </group>

      {/* 叶子 */}
      <mesh position={[0.15, 0.3, 0]} rotation={[0, 0, -0.5]}>
        <planeGeometry args={[0.3, 0.15]} />
        <meshStandardMaterial color="#32cd32" side={THREE.DoubleSide} />
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
        <Flower
          key={diary.id}
          diary={diary}
          position={position}
          onClick={() => openModal(diary)}
        />
      ))}
    </group>
  );
}
