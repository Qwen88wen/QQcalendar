import { useState, Component, ReactNode } from 'react';
import { Calendar2D } from './components/Calendar2D';
import { Memo } from './components/Memo';
import { TitleBar } from './components/TitleBar';
import { InputBar } from './components/InputBar';
import { DiaryModal } from './components/DiaryModal';
import { RecordList } from './components/RecordList';
import { MissingVehicleList } from './components/MissingVehicleList';
import { UnnotifiedList } from './components/UnnotifiedList';
import { LoginModal } from './components/LoginModal';
import { MasterDataManager } from './components/MasterDataManager';
import { SalaryReport } from './components/SalaryReport';
import { FloatingTodoButton } from './components/FloatingTodoButton';
import { WorkerPanel } from './components/WorkerPanel';
import { useAuth } from './hooks/useAuth';
import { useRealtime } from './hooks/useRealtime';
import { useAppStore, isSessionValid } from './stores/appStore';
import { isSupabaseConfigured } from './lib/supabase';
import './App.css';

// 错误边界组件
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('应用错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'linear-gradient(180deg, #FFF0F5 0%, #FFE4EC 50%, #FFF5EE 100%)',
          padding: '20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>😿</div>
          <h2 style={{ color: '#FF6B8A', marginBottom: '10px' }}>哎呀，出错了！</h2>
          <p style={{ color: '#666', marginBottom: '20px', maxWidth: '400px' }}>
            {this.state.error?.message || '应用加载失败'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #FF91A4 0%, #FF6B8A 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 环境变量未配置提示组件
function ConfigurationRequired() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(180deg, #FFF0F5 0%, #FFE4EC 50%, #FFF5EE 100%)',
      padding: '20px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚙️</div>
      <h2 style={{ color: '#FF6B8A', marginBottom: '10px' }}>环境变量未配置</h2>
      <p style={{ color: '#666', marginBottom: '20px', maxWidth: '500px', lineHeight: '1.6' }}>
        请按以下步骤配置：
      </p>
      <div style={{
        background: 'rgba(255,255,255,0.8)',
        padding: '20px',
        borderRadius: '12px',
        textAlign: 'left',
        maxWidth: '500px',
        fontSize: '14px',
        color: '#333',
        lineHeight: '1.8',
      }}>
        <p style={{ marginBottom: '10px' }}>1. 复制 <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>.env.example</code> 为 <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>.env</code></p>
        <p style={{ marginBottom: '10px' }}>2. 在 <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: '#FF6B8A' }}>Supabase</a> 创建项目并获取 URL 和 Key</p>
        <p style={{ marginBottom: '10px' }}>3. 填入 <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>VITE_SUPABASE_URL</code> 和 <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>VITE_SUPABASE_ANON_KEY</code></p>
        <p>4. 重启开发服务器</p>
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: '20px',
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #FF91A4 0%, #FF6B8A 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        已配置，刷新页面
      </button>
    </div>
  );
}

// 主应用内容组件（需要 Supabase 配置）
function MainAppContent() {
  // 初始化认证
  useAuth();

  // 初始化实时同步
  useRealtime();

  // 获取加载和错误状态
  const { isLoading, error } = useAppStore();

  // 检查 session 是否有效
  const isLoggedIn = isSessionValid();

  // 日历显示状态
  const [isCalendarVisible, setIsCalendarVisible] = useState(true);

  // 未登录时显示登录界面
  if (!isLoggedIn) {
    return <LoginModal isOpen={true} onClose={() => {}} required={true} />;
  }

  // 显示加载状态
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(180deg, #FFF0F5 0%, #FFE4EC 50%, #FFF5EE 100%)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px', animation: 'pulse 1.5s infinite' }}>🌸</div>
        <p style={{ color: '#FF91A4', fontSize: '16px' }}>加载中...</p>
      </div>
    );
  }

  // 显示错误状态
  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(180deg, #FFF0F5 0%, #FFE4EC 50%, #FFF5EE 100%)',
        padding: '20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>😿</div>
        <h2 style={{ color: '#FF6B8A', marginBottom: '10px' }}>连接失败</h2>
        <p style={{ color: '#666', marginBottom: '20px', maxWidth: '400px' }}>
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #FF91A4 0%, #FF6B8A 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          重试
        </button>
      </div>
    );
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
      <UnnotifiedList />
      <MasterDataManager />
      <SalaryReport />
      <FloatingTodoButton />
      <WorkerPanel />
    </div>
  );
}

// 包装组件：检查环境变量配置
function AppContent() {
  // 环境变量未配置时显示配置提示
  if (!isSupabaseConfigured) {
    return <ConfigurationRequired />;
  }
  return <MainAppContent />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
