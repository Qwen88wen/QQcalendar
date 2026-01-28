import { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { supabase } from '../lib/supabase';
import './MissingVehicleList.css';

export function MissingVehicleList() {
  const { diaries, showOnlyMissingVehicle, toggleMissingVehicleFilter, openModal, batchUpdateDiaries } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // 筛选未填车号且未忽略的记录
  const missingVehicleDiaries = diaries
    .filter(d => !d.vehicle && !d.vehicle_dismissed)
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

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedIds.length === missingVehicleDiaries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(missingVehicleDiaries.map(d => d.id));
    }
  };

  // 单个选择
  const handleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // 批量标记为免打扰
  const handleBatchDismiss = async () => {
    if (selectedIds.length === 0) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('diaries')
        .update({ vehicle_dismissed: true } as never)
        .in('id', selectedIds);

      if (error) throw error;

      // 更新本地状态
      batchUpdateDiaries(selectedIds, { vehicle_dismissed: true });
      setSelectedIds([]);
    } catch (err) {
      console.error('批量更新失败:', err);
      alert('批量更新失败');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!showOnlyMissingVehicle) return null;

  const isAllSelected = missingVehicleDiaries.length > 0 && selectedIds.length === missingVehicleDiaries.length;

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
            <>
              <table className="missing-vehicle-table">
                <thead>
                  <tr>
                    <th className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        title="全选"
                      />
                    </th>
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
                      className={`clickable-row ${selectedIds.includes(diary.id) ? 'selected' : ''}`}
                    >
                      <td className="checkbox-cell" onClick={(e) => handleSelectOne(diary.id, e)}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(diary.id)}
                          onChange={() => {}}
                        />
                      </td>
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
              <div className="missing-vehicle-footer">
                {selectedIds.length > 0 && (
                  <button
                    className="batch-btn"
                    onClick={handleBatchDismiss}
                    disabled={isUpdating}
                  >
                    {isUpdating ? '更新中...' : `🔕 批量标记免打扰 (${selectedIds.length})`}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
