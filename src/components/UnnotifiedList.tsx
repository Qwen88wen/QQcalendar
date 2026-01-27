import { useAppStore } from '../stores/appStore';
import './UnnotifiedList.css';

export function UnnotifiedList() {
  const { diaries, showOnlyUnnotified, toggleUnnotifiedFilter, openModal } = useAppStore();

  // 筛选未通知的记录
  const unnotifiedDiaries = diaries
    .filter(d => !d.notified)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getFlowerIcon = (diary: any) => {
    const userName = diary.user_name?.toLowerCase() || '';
    if (userName.includes('qqrou') || diary.flower_type === 3) return '💐';
    if (userName.includes('qqfang') || diary.flower_type === 1) return '🌹';
    return '🌸';
  };

  const handleRowClick = (diary: any) => {
    openModal(diary);
  };

  // 清空提醒（关闭面板）
  const handleDismiss = () => {
    toggleUnnotifiedFilter();
  };

  if (!showOnlyUnnotified) return null;

  return (
    <div className="unnotified-overlay" onClick={toggleUnnotifiedFilter}>
      <div className="unnotified-panel" onClick={(e) => e.stopPropagation()}>
        <div className="unnotified-header">
          <h3>📞 未通知园主记录 ({unnotifiedDiaries.length})</h3>
          <button className="close-btn" onClick={toggleUnnotifiedFilter}>×</button>
        </div>

        <div className="unnotified-content">
          {unnotifiedDiaries.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">✅</span>
              <p>所有记录都已通知园主</p>
            </div>
          ) : (
            <>
              <table className="unnotified-table">
                <thead>
                  <tr>
                    <th>花朵</th>
                    <th>园主</th>
                    <th>工人</th>
                    <th>备注</th>
                    <th>状态</th>
                    <th>时间</th>
                  </tr>
                </thead>
                <tbody>
                  {unnotifiedDiaries.map((diary) => (
                    <tr
                      key={diary.id}
                      onClick={() => handleRowClick(diary)}
                      className="clickable-row"
                    >
                      <td className="flower-cell">{getFlowerIcon(diary)}</td>
                      <td>{diary.customer || '-'}</td>
                      <td>{diary.worker || '-'}</td>
                      <td className="remark-cell">{diary.remark || '-'}</td>
                      <td>
                        <span className={`status-badge ${diary.status}`}>
                          {diary.status === 'complete' ? '完成' : '未完成'}
                        </span>
                      </td>
                      <td className="time-cell">{formatDate(diary.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="unnotified-footer">
                <button className="dismiss-btn" onClick={handleDismiss}>
                  🔕 清空提醒
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
