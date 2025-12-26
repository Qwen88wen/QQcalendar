import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { MonthGrid } from './MonthGrid';
import { Flowers } from './Flowers';
import { useAppStore } from '../stores/appStore';

// 圆形草地组件
function CircularGround() {
  return (
    <group>
      {/* 主草地 - 圆形 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color="#4a8f3c" />
      </mesh>

      {/* 边缘装饰圈 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <ringGeometry args={[38, 42, 64]} />
        <meshStandardMaterial color="#3d7a32" transparent opacity={0.6} />
      </mesh>

      {/* 小花装饰边缘 */}
      {Array.from({ length: 30 }).map((_, i) => {
        const angle = (i / 30) * Math.PI * 2;
        const radius = 39;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const colors = ['#ffb6c1', '#ffd700', '#9370db', '#ff6347', '#ffc0cb'];
        return (
          <mesh key={i} position={[x, 0.1, z]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color={colors[i % colors.length]} />
          </mesh>
        );
      })}
    </group>
  );
}

// 相机控制器 (支持飞到指定花朵)
function CameraController() {
  const controlsRef = useRef<any>(null);
  const { focusedFlowerId, setFocusedFlower } = useAppStore();

  useFrame(() => {
    if (focusedFlowerId && controlsRef.current) {
      // TODO: 实现相机飞行到指定位置
      setFocusedFlower(null);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={10}
      maxDistance={70}
      maxPolarAngle={Math.PI / 2.05}
      minPolarAngle={Math.PI / 8}
      target={[0, 0, 0]}
      panSpeed={0.8}
      rotateSpeed={0.5}
      zoomSpeed={1.0}
      touches={{
        ONE: 1,
        TWO: 2,
      }}
    />
  );
}

export function Scene3D() {
  return (
    <Canvas
      style={{ width: '100%', height: '100%', touchAction: 'none' }}
      gl={{ antialias: true, alpha: false }}
      shadows
    >
      {/* 相机 - 45度俯视角 */}
      <PerspectiveCamera makeDefault position={[0, 30, 40]} fov={50} />

      {/* 天空背景 - 纯净蓝天 */}
      <color attach="background" args={['#87CEEB']} />

      {/* 光照 - 温暖阳光 */}
      <ambientLight intensity={0.8} color="#fff8e7" />
      <directionalLight
        position={[20, 40, 30]}
        intensity={1.5}
        color="#fff5e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={120}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <directionalLight position={[-15, 20, -15]} intensity={0.3} color="#e0f0ff" />
      <hemisphereLight args={['#87CEEB', '#4a8f3c', 0.4]} />

      {/* 圆形草地 */}
      <CircularGround />

      {/* 12个月份网格 */}
      <MonthGrid />

      {/* 花朵 */}
      <Flowers />

      {/* 相机控制器 */}
      <CameraController />
    </Canvas>
  );
}
