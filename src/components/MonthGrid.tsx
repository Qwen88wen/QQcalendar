import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const MONTHS = [
  '一月', '二月', '三月', '四月',
  '五月', '六月', '七月', '八月',
  '九月', '十月', '十一月', '十二月'
];

// 4列 x 3行 布局
const GRID_COLS = 4;
const GRID_ROWS = 3;
const CELL_WIDTH = 10;
const CELL_HEIGHT = 10;

// 计算月份在网格中的位置
export function getMonthPosition(month: number): { x: number; z: number } {
  const col = (month - 1) % GRID_COLS;
  const row = Math.floor((month - 1) / GRID_COLS);

  // 居中整个网格
  const offsetX = ((GRID_COLS - 1) * CELL_WIDTH) / 2;
  const offsetZ = ((GRID_ROWS - 1) * CELL_HEIGHT) / 2;

  return {
    x: col * CELL_WIDTH - offsetX,
    z: row * CELL_HEIGHT - offsetZ,
  };
}

// 根据日期计算在月份方格内的位置 (带 jitter)
export function getDayPosition(
  month: number,
  day: number,
  jitterIndex: number = 0
): { x: number; y: number; z: number } {
  const { x: monthX, z: monthZ } = getMonthPosition(month);

  // 在方格内按日期分布 (7x5 网格，类似日历)
  const dayCol = (day - 1) % 7;
  const dayRow = Math.floor((day - 1) / 7);

  // 日期在方格内的相对位置
  const dayOffsetX = (dayCol - 3) * 1.2;
  const dayOffsetZ = (dayRow - 2) * 1.2;

  // 添加随机 jitter 防止重叠
  const jitterX = (Math.sin(jitterIndex * 1234.5) * 0.5);
  const jitterZ = (Math.cos(jitterIndex * 5678.9) * 0.5);

  return {
    x: monthX + dayOffsetX + jitterX,
    y: 0,
    z: monthZ + dayOffsetZ + jitterZ,
  };
}

function MonthCell({ month, name }: { month: number; name: string }) {
  const { x, z } = getMonthPosition(month);

  const edgeGeometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(CELL_WIDTH - 0.5, CELL_HEIGHT - 0.5);
    return new THREE.EdgesGeometry(plane);
  }, []);

  return (
    <group position={[x, 0, z]}>
      {/* 月份方格背景 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[CELL_WIDTH - 0.5, CELL_HEIGHT - 0.5]} />
        <meshStandardMaterial
          color="#3a7d32"
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* 边框线 */}
      <lineSegments position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={edgeGeometry} attach="geometry" />
        <lineBasicMaterial color="#5a9d52" />
      </lineSegments>

      {/* 月份名称 */}
      <Text
        position={[0, 0.1, -CELL_HEIGHT / 2 + 0.8]}
        fontSize={0.8}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
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
        <MonthCell key={index + 1} month={index + 1} name={name} />
      ))}
    </group>
  );
}
