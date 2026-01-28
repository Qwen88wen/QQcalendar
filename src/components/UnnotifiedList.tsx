import { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { supabase } from '../lib/supabase';
import './UnnotifiedList.css';

export function UnnotifiedList() {
  const { diaries, showOnlyUnnotified, toggleUnnotifiedFilter, openModal, batchUpdateDiaries } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

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

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedIds.length === unnotifiedDiaries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unnotifiedDiaries.map(d => d.id));
    }
  };

  // 单个选择
  const handleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // 批量标记为已通知
  const handleBatchMarkNotified = async () => {
    if (selectedIds.length === 0) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('diaries')
        .update({ notified: true } as never)
        .in('id', selectedIds);

      if (error) throw error;

      // 更新本地状态
      batchUpdateDiaries(selectedIds, { notified: true });
      setSelectedIds([]);
    } catch (err) {
      console.error('批量更新失败:', err);
      alert('批量更新失败');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!showOnlyUnnotified) return null;

  const isAllSelected = unnotifiedDiaries.length > 0 && selectedIds.length === unnotifiedDiaries.length;

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
                  {unnotifiedDiaries.map((diary) => (
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
              <div className="unnotified-footer">
                {selectedIds.length > 0 && (
                  <button
                    className="batch-btn"
                    onClick={handleBatchMarkNotified}
                    disabled={isUpdating}
                  >
                    {isUpdating ? '更新中...' : `✅ 批量标记已通知 (${selectedIds.length})`}
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
