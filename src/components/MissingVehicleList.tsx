import { useAppStore } from '../stores/appStore';
import './MissingVehicleList.css';

export function MissingVehicleList() {
  const { diaries, showOnlyMissingVehicle, toggleMissingVehicleFilter, openModal } = useAppStore();

  // 筛选未填车号的记录
  const missingVehicleDiaries = diaries
    .filter(d => !d.vehicle)
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

  if (!showOnlyMissingVehicle) return null;

  return (
    <div className="missing-vehicle-overlay" onClick={toggleMissingVehicleFilter}>
      <div className="missing-vehicle-panel" onClick={(e) => e.stopPropagation()}>
        <div className="missing-vehicle-header">
          <h3>🚗 未填车号记录 ({missingVehicleDiaries.length})</h3>
          <button className="close-btn" onClick={toggleMissingVehicleFilter}>×</button>
        </div>

        <div className="missing-vehicle-content">
          {missingVehicleDiaries.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">✅</span>
              <p>所有记录都已填写车号</p>
            </div>
          ) : (
            <table className="missing-vehicle-table">
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
                {missingVehicleDiaries.map((diary) => (
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
          )}
        </div>
      </div>
    </div>
  );
}
