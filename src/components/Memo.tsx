import { useState, useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import './Memo.css';

const FLOWER_ICONS: Record<number, string> = {
  1: '🌹',
  2: '🌷',
  3: '🪻',
  4: '🌸',
  5: '🌻',
};

export function Memo() {
  const { diaries, openModal } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'complete'>('all');

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="memo">
      <h2 className="memo-title">📋 备忘录</h2>

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
    </div>
  );
}
