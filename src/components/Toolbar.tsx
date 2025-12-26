import { useAppStore } from '../stores/appStore';
import { supabase } from '../lib/supabase';
import './Toolbar.css';

export function Toolbar() {
  const { userId, userName, userRole, openModal, isLoading } = useAppStore();

  const handleLogin = async () => {
    // 使用 Supabase Auth UI 或自定义登录
    const email = prompt('请输入邮箱:');
    const password = prompt('请输入密码:');

    if (email && password) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert('登录失败: ' + error.message);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isEditor = userRole === 'editor';

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <h1 className="app-title">🌸 3D 日记花园</h1>
      </div>

      <div className="toolbar-right">
        {isLoading ? (
          <span className="loading-text">加载中...</span>
        ) : userId ? (
          <>
            <span className="user-info">
              {userName || '用户'}
              <span className={`role-badge ${userRole}`}>
                {isEditor ? '编辑者' : '观察者'}
              </span>
            </span>

            {isEditor && (
              <button className="add-btn" onClick={() => openModal()}>
                + 新记录
              </button>
            )}

            <button className="logout-btn" onClick={handleLogout}>
              退出
            </button>
          </>
        ) : (
          <button className="login-btn" onClick={handleLogin}>
            登录
          </button>
        )}
      </div>
    </div>
  );
}
