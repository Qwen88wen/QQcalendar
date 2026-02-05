import { useState, useMemo, useEffect, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { createTodo as createTodoInDB, updateTodo as updateTodoInDB, deleteTodo as deleteTodoInDB } from '../lib/diary';
import './FloatingTodoButton.css';

export function FloatingTodoButton() {
  const { todos, activeInputUser } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 删除确认状态
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 庆祝动画状态
  const [showAddCelebration, setShowAddCelebration] = useState(false);
  const [showCompleteCelebration, setShowCompleteCelebration] = useState(false);

  // 所有待办统计
  const todoStats = useMemo(() => {
    const total = todos.length;
    const done = todos.filter(t => t.done).length;
    return { total, done, pending: total - done };
  }, [todos]);

  // 分组：未完成和已完成
  const { pendingTodos, completedTodos } = useMemo(() => {
    const sorted = [...todos].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return {
      pendingTodos: sorted.filter(t => !t.done),
      completedTodos: sorted.filter(t => t.done),
    };
  }, [todos]);

  // ESC键关闭窗口
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setDeleteConfirmId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 打开窗口时自动聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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
      // 添加后保持聚焦
      inputRef.current?.focus();
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

  // 删除待办（带确认）
  const handleDeleteTodo = async (id: string) => {
    if (deleteConfirmId === id) {
      await deleteTodoInDB(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      // 3秒后自动取消确认状态
      setTimeout(() => setDeleteConfirmId(prev => prev === id ? null : prev), 3000);
    }
  };

  // 一键清除已完成
  const clearCompleted = async () => {
    if (completedTodos.length === 0) return;
    if (!confirm(`确定要清除 ${completedTodos.length} 条已完成的待办吗？`)) return;

    for (const todo of completedTodos) {
      await deleteTodoInDB(todo.id);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 渲染待办项
  const renderTodoItem = (todo: typeof todos[0]) => (
    <div
      key={todo.id}
      className={`floating-todo-item ${todo.done ? 'done' : ''} ${deleteConfirmId === todo.id ? 'delete-confirm' : ''}`}
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
        className={`floating-delete ${deleteConfirmId === todo.id ? 'confirm' : ''}`}
        onClick={() => handleDeleteTodo(todo.id)}
        title={deleteConfirmId === todo.id ? '再次点击确认删除' : '删除'}
      >
        {deleteConfirmId === todo.id ? '确认?' : '×'}
      </button>
    </div>
  );

  return (
    <>
      {/* 悬浮按钮 */}
      <div className="floating-todo-wrapper" onClick={() => setIsOpen(true)}>
        <button
          className={`floating-todo-btn ${todoStats.pending > 0 ? 'has-pending' : ''}`}
          title="查看待办事项"
        >
          <span className="floating-todo-icon">✓</span>
          {todoStats.pending > 0 && (
            <span className="floating-todo-badge">{todoStats.pending}</span>
          )}
        </button>
        <span className="floating-todo-title">待办事项</span>
      </div>

      {/* 待办窗口遮罩 */}
      {isOpen && (
        <div className="floating-todo-overlay" onClick={() => { setIsOpen(false); setDeleteConfirmId(null); }}>
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
              <button className="floating-close-btn" onClick={() => { setIsOpen(false); setDeleteConfirmId(null); }}>
                ×
              </button>
            </div>

            {/* 待办输入 */}
            <div className="floating-todo-input">
              <input
                ref={inputRef}
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
              {completedTodos.length > 0 && (
                <button className="clear-completed-btn" onClick={clearCompleted}>
                  清除已完成
                </button>
              )}
            </div>

            {/* 待办列表 */}
            <div className="floating-todo-list">
              {todos.length === 0 ? (
                <div className="floating-todo-empty">
                  <span className="empty-icon">📝</span>
                  <p>暂无待办事项</p>
                  <p className="empty-hint">添加一些待办吧</p>
                </div>
              ) : (
                <>
                  {/* 未完成 */}
                  {pendingTodos.length > 0 && (
                    <>
                      <div className="floating-todo-section-title">
                        <span>待办</span>
                        <span className="section-count">{pendingTodos.length}</span>
                      </div>
                      {pendingTodos.map(renderTodoItem)}
                    </>
                  )}

                  {/* 已完成 */}
                  {completedTodos.length > 0 && (
                    <>
                      <div className="floating-todo-section-title completed">
                        <span>已完成</span>
                        <span className="section-count">{completedTodos.length}</span>
                      </div>
                      {completedTodos.map(renderTodoItem)}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
