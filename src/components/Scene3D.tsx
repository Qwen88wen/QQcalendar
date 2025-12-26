import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { MonthGrid } from './MonthGrid';
import { Flowers } from './Flowers';

export function Scene3D() {
  return (
    <Canvas
      style={{ width: '100%', height: '100%', touchAction: 'none' }}
      gl={{ antialias: true, alpha: true }}
      shadows
    >
      {/* 相机 - 俯视花园视角 */}
      <PerspectiveCamera makeDefault position={[0, 25, 35]} fov={55} />

      {/* 天空背景色 - 深蓝绿色 */}
      <color attach="background" args={['#1a3040']} />

      {/* 光照 - 明亮的环境光 */}
      <ambientLight intensity={1.2} color="#ffffff" />
      <directionalLight
        position={[15, 30, 20]}
        intensity={1.2}
        color="#fff5e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      {/* 补光 - 柔和的侧面光 */}
      <directionalLight position={[-20, 15, -10]} intensity={0.4} color="#e6f0ff" />
      <pointLight position={[0, 10, 0]} intensity={0.3} color="#ffe4b5" />

      {/* 地面 - 扩展到覆盖整个花园 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[70, 60]} />
        <meshStandardMaterial color="#2a4a24" />
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
        minDistance={8}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 6}
        target={[0, 0, 0]}
        panSpeed={0.8}
        rotateSpeed={0.6}
        zoomSpeed={1.2}
        touches={{
          ONE: 1, // ROTATE
          TWO: 2, // DOLLY_PAN
        }}
      />
    </Canvas>
  );
}
