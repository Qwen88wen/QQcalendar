import { useState } from 'react';
import { useAppStore, FlowerFilter } from '../stores/appStore';
import { exportAllData } from '../lib/export';
import './TitleBar.css';

export function TitleBar() {
  const { diaries, flowerFilter, setFlowerFilter, toggleRecordList, showRecordList } = useAppStore();
  const [isExporting, setIsExporting] = useState(false);

  // 统计花朵数量 (基于 user_name 判断)
  const lavenderCount = diaries.filter(d =>
    d.user_name?.toLowerCase().includes('qqrou') ||
    d.user_id?.toLowerCase().includes('qqrou') ||
    d.flower_type === 3
  ).length;

  const roseCount = diaries.filter(d =>
    d.user_name?.toLowerCase().includes('qqfang') ||
    d.user_id?.toLowerCase().includes('qqfang') ||
    d.flower_type === 1
  ).length;

  const handleFilterClick = (filter: FlowerFilter) => {
    if (flowerFilter === filter) {
      setFlowerFilter('all');
    } else {
      setFlowerFilter(filter);
    }
  };

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

  return (
    <div className="title-bar">
      <div className="title-main">
        <h1>QQcalendar</h1>
      </div>

      <div className="flower-stats">
        <button
          className={`stat-btn lavender ${flowerFilter === 3 ? 'active' : ''}`}
          onClick={() => handleFilterClick(3)}
        >
          <span className="icon">🪻</span>
          <span className="count">{lavenderCount}</span>
        </button>
        <span className="divider">|</span>
        <button
          className={`stat-btn rose ${flowerFilter === 1 ? 'active' : ''}`}
          onClick={() => handleFilterClick(1)}
        >
          <span className="icon">🌹</span>
          <span className="count">{roseCount}</span>
        </button>
      </div>

      <button
        className={`record-toggle ${showRecordList ? 'active' : ''}`}
        onClick={toggleRecordList}
      >
        📋
      </button>

      <button
        className={`export-btn ${isExporting ? 'exporting' : ''}`}
        onClick={handleExport}
        disabled={isExporting}
        title="导出数据备份"
      >
        {isExporting ? '⏳' : '💾'}
      </button>
    </div>
  );
}
