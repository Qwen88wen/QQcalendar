import { useState, useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { deleteDiary, createTodo as createTodoInDB, updateTodo as updateTodoInDB, deleteTodo as deleteTodoInDB } from '../lib/diary';
import './Memo.css';

const FLOWER_ICONS: Record<number, string> = {
  1: '🌹',
  2: '🌷',
  3: '💐',
  4: '🌸',
  5: '🌻',
};

export function Memo() {
  const { diaries, openModal, selectedDate, removeDiary, todos, activeInputUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<'records' | 'todos'>('records');
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'complete'>('all');

  // 选择模式状态
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // 获取当前查看的日期（选中日期或今天）
  const viewDate = selectedDate || new Date();

  // 格式化显示日期
  const formatViewDate = () => {
    const today = new Date();
    if (viewDate.toDateString() === today.toDateString()) {
      return '今天';
    }
    return `${viewDate.getMonth() + 1}月${viewDate.getDate()}日`;
  };

  // 按选中日期筛选记录
  const dateFilteredDiaries = useMemo(() => {
    const viewDateStr = viewDate.toDateString();
    return diaries.filter(d => new Date(d.created_at).toDateString() === viewDateStr);
  }, [diaries, viewDate]);

  // 待办输入
  const [newTodoText, setNewTodoText] = useState('');

  // 添加待办庆祝动画
  const [showAddTodoCelebration, setShowAddTodoCelebration] = useState(false);

  // 完成待办庆祝动画
  const [showCelebration, setShowCelebration] = useState(false);

  // 添加待办
  const addTodo = async () => {
    if (!newTodoText.trim()) return;
    // 使用当前查看的日期（选中日期或今天）
    const todoDate = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth(),
      viewDate.getDate(),
      12, 0, 0
    );

    const newTodo = await createTodoInDB({
      text: newTodoText.trim(),
      done: false,
      created_at: todoDate.toISOString(),
      user_name: activeInputUser,
    });

    if (newTodo) {
      // 不手动添加到状态，让 realtime 订阅处理
      setNewTodoText('');

      // 显示添加庆祝动画
      setShowAddTodoCelebration(true);
      setTimeout(() => setShowAddTodoCelebration(false), 1500);
    }
  };

  // 切换待办状态
  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    // 如果从未完成变成完成，显示庆祝动画
    if (!todo.done) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1500); // 1.5秒后隐藏
    }

    await updateTodoInDB(id, { done: !todo.done });
    // 让 realtime 订阅处理状态更新
  };

  // 删除待办
  const handleDeleteTodo = async (id: string) => {
    await deleteTodoInDB(id);
    // 让 realtime 订阅处理状态更新
  };

  // 按状态筛选并排序（最新的在前）
  const filteredDiaries = useMemo(() => {
    let filtered = [...dateFilteredDiaries];
    if (filter === 'incomplete') {
      filtered = filtered.filter(d => d.status === 'incomplete');
    } else if (filter === 'complete') {
      filtered = filtered.filter(d => d.status === 'complete');
    }
    return filtered.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [dateFilteredDiaries, filter]);

  // 统计数据（基于选中日期）
  const stats = useMemo(() => {
    const total = dateFilteredDiaries.length;
    const complete = dateFilteredDiaries.filter(d => d.status === 'complete').length;
    const incomplete = dateFilteredDiaries.filter(d => d.status === 'incomplete').length;
    return { total, complete, incomplete };
  }, [dateFilteredDiaries]);

  // 按日期筛选待办事项
  const filteredTodos = useMemo(() => {
    const viewDateStr = viewDate.toDateString();
    return todos.filter(t => new Date(t.created_at).toDateString() === viewDateStr);
  }, [todos, viewDate]);

  // 待办统计（基于选中日期）
  const todoStats = useMemo(() => {
    const total = filteredTodos.length;
    const done = filteredTodos.filter(t => t.done).length;
    return { total, done, pending: total - done };
  }, [filteredTodos]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // 切换选择
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDiaries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDiaries.map(d => d.id)));
    }
  };

  // 退出选择模式
  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  // 删除单条记录
  const handleDeleteSingle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这条记录吗？')) return;

    setIsDeleting(true);
    const success = await deleteDiary(id);
    if (success) {
      removeDiary(id);
    } else {
      alert('删除失败，请重试');
    }
    setIsDeleting(false);
  };

  // 批量删除
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？`)) return;

    setIsDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      const success = await deleteDiary(id);
      if (success) {
        removeDiary(id);
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsDeleting(false);
    setSelectedIds(new Set());

    if (failCount > 0) {
      alert(`删除完成: 成功 ${successCount} 条, 失败 ${failCount} 条`);
    }

    if (successCount > 0 && selectedIds.size === successCount) {
      exitSelectMode();
    }
  };

  return (
    <div className="memo">
      {/* 完成待办庆祝动画 */}
      {showCelebration && (
        <div className="celebration-overlay">
          <img src="/memo-bg.gif" alt="庆祝" className="celebration-gif" />
        </div>
      )}

      {/* 添加待办庆祝动画 */}
      {showAddTodoCelebration && (
        <div className="celebration-overlay">
          <img src="/flatno.gif" alt="收到！" className="celebration-gif" />
        </div>
      )}

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
          {/* 日期标题 */}
          <div className="memo-date-header">
            <span className="date-label">{formatViewDate()}</span>
            <span className="date-hint">的记录</span>
          </div>

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

          {/* 筛选器和操作栏 */}
          <div className="memo-filter">
            {isSelectMode ? (
              <>
                <button
                  className="filter-btn select-all"
                  onClick={toggleSelectAll}
                >
                  {selectedIds.size === filteredDiaries.length ? '取消全选' : '全选'}
                </button>
                <span className="selected-count">
                  已选 {selectedIds.size} 项
                </span>
                <button
                  className="filter-btn delete-btn"
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.size === 0 || isDeleting}
                >
                  {isDeleting ? '删除中...' : '🗑️ 删除'}
                </button>
                <button
                  className="filter-btn cancel-btn"
                  onClick={exitSelectMode}
                >
                  取消
                </button>
              </>
            ) : (
              <>
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
                {filteredDiaries.length > 0 && (
                  <button
                    className="filter-btn select-mode-btn"
                    onClick={() => setIsSelectMode(true)}
                  >
                    选择
                  </button>
                )}
              </>
            )}
          </div>

          {/* 记录列表 */}
          <div className="memo-list">
            {filteredDiaries.length === 0 ? (
              <div className="memo-empty">
                <span className="empty-icon">🌱</span>
                <p>暂无记录</p>
              </div>
            ) : (
              filteredDiaries.map(diary => {
                const needsVehicle = !diary.vehicle;
                const isIncomplete = diary.status === 'incomplete';
                const hasWarning = needsVehicle || isIncomplete;
                const isSelected = selectedIds.has(diary.id);

                return (
                  <div
                    key={diary.id}
                    className={`memo-item ${diary.status} ${hasWarning ? 'has-warning' : ''} ${isSelectMode && isSelected ? 'selected' : ''}`}
                    onClick={() => isSelectMode ? toggleSelect(diary.id) : openModal(diary)}
                  >
                    <div className="memo-item-header">
                      {isSelectMode && (
                        <button
                          className={`memo-checkbox ${isSelected ? 'checked' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(diary.id);
                          }}
                        >
                          {isSelected ? '✓' : ''}
                        </button>
                      )}
                      <span className="memo-flower">
                        {FLOWER_ICONS[diary.flower_type || 1]}
                      </span>
                      <span className="memo-customer">
                        {diary.customer || diary.user_name || '未命名'}
                      </span>
                      <span className={`memo-status ${diary.status}`}>
                        {diary.status === 'complete' ? '✓' : '○'}
                      </span>
                      {!isSelectMode && (
                        <button
                          className="memo-delete-btn"
                          onClick={(e) => handleDeleteSingle(diary.id, e)}
                          disabled={isDeleting}
                          title="删除记录"
                        >
                          🗑️
                        </button>
                      )}
                    </div>

                    {/* 警告标签 */}
                    {hasWarning && (
                      <div className="memo-warnings">
                        {needsVehicle && (
                          <span className="warning-tag vehicle">
                            🚗 未填车号
                          </span>
                        )}
                        {isIncomplete && (
                          <span className="warning-tag status">
                            ⏳ 未完成割果
                          </span>
                        )}
                      </div>
                    )}

                    <div className="memo-item-details">
                      {diary.worker && <span className="detail">👷 {diary.worker}</span>}
                      {diary.vehicle && <span className="detail">🚗 {diary.vehicle}</span>}
                    </div>
                    {diary.remark && (
                      <div className="memo-item-remark">{diary.remark}</div>
                    )}
                    <div className="memo-item-time">{formatDate(diary.created_at)}</div>
                  </div>
                );
              })
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
            {filteredTodos.length === 0 ? (
              <div className="memo-empty">
                <span className="empty-icon">📝</span>
                <p>{formatViewDate()}暂无待办</p>
                <p className="empty-hint">添加一些待办事项吧</p>
              </div>
            ) : (
              filteredTodos.map(todo => (
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
                    onClick={() => handleDeleteTodo(todo.id)}
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
