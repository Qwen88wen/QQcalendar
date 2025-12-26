import { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { LoginModal } from './LoginModal';
import './Toolbar.css';

export function Toolbar() {
  const { userId, userName, userRole, openModal, logoutUser } = useAppStore();
  const [showLogin, setShowLogin] = useState(false);

  const isEditor = userRole === 'editor';

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="app-title">3D 日记花园</h1>
        </div>

        <div className="toolbar-right">
          {userId ? (
            <>
              <span className="user-info">
                {userName}
                <span className={`role-badge ${userRole}`}>
                  {isEditor ? '编辑者' : '观察者'}
                </span>
              </span>

              {isEditor && (
                <button className="add-btn" onClick={() => openModal()}>
                  + 新记录
                </button>
              )}

              <button className="logout-btn" onClick={logoutUser}>
                退出
              </button>
            </>
          ) : (
            <button className="login-btn" onClick={() => setShowLogin(true)}>
              登录
            </button>
          )}
        </div>
      </div>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
