import { useState, useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { createTodo as createTodoInDB, updateTodo as updateTodoInDB, deleteTodo as deleteTodoInDB } from '../lib/diary';
import './FloatingTodoButton.css';

export function FloatingTodoButton() {
  const { todos, activeInputUser } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');

  // 庆祝动画状态
  const [showAddCelebration, setShowAddCelebration] = useState(false);
  const [showCompleteCelebration, setShowCompleteCelebration] = useState(false);

  // 所有待办统计
  const todoStats = useMemo(() => {
    const total = todos.length;
    const done = todos.filter(t => t.done).length;
    return { total, done, pending: total - done };
  }, [todos]);

  // 按创建时间排序，最新的在前面
  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [todos]);

  // 添加待办
  const addTodo = async () => {
    if (!newTodoText.trim()) return;

    const newTodo = await createTodoInDB({
      text: newTodoText.trim(),
      done: false,
      created_at: new Date().toISOString(),
      user_name: activeInputUser,
    });

    if (newTodo) {
      setNewTodoText('');
      setShowAddCelebration(true);
      setTimeout(() => setShowAddCelebration(false), 1500);
    }
  };

  // 切换待办状态
  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    if (!todo.done) {
      setShowCompleteCelebration(true);
      setTimeout(() => setShowCompleteCelebration(false), 1500);
    }

    await updateTodoInDB(id, { done: !todo.done });
  };

  // 删除待办
  const handleDeleteTodo = async (id: string) => {
    await deleteTodoInDB(id);
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        className={`floating-todo-btn ${todoStats.pending > 0 ? 'has-pending' : ''}`}
        onClick={() => setIsOpen(true)}
        title="查看待办事项"
      >
        <span className="floating-todo-icon">✓</span>
        {todoStats.pending > 0 && (
          <span className="floating-todo-badge">{todoStats.pending}</span>
        )}
      </button>

      {/* 待办窗口遮罩 */}
      {isOpen && (
        <div className="floating-todo-overlay" onClick={() => setIsOpen(false)}>
          <div className="floating-todo-panel" onClick={e => e.stopPropagation()}>
            {/* 庆祝动画 */}
            {showAddCelebration && (
              <div className="floating-celebration">
                <img src="/flatno.gif" alt="收到！" />
              </div>
            )}
            {showCompleteCelebration && (
              <div className="floating-celebration">
                <img src="/memo-bg.gif" alt="庆祝" />
              </div>
            )}

            {/* 面板头部 */}
            <div className="floating-todo-header">
              <h3>✅ 待办事项</h3>
              <button className="floating-close-btn" onClick={() => setIsOpen(false)}>
                ×
              </button>
            </div>

            {/* 待办输入 */}
            <div className="floating-todo-input">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                placeholder="添加新待办..."
              />
              <button onClick={addTodo} disabled={!newTodoText.trim()}>
                添加
              </button>
            </div>

            {/* 待办统计 */}
            <div className="floating-todo-stats">
              <span>共 {todoStats.total} 项</span>
              <span className="done">✓ {todoStats.done} 已完成</span>
              <span className="pending">○ {todoStats.pending} 待办</span>
            </div>

            {/* 待办列表 */}
            <div className="floating-todo-list">
              {sortedTodos.length === 0 ? (
                <div className="floating-todo-empty">
                  <span className="empty-icon">📝</span>
                  <p>暂无待办事项</p>
                  <p className="empty-hint">添加一些待办吧</p>
                </div>
              ) : (
                <>
                  <div className="floating-todo-section-title">待办</div>
                  {sortedTodos.map(todo => (
                  <div
                    key={todo.id}
                    className={`floating-todo-item ${todo.done ? 'done' : ''}`}
                  >
                    <button
                      className="floating-checkbox"
                      onClick={() => toggleTodo(todo.id)}
                    >
                      {todo.done ? '✓' : ''}
                    </button>
                    <div className="floating-todo-content">
                      <span className="floating-todo-text">{todo.text}</span>
                      <span className="floating-todo-date">{formatDate(todo.created_at)}</span>
                    </div>
                    <button
                      className="floating-delete"
                      onClick={() => handleDeleteTodo(todo.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
