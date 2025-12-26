import { useAppStore } from '../stores/appStore';
import './RecordList.css';

export function RecordList() {
  const { diaries, showRecordList, toggleRecordList, setFocusedFlower, openModal } = useAppStore();

  // 按时间倒序排列
  const sortedDiaries = [...diaries].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

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
    if (userName.includes('qqrou') || diary.flower_type === 3) return '🪻';
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

        <div className="record-items">
          {sortedDiaries.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🌱</span>
              <p>还没有记录</p>
              <p className="empty-hint">种下第一朵花吧</p>
            </div>
          ) : (
            sortedDiaries.map((diary) => (
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
