import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import './Memo.css';

const FLOWER_ICONS: Record<number, string> = {
  1: '🌹',
  2: '🌷',
  3: '🪻',
  4: '🌸',
  5: '🌻',
};

interface QuickTodo {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

export function Memo() {
  const { diaries, openModal } = useAppStore();
  const [activeTab, setActiveTab] = useState<'records' | 'todos'>('records');
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'complete'>('all');

  // 快速待办
  const [todos, setTodos] = useState<QuickTodo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');

  // 从 localStorage 加载待办
  useEffect(() => {
    const saved = localStorage.getItem('qq-calendar-todos');
    if (saved) {
      setTodos(JSON.parse(saved));
    }
  }, []);

  // 保存待办到 localStorage
  useEffect(() => {
    localStorage.setItem('qq-calendar-todos', JSON.stringify(todos));
  }, [todos]);

  // 添加待办
  const addTodo = () => {
    if (!newTodoText.trim()) return;
    const newTodo: QuickTodo = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    };
    setTodos([newTodo, ...todos]);
    setNewTodoText('');
  };

  // 切换待办状态
  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ));
  };

  // 删除待办
  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // 按状态筛选并排序（最新的在前）
  const filteredDiaries = useMemo(() => {
    let filtered = [...diaries];
    if (filter === 'incomplete') {
      filtered = filtered.filter(d => d.status === 'incomplete');
    } else if (filter === 'complete') {
      filtered = filtered.filter(d => d.status === 'complete');
    }
    return filtered.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [diaries, filter]);

  // 统计数据
  const stats = useMemo(() => {
    const total = diaries.length;
    const complete = diaries.filter(d => d.status === 'complete').length;
    const incomplete = diaries.filter(d => d.status === 'incomplete').length;
    return { total, complete, incomplete };
  }, [diaries]);

  // 待办统计
  const todoStats = useMemo(() => {
    const total = todos.length;
    const done = todos.filter(t => t.done).length;
    return { total, done, pending: total - done };
  }, [todos]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="memo">
      {/* 标签切换 */}
      <div className="memo-tabs">
        <button
          className={`memo-tab ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          📋 记录
        </button>
        <button
          className={`memo-tab ${activeTab === 'todos' ? 'active' : ''}`}
          onClick={() => setActiveTab('todos')}
        >
          ✅ 待办 {todoStats.pending > 0 && <span className="tab-badge">{todoStats.pending}</span>}
        </button>
      </div>

      {activeTab === 'records' ? (
        <>
          {/* 统计卡片 */}
          <div className="memo-stats">
            <div className="stat-card total">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">总记录</span>
            </div>
            <div className="stat-card incomplete">
              <span className="stat-number">{stats.incomplete}</span>
              <span className="stat-label">未完成</span>
            </div>
            <div className="stat-card complete">
              <span className="stat-number">{stats.complete}</span>
              <span className="stat-label">已完成</span>
            </div>
          </div>

          {/* 筛选器 */}
          <div className="memo-filter">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              全部
            </button>
            <button
              className={`filter-btn ${filter === 'incomplete' ? 'active' : ''}`}
              onClick={() => setFilter('incomplete')}
            >
              未完成
            </button>
            <button
              className={`filter-btn ${filter === 'complete' ? 'active' : ''}`}
              onClick={() => setFilter('complete')}
            >
              已完成
            </button>
          </div>

          {/* 记录列表 */}
          <div className="memo-list">
            {filteredDiaries.length === 0 ? (
              <div className="memo-empty">
                <span className="empty-icon">🌱</span>
                <p>暂无记录</p>
              </div>
            ) : (
              filteredDiaries.map(diary => (
                <div
                  key={diary.id}
                  className={`memo-item ${diary.status}`}
                  onClick={() => openModal(diary)}
                >
                  <div className="memo-item-header">
                    <span className="memo-flower">
                      {FLOWER_ICONS[diary.flower_type || 1]}
                    </span>
                    <span className="memo-customer">
                      {diary.customer || diary.user_name || '未命名'}
                    </span>
                    <span className={`memo-status ${diary.status}`}>
                      {diary.status === 'complete' ? '✓' : '○'}
                    </span>
                  </div>
                  <div className="memo-item-details">
                    {diary.worker && <span className="detail">👷 {diary.worker}</span>}
                    {diary.vehicle && <span className="detail">🚗 {diary.vehicle}</span>}
                  </div>
                  {diary.remark && (
                    <div className="memo-item-remark">{diary.remark}</div>
                  )}
                  <div className="memo-item-time">{formatDate(diary.created_at)}</div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* 待办输入 */}
          <div className="todo-input">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              placeholder="输入待办事项..."
            />
            <button onClick={addTodo} disabled={!newTodoText.trim()}>
              添加
            </button>
          </div>

          {/* 待办统计 */}
          <div className="todo-stats">
            <span>共 {todoStats.total} 项</span>
            <span className="done">✓ {todoStats.done} 已完成</span>
            <span className="pending">○ {todoStats.pending} 待办</span>
          </div>

          {/* 待办列表 */}
          <div className="todo-list">
            {todos.length === 0 ? (
              <div className="memo-empty">
                <span className="empty-icon">📝</span>
                <p>暂无待办</p>
                <p className="empty-hint">添加一些待办事项吧</p>
              </div>
            ) : (
              todos.map(todo => (
                <div
                  key={todo.id}
                  className={`todo-item ${todo.done ? 'done' : ''}`}
                >
                  <button
                    className="todo-checkbox"
                    onClick={() => toggleTodo(todo.id)}
                  >
                    {todo.done ? '✓' : ''}
                  </button>
                  <span className="todo-text">{todo.text}</span>
                  <button
                    className="todo-delete"
                    onClick={() => deleteTodo(todo.id)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
