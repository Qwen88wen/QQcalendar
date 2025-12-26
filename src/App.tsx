import { Scene3D } from './components/Scene3D';
import { Toolbar } from './components/Toolbar';
import { DiaryModal } from './components/DiaryModal';
import { useAuth } from './hooks/useAuth';
import { useRealtime } from './hooks/useRealtime';
import './App.css';

export default function App() {
  // 初始化认证
  useAuth();

  // 初始化实时同步
  useRealtime();

  return (
    <div className="app">
      <Toolbar />
      <div className="scene-container">
        <Scene3D />
      </div>
      <DiaryModal />
    </div>
  );
}
