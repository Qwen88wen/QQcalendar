import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { MonthGrid } from './MonthGrid';
import { Flowers } from './Flowers';

export function Scene3D() {
  return (
    <Canvas
      style={{ width: '100%', height: '100%', touchAction: 'none' }}
      gl={{ antialias: true, alpha: true }}
    >
      <PerspectiveCamera makeDefault position={[0, 15, 20]} fov={60} />

      {/* 光照 */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />
      <pointLight position={[-10, 10, -10]} intensity={0.4} />

      {/* 地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[50, 40]} />
        <meshStandardMaterial color="#2d5a27" />
      </mesh>

      {/* 12个月份网格 */}
      <MonthGrid />

      {/* 花朵 */}
      <Flowers />

      {/* 控制器 - 支持触屏 */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.2}
        touches={{
          ONE: 1, // ROTATE
          TWO: 2, // DOLLY_PAN
        }}
      />
    </Canvas>
  );
}
