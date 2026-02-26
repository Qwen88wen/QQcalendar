import { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { exportAllData } from '../lib/export';
import { getDiaries } from '../lib/diary';
import './TitleBar.css';

export function TitleBar() {
  const {
    diaries,
    toggleRecordList,
    showRecordList,
    showOnlyMissingVehicle,
    toggleMissingVehicleFilter,
    showOnlyUnnotified,
    toggleUnnotifiedFilter,
    showSalaryReport,
    toggleSalaryReport,
    setDiaries,
    userName,
    logoutUser,
  } = useAppStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 手动刷新数据
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const freshDiaries = await getDiaries();
      setDiaries(freshDiaries);
      console.log('[刷新] 成功获取', freshDiaries.length, '条记录');
    } catch (error) {
      console.error('[刷新] 失败:', error);
      alert('刷新失败，请检查网络连接');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 统计未填车号的记录数（排除已免打扰的记录）
  const missingVehicleCount = diaries.filter(d => !d.vehicle && !d.vehicle_dismissed).length;

  // 统计未通知的记录数
  const unnotifiedCount = diaries.filter(d => !d.notified).length;

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportAllData();
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  // 登出
  const handleLogout = () => {
    if (confirm('确定要登出吗？')) {
      logoutUser();
    }
  };

  return (
    <div className="title-bar">
      <div className="title-main">
        <h1>QQcalendar</h1>
        {userName && <span className="current-user">👤 {userName}</span>}
      </div>

      {/* 未填车号提醒按钮 */}
      {missingVehicleCount > 0 && (
        <div className="warning-btn-group">
          <button
            className={`missing-vehicle-btn ${showOnlyMissingVehicle ? 'active' : ''}`}
            onClick={toggleMissingVehicleFilter}
            title={`${missingVehicleCount} 条记录未填车号`}
          >
            <span className="warning-icon">🚗</span>
            <span className="warning-count">{missingVehicleCount}</span>
          </button>
          {showOnlyMissingVehicle && (
            <button
              className="dismiss-warning-btn"
              onClick={(e) => { e.stopPropagation(); toggleMissingVehicleFilter(); }}
              title="关闭提醒"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* 未通知提醒按钮 */}
      {unnotifiedCount > 0 && (
        <div className="warning-btn-group">
          <button
            className={`unnotified-btn ${showOnlyUnnotified ? 'active' : ''}`}
            onClick={toggleUnnotifiedFilter}
            title={`${unnotifiedCount} 条记录未通知园主`}
          >
            <span className="warning-icon">📞</span>
            <span className="warning-count">{unnotifiedCount}</span>
          </button>
          {showOnlyUnnotified && (
            <button
              className="dismiss-warning-btn"
              onClick={(e) => { e.stopPropagation(); toggleUnnotifiedFilter(); }}
              title="关闭提醒"
            >
              ×
            </button>
          )}
        </div>
      )}

      <button
        className={`salary-toggle ${showSalaryReport ? 'active' : ''}`}
        onClick={toggleSalaryReport}
        title="薪资报表"
      >
        💰
      </button>

      <button
        className={`record-toggle ${showRecordList ? 'active' : ''}`}
        onClick={toggleRecordList}
      >
        📋
      </button>

      <button
        className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
        onClick={handleRefresh}
        disabled={isRefreshing}
        title="刷新数据 (从其他设备同步)"
      >
        {isRefreshing ? '⏳' : '🔄'}
      </button>

      <button
        className={`export-btn ${isExporting ? 'exporting' : ''}`}
        onClick={handleExport}
        disabled={isExporting}
        title="导出数据备份"
      >
        {isExporting ? '⏳' : '💾'}
      </button>

      <button
        className="logout-btn"
        onClick={handleLogout}
        title="登出"
      >
        🚪
      </button>
    </div>
  );
}
