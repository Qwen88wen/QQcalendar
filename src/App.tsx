import { useState } from 'react';
import { Calendar2D } from './components/Calendar2D';
import { Memo } from './components/Memo';
import { TitleBar } from './components/TitleBar';
import { InputBar } from './components/InputBar';
import { DiaryModal } from './components/DiaryModal';
import { RecordList } from './components/RecordList';
import { MissingVehicleList } from './components/MissingVehicleList';
import { LoginModal } from './components/LoginModal';
import { useAuth } from './hooks/useAuth';
import { useRealtime } from './hooks/useRealtime';
import { useAppStore } from './stores/appStore';
import './App.css';

export default function App() {
  // 初始化认证
  useAuth();

  // 初始化实时同步
  useRealtime();

  // 检查 session 是否有效
  const { isSessionValid } = useAppStore();
  const isLoggedIn = isSessionValid();

  // 日历显示状态
  const [isCalendarVisible, setIsCalendarVisible] = useState(true);

  // 未登录时显示登录界面
  if (!isLoggedIn) {
    return <LoginModal isOpen={true} onClose={() => {}} required={true} />;
  }

  return (
    <div className="app">
      <TitleBar />
      <div className={`main-container ${isCalendarVisible ? '' : 'calendar-hidden'}`}>
        <div className="memo-section">
          <Memo />
        </div>
        {isCalendarVisible && (
          <div className="calendar-section">
            <Calendar2D />
          </div>
        )}
        {/* 日历切换按钮 */}
        <button
          className={`calendar-toggle ${isCalendarVisible ? '' : 'collapsed'}`}
          onClick={() => setIsCalendarVisible(!isCalendarVisible)}
          title={isCalendarVisible ? '隐藏日历' : '显示日历'}
        >
          <span className="hamburger-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
          <span className="toggle-label">{isCalendarVisible ? '📅' : '📅'}</span>
        </button>
      </div>
      <InputBar />
      <DiaryModal />
      <RecordList />
      <MissingVehicleList />
    </div>
  );
}
