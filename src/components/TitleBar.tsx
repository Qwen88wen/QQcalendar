import { useAppStore, FlowerFilter } from '../stores/appStore';
import './TitleBar.css';

export function TitleBar() {
  const { diaries, flowerFilter, setFlowerFilter, toggleRecordList, showRecordList } = useAppStore();

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

  return (
    <div className="title-bar">
      <div className="title-main">
        <h1>QQrou <span className="flower-icon lavender">🪻</span> & QQfang <span className="flower-icon rose">🌹</span> 的花园</h1>
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
    </div>
  );
}
