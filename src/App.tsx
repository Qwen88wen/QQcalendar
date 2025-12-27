import { Calendar2D } from './components/Calendar2D';
import { Memo } from './components/Memo';
import { TitleBar } from './components/TitleBar';
import { InputBar } from './components/InputBar';
import { DiaryModal } from './components/DiaryModal';
import { RecordList } from './components/RecordList';
import { MissingVehicleList } from './components/MissingVehicleList';
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
      <TitleBar />
      <div className="main-container">
        <div className="memo-section">
          <Memo />
        </div>
        <div className="calendar-section">
          <Calendar2D />
        </div>
      </div>
      <InputBar />
      <DiaryModal />
      <RecordList />
      <MissingVehicleList />
    </div>
  );
}
