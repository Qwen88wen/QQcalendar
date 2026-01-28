import { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import './RecordList.css';

type StatusFilter = 'all' | 'incomplete' | 'complete';

export function RecordList() {
  const { diaries, showRecordList, toggleRecordList, setFocusedFlower, openModal } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // 统计数量
  const totalCount = diaries.length;
  const incompleteCount = diaries.filter(d => d.status === 'incomplete').length;
  const completeCount = diaries.filter(d => d.status === 'complete').length;

  // 按筛选条件过滤并按时间倒序排列
  const filteredDiaries = diaries
    .filter(d => statusFilter === 'all' || d.status === statusFilter)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const getFlowerIcon = (diary: any) => {
    const userName = diary.user_name?.toLowerCase() || '';
    if (userName.includes('qqrou') || diary.flower_type === 3) return '💐';
    if (userName.includes('qqfang') || diary.flower_type === 1) return '🌹';
    return '🌸';
  };

  const handleRecordClick = (diary: any) => {
    setFocusedFlower(diary.id);
    openModal(diary);
  };

  if (!showRecordList) return null;

  return (
    <div className="record-list-overlay" onClick={toggleRecordList}>
      <div className="record-list" onClick={(e) => e.stopPropagation()}>
        <div className="record-header">
          <h3>记录列表</h3>
          <button className="close-btn" onClick={toggleRecordList}>×</button>
        </div>

        {/* 筛选按钮 */}
        <div className="record-filters">
          <button
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            全部 ({totalCount})
          </button>
          <button
            className={`filter-btn incomplete ${statusFilter === 'incomplete' ? 'active' : ''}`}
            onClick={() => setStatusFilter('incomplete')}
          >
            未完成 ({incompleteCount})
          </button>
          <button
            className={`filter-btn complete ${statusFilter === 'complete' ? 'active' : ''}`}
            onClick={() => setStatusFilter('complete')}
          >
            已完成 ({completeCount})
          </button>
        </div>

        <div className="record-items">
          {filteredDiaries.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🌱</span>
              <p>还没有记录</p>
              <p className="empty-hint">种下第一朵花吧</p>
            </div>
          ) : (
            filteredDiaries.map((diary) => (
              <div
                key={diary.id}
                className="record-item"
                onClick={() => handleRecordClick(diary)}
              >
                <span className="record-icon">{getFlowerIcon(diary)}</span>
                <div className="record-content">
                  <div className="record-user">{diary.customer || diary.user_name || '匿名'}</div>
                  <div className={`record-status ${diary.status}`}>
                    {diary.status === 'complete' ? '已完成' : '未完成'}
                  </div>
                </div>
                <div className="record-time">{formatTime(diary.created_at)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
