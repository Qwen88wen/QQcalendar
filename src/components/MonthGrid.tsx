import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// 布局常量
export const MONTH_SPACING = 14;  // 月份间距
export const DAY_SPACING = 1.5;   // 日期间距
export const GRID_COLS = 4;       // 4列
export const GRID_ROWS = 3;       // 3行

const MONTHS = [
  '2025.01', '2025.02', '2025.03', '2025.04',
  '2025.05', '2025.06', '2025.07', '2025.08',
  '2025.09', '2025.10', '2025.11', '2025.12'
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// 获取月份基础坐标
export function getMonthBasePosition(monthIndex: number): { x: number; z: number } {
  const col = monthIndex % GRID_COLS;
  const row = Math.floor(monthIndex / GRID_COLS);

  // 居中整个网格
  const offsetX = ((GRID_COLS - 1) * MONTH_SPACING) / 2;
  const offsetZ = ((GRID_ROWS - 1) * MONTH_SPACING) / 2;

  return {
    x: col * MONTH_SPACING - offsetX,
    z: row * MONTH_SPACING - offsetZ,
  };
}

// 根据日期计算在月份内的偏移
export function getDayOffset(day: number): { x: number; z: number } {
  const dayCol = (day - 1) % 7;
  const dayRow = Math.floor((day - 1) / 7);

  return {
    x: (dayCol - 3) * DAY_SPACING,
    z: (dayRow - 2.5) * DAY_SPACING,
  };
}

// 计算花朵的绝对位置 (兼容旧接口)
export function getDayPosition(
  month: number,
  day: number,
  jitterIndex: number = 0
): { x: number; y: number; z: number } {
  const monthBase = getMonthBasePosition(month - 1);
  const dayOffset = getDayOffset(day);

  // Jitter 随机偏移 (使用 seed 保持一致性)
  const jitterX = Math.sin(jitterIndex * 12345.67) * 0.35;
  const jitterZ = Math.cos(jitterIndex * 67890.12) * 0.35;

  return {
    x: monthBase.x + dayOffset.x + jitterX,
    y: 0,
    z: monthBase.z + dayOffset.z + jitterZ,
  };
}

// 日期数字组件
function DayNumbers({ monthIndex, daysCount }: { monthIndex: number; daysCount: number }) {
  const { x: baseX, z: baseZ } = getMonthBasePosition(monthIndex);

  return (
    <group>
      {Array.from({ length: daysCount }, (_, i) => {
        const day = i + 1;
        const { x: offsetX, z: offsetZ } = getDayOffset(day);

        return (
          <Text
            key={day}
            position={[baseX + offsetX, 0.02, baseZ + offsetZ]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.32}
            color="#5a7a52"
            anchorX="center"
            anchorY="middle"
            fillOpacity={0.5}
          >
            {day}
          </Text>
        );
      })}
    </group>
  );
}

// 网格线组件
function GridLines({ monthIndex }: { monthIndex: number }) {
  const { x: baseX, z: baseZ } = getMonthBasePosition(monthIndex);

  const gridGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];

    // 横向线 (6条)
    for (let row = 0; row <= 5; row++) {
      const z = (row - 2.5) * DAY_SPACING;
      points.push(new THREE.Vector3(-3.5 * DAY_SPACING, 0, z));
      points.push(new THREE.Vector3(3.5 * DAY_SPACING, 0, z));
    }

    // 纵向线 (8条)
    for (let col = 0; col <= 7; col++) {
      const x = (col - 3.5) * DAY_SPACING;
      points.push(new THREE.Vector3(x, 0, -3 * DAY_SPACING));
      points.push(new THREE.Vector3(x, 0, 3 * DAY_SPACING));
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  return (
    <lineSegments position={[baseX, 0.01, baseZ]} geometry={gridGeometry}>
      <lineBasicMaterial color="#4a6a42" opacity={0.35} transparent />
    </lineSegments>
  );
}

// 月份地块组件
function MonthPlot({ monthIndex, name, daysCount }: { monthIndex: number; name: string; daysCount: number }) {
  const { x, z } = getMonthBasePosition(monthIndex);

  return (
    <group>
      {/* 月份地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.005, z]} receiveShadow>
        <planeGeometry args={[MONTH_SPACING - 1.5, MONTH_SPACING - 1.5]} />
        <meshStandardMaterial
          color="#3a5a32"
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* 网格线 */}
      <GridLines monthIndex={monthIndex} />

      {/* 日期数字 */}
      <DayNumbers monthIndex={monthIndex} daysCount={daysCount} />

      {/* 月份标签背景 - 浪漫风格 */}
      <mesh position={[x, 2.8, z - MONTH_SPACING / 2 + 1.5]} rotation={[0, 0, 0]}>
        <planeGeometry args={[4.5, 1.4]} />
        <meshBasicMaterial color="#fef6f0" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* 月份标签 - 静态浪漫字体 */}
      <Text
        position={[x, 2.85, z - MONTH_SPACING / 2 + 1.5]}
        fontSize={1.0}
        color="#d4707a"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/dancingscript/v25/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7BMSo3Sup6hNX6plRP.woff"
        letterSpacing={0.05}
      >
        {name}
      </Text>
    </group>
  );
}

export function MonthGrid() {
  return (
    <group>
      {MONTHS.map((name, index) => (
        <MonthPlot
          key={index}
          monthIndex={index}
          name={name}
          daysCount={DAYS_IN_MONTH[index]}
        />
      ))}
    </group>
  );
}
