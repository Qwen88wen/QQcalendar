import { useState, useMemo, useEffect, useRef, type FormEvent } from 'react';
import { useAppStore } from '../stores/appStore';
import { createTodo as createTodoInDB, updateTodo as updateTodoInDB, deleteTodo as deleteTodoInDB } from '../lib/diary';
import './FloatingTodoButton.css';

// 优先级前缀
const PRIORITY_PREFIX = '⭐';

export function FloatingTodoButton() {
  const { todos, activeInputUser, addTodo: addTodoToStore, updateTodo: updateTodoInStore, removeTodo: removeTodoFromStore } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // 删除确认状态
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 庆祝动画状态
  const [showAddCelebration, setShowAddCelebration] = useState(false);
  const [showCompleteCelebration, setShowCompleteCelebration] = useState(false);

  // 拖拽状态
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<string[]>([]);

  // 解析待办文本，提取优先级
  const parseTodo = (text: string) => {
    const isPriority = text.startsWith(PRIORITY_PREFIX);
    const displayText = isPriority ? text.slice(PRIORITY_PREFIX.length).trim() : text;
    return { isPriority, displayText };
  };

  // 所有待办统计
  const todoStats = useMemo(() => {
    const total = todos.length;
    const done = todos.filter(t => t.done).length;
    return { total, done, pending: total - done };
  }, [todos]);

  // 分组：未完成和已完成，支持拖拽排序
  const { pendingTodos, completedTodos } = useMemo(() => {
    let sorted = [...todos].sort((a, b) => {
      // 优先级高的排前面
      const aPriority = a.text.startsWith(PRIORITY_PREFIX);
      const bPriority = b.text.startsWith(PRIORITY_PREFIX);
      if (aPriority !== bPriority) return bPriority ? 1 : -1;

      // 然后按创建时间排序
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // 应用本地排序
    if (localOrder.length > 0) {
      sorted = sorted.sort((a, b) => {
        const aIndex = localOrder.indexOf(a.id);
        const bIndex = localOrder.indexOf(b.id);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }

    return {
      pendingTodos: sorted.filter(t => !t.done),
      completedTodos: sorted.filter(t => t.done),
    };
  }, [todos, localOrder]);

  // ESC键关闭窗口或取消编辑
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingId) {
          setEditingId(null);
          setEditText('');
        } else if (isOpen) {
          setIsOpen(false);
          setDeleteConfirmId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, editingId]);

  // 打开窗口时自动聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current && !editingId) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, editingId]);

  // 编辑时聚焦输入框
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // 添加待办
  const addTodo = async () => {
    const text = newTodoText.trim();
    if (!text || isAddingTodo) return;

    setIsAddingTodo(true);
    try {
      const newTodo = await createTodoInDB({
        text,
        done: false,
        created_at: new Date().toISOString(),
        user_name: activeInputUser,
      });

      if (newTodo) {
        addTodoToStore(newTodo);
        setNewTodoText('');
        setShowAddCelebration(true);
        setTimeout(() => setShowAddCelebration(false), 1500);
        inputRef.current?.focus();
      }
    } finally {
      setIsAddingTodo(false);
    }
  };

  const handleSubmitNewTodo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await addTodo();
  };

  // 切换待办状态
  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    if (!todo.done) {
      setShowCompleteCelebration(true);
      setTimeout(() => setShowCompleteCelebration(false), 1500);
    }

    const updatedTodo = await updateTodoInDB(id, { done: !todo.done });
    if (updatedTodo) {
      updateTodoInStore(updatedTodo);
    }
  };

  // 切换优先级
  const togglePriority = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const { isPriority, displayText } = parseTodo(todo.text);
    const newText = isPriority ? displayText : `${PRIORITY_PREFIX} ${todo.text}`;
    const updatedTodo = await updateTodoInDB(id, { text: newText });
    if (updatedTodo) {
      updateTodoInStore(updatedTodo);
    }
  };

  // 开始编辑
  const startEdit = (id: string, text: string) => {
    const { displayText } = parseTodo(text);
    setEditingId(id);
    setEditText(displayText);
  };

  // 保存编辑
  const saveEdit = async () => {
    if (!editingId || !editText.trim()) {
      setEditingId(null);
      setEditText('');
      return;
    }

    const todo = todos.find(t => t.id === editingId);
    if (!todo) return;

    const { isPriority } = parseTodo(todo.text);
    const newText = isPriority ? `${PRIORITY_PREFIX} ${editText.trim()}` : editText.trim();

    const updatedTodo = await updateTodoInDB(editingId, { text: newText });
    if (updatedTodo) {
      updateTodoInStore(updatedTodo);
    }
    setEditingId(null);
    setEditText('');
  };

  // 删除待办（带确认）
  const handleDeleteTodo = async (id: string) => {
    if (deleteConfirmId === id) {
      const deleted = await deleteTodoInDB(id);
      if (deleted) {
        removeTodoFromStore(id);
      }
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(prev => prev === id ? null : prev), 3000);
    }
  };

  // 一键清除已完成
  const clearCompleted = async () => {
    if (completedTodos.length === 0) return;
    if (!confirm(`确定要清除 ${completedTodos.length} 条已完成的待办吗？`)) return;

    for (const todo of completedTodos) {
      const deleted = await deleteTodoInDB(todo.id);
      if (deleted) {
        removeTodoFromStore(todo.id);
      }
    }
  };

  // 拖拽处理
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const currentOrder = pendingTodos.map(t => t.id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newOrder = [...currentOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedId);
      setLocalOrder(newOrder);
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 渲染待办项
  const renderTodoItem = (todo: typeof todos[0], isDraggable: boolean = false) => {
    const { isPriority, displayText } = parseTodo(todo.text);
    const isEditing = editingId === todo.id;

    return (
      <div
        key={todo.id}
        className={`floating-todo-item ${todo.done ? 'done' : ''} ${deleteConfirmId === todo.id ? 'delete-confirm' : ''} ${isPriority ? 'priority' : ''} ${draggedId === todo.id ? 'dragging' : ''} ${dragOverId === todo.id ? 'drag-over' : ''}`}
        draggable={isDraggable && !isEditing && !todo.done}
        onDragStart={(e) => handleDragStart(e, todo.id)}
        onDragOver={(e) => handleDragOver(e, todo.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, todo.id)}
        onDragEnd={handleDragEnd}
      >
        {/* 拖拽手柄 */}
        {isDraggable && !todo.done && (
          <span className="drag-handle" title="拖拽排序">⋮⋮</span>
        )}

        <button
          className="floating-checkbox"
          onClick={() => toggleTodo(todo.id)}
        >
          {todo.done ? '✓' : ''}
        </button>

        <div className="floating-todo-content">
          {isEditing ? (
            <input
              ref={editInputRef}
              className="edit-input"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') {
                  setEditingId(null);
                  setEditText('');
                }
              }}
              onBlur={saveEdit}
            />
          ) : (
            <span
              className="floating-todo-text"
              onDoubleClick={() => !todo.done && startEdit(todo.id, todo.text)}
              title="双击编辑"
            >
              {displayText}
            </span>
          )}
          <div className="floating-todo-meta">
            <span className="floating-todo-date">{formatDate(todo.created_at)}</span>
          </div>
        </div>

        {/* 优先级按钮 */}
        {!todo.done && !isEditing && (
          <button
            className={`priority-btn ${isPriority ? 'active' : ''}`}
            onClick={() => togglePriority(todo.id)}
            title={isPriority ? '取消重要' : '标记重要'}
          >
            ⭐
          </button>
        )}

        <button
          className={`floating-delete ${deleteConfirmId === todo.id ? 'confirm' : ''}`}
          onClick={() => handleDeleteTodo(todo.id)}
          title={deleteConfirmId === todo.id ? '再次点击确认删除' : '删除'}
        >
          {deleteConfirmId === todo.id ? '确认?' : '×'}
        </button>
      </div>
    );
  };

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
            <span className="floating-todo-badge">
              {todoStats.pending}
            </span>
          )}
        </button>
        <span className="floating-todo-title">待办事项</span>
      </div>

      {/* 待办窗口遮罩 */}
      {isOpen && (
        <div className="floating-todo-overlay" onClick={() => { setIsOpen(false); setDeleteConfirmId(null); setEditingId(null); }}>
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
              <button className="floating-close-btn" onClick={() => { setIsOpen(false); setDeleteConfirmId(null); setEditingId(null); }}>
                ×
              </button>
            </div>

            {/* 待办输入 */}
            <form className="floating-todo-input" onSubmit={handleSubmitNewTodo}>
              <input
                ref={inputRef}
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder="添加新待办..."
              />
              <button type="submit" disabled={!newTodoText.trim() || isAddingTodo}>
                添加
              </button>
            </form>

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
                      {pendingTodos.map(todo => renderTodoItem(todo, true))}
                    </>
                  )}

                  {/* 已完成 */}
                  {completedTodos.length > 0 && (
                    <>
                      <div className="floating-todo-section-title completed">
                        <span>已完成</span>
                        <span className="section-count">{completedTodos.length}</span>
                      </div>
                      {completedTodos.map(todo => renderTodoItem(todo, false))}
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
