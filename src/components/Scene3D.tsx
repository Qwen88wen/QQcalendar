import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { MonthGrid } from './MonthGrid';
import { Flowers } from './Flowers';
import { useAppStore } from '../stores/appStore';

// 动态闪烁星星组件
function TwinklingStars() {
  const starsRef = useRef<THREE.Points>(null);

  // 生成随机星星位置和大小
  const { positions, sizes, phases } = useMemo(() => {
    const count = 800;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // 球形分布
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 80 + Math.random() * 40;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(radius * Math.cos(phi)) + 20; // 只在上半球
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      sizes[i] = Math.random() * 2 + 0.5;
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { positions, sizes, phases };
  }, []);

  // 闪烁动画
  useFrame((state) => {
    if (starsRef.current) {
      const time = state.clock.elapsedTime;
      const sizesAttr = starsRef.current.geometry.attributes.size as THREE.BufferAttribute;
      const array = sizesAttr.array as Float32Array;

      for (let i = 0; i < array.length; i++) {
        // 使用正弦波产生闪烁效果
        array[i] = sizes[i] * (0.5 + 0.5 * Math.sin(time * (1 + i % 3) + phases[i]));
      }
      sizesAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.5}
        sizeAttenuation={true}
        color="#ffffff"
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// 流星组件
function ShootingStar() {
  const meshRef = useRef<THREE.Mesh>(null);
  const startPos = useMemo(() => ({
    x: (Math.random() - 0.5) * 100,
    y: 60 + Math.random() * 30,
    z: -50 + Math.random() * 40,
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      const t = (state.clock.elapsedTime * 0.3) % 8;
      if (t < 1) {
        meshRef.current.visible = true;
        meshRef.current.position.x = startPos.x + t * 30;
        meshRef.current.position.y = startPos.y - t * 20;
        meshRef.current.position.z = startPos.z;
        meshRef.current.scale.setScalar(1 - t);
      } else {
        meshRef.current.visible = false;
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.3, 8, 8]} />
      <meshBasicMaterial color="#ffffaa" />
    </mesh>
  );
}

// 圆形草地组件
function CircularGround() {
  return (
    <group>
      {/* 主草地 - 圆形 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color="#2a4a24" />
      </mesh>

      {/* 边缘装饰圈 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <ringGeometry args={[38, 42, 64]} />
        <meshStandardMaterial color="#1d3a18" transparent opacity={0.6} />
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

      {/* 浩瀚星空背景 */}
      <color attach="background" args={['#0a0a1a']} />

      {/* drei 内置星星 - 远景 */}
      <Stars
        radius={100}
        depth={50}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* 自定义闪烁星星 */}
      <TwinklingStars />

      {/* 流星 */}
      <ShootingStar />

      {/* 光照 - 月光效果 */}
      <ambientLight intensity={0.4} color="#b0c4de" />
      <directionalLight
        position={[20, 40, 30]}
        intensity={0.8}
        color="#e6e6fa"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={120}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <pointLight position={[0, 50, 0]} intensity={0.3} color="#4169e1" />
      <hemisphereLight args={['#1a1a3a', '#2a4a24', 0.3]} />

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
