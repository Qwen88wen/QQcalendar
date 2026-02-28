import { useState, useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { deleteDiary } from '../lib/diary';
import './Memo.css';

export function Memo() {
  const { diaries, openModal, selectedDate, removeDiary, customers } = useAppStore();

  // 创建顾客名称到Code的映射
  const customerCodeMap = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach(c => {
      if (c.code) {
        map.set(c.name, c.code);
      }
    });
    return map;
  }, [customers]);

  // 获取顾客Code
  const getCustomerCode = (customerName: string | null) => {
    if (!customerName) return null;
    return customerCodeMap.get(customerName) || null;
  };

  const [filter, setFilter] = useState<'all' | 'incomplete' | 'complete'>('all');

  // 选择模式状态
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // 获取当前查看的日期（选中日期或今天）
  const viewDate = selectedDate || new Date();

  // 格式化显示日期
  const formatViewDate = () => {
    const today = new Date();
    if (viewDate.toDateString() === today.toDateString()) {
      return '今天';
    }
    return `${viewDate.getMonth() + 1}月${viewDate.getDate()}日`;
  };

  // 按选中日期筛选记录
  const dateFilteredDiaries = useMemo(() => {
    const viewDateStr = viewDate.toDateString();
    return diaries.filter(d => new Date(d.created_at).toDateString() === viewDateStr);
  }, [diaries, viewDate]);

  // 按状态筛选并排序（最新的在前）
  const filteredDiaries = useMemo(() => {
    let filtered = [...dateFilteredDiaries];
    if (filter === 'incomplete') {
      filtered = filtered.filter(d => d.status === 'incomplete');
    } else if (filter === 'complete') {
      filtered = filtered.filter(d => d.status === 'complete');
    }
    return filtered.sort((a, b) => {
      const codeA = (getCustomerCode(a.customer) || '').trim();
      const codeB = (getCustomerCode(b.customer) || '').trim();
      if (!codeA && codeB) return 1;
      if (codeA && !codeB) return -1;

      const codeCompare = codeA.localeCompare(codeB, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      if (codeCompare !== 0) return codeCompare;

      const customerA = (a.customer || '').toLowerCase();
      const customerB = (b.customer || '').toLowerCase();
      if (customerA < customerB) return -1;
      if (customerA > customerB) return 1;
      return 0;
    });
  }, [dateFilteredDiaries, filter]);

  // 统计数据（基于选中日期）
  const stats = useMemo(() => {
    const total = dateFilteredDiaries.length;
    const complete = dateFilteredDiaries.filter(d => d.status === 'complete').length;
    const incomplete = dateFilteredDiaries.filter(d => d.status === 'incomplete').length;
    return { total, complete, incomplete };
  }, [dateFilteredDiaries]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const normalizeLegacyUnit = (value: string | null | undefined) => {
    if (!value) return null;
    const normalized = value.trim().toUpperCase();
    const validUnits = ['TON', 'POKOK', 'EKAR', 'JOB', 'BAG', 'DAY', 'HALF DAY'];
    return validUnits.includes(normalized) ? normalized : null;
  };

  const getDisplayUnit = (diary: { unit: string | null; remark: string | null }) => {
    return diary.unit || normalizeLegacyUnit(diary.remark);
  };

  // 切换选择
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDiaries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDiaries.map(d => d.id)));
    }
  };

  // 退出选择模式
  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  // 删除单条记录
  const handleDeleteSingle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这条记录吗？')) return;

    setIsDeleting(true);
    const success = await deleteDiary(id);
    if (success) {
      removeDiary(id);
    } else {
      alert('删除失败，请重试');
    }
    setIsDeleting(false);
  };

  // 批量删除
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？`)) return;

    setIsDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      const success = await deleteDiary(id);
      if (success) {
        removeDiary(id);
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsDeleting(false);
    setSelectedIds(new Set());

    if (failCount > 0) {
      alert(`删除完成: 成功 ${successCount} 条, 失败 ${failCount} 条`);
    }

    if (successCount > 0 && selectedIds.size === successCount) {
      exitSelectMode();
    }
  };

  return (
    <div className="memo">
      {/* 日期标题 */}
      <div className="memo-date-header">
        <span className="date-label">{formatViewDate()}</span>
        <span className="date-hint">的记录</span>
      </div>

      {/* 筛选器和操作栏 */}
      <div className="memo-filter">
        {isSelectMode ? (
          <>
            <button
              className="filter-btn select-all"
              onClick={toggleSelectAll}
            >
              {selectedIds.size === filteredDiaries.length ? '取消全选' : '全选'}
            </button>
            <span className="selected-count">
              已选 {selectedIds.size} 项
            </span>
            <button
              className="filter-btn delete-btn"
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0 || isDeleting}
            >
              {isDeleting ? '删除中...' : '🗑️ 删除'}
            </button>
            <button
              className="filter-btn cancel-btn"
              onClick={exitSelectMode}
            >
              取消
            </button>
          </>
        ) : (
          <>
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              全部 ({stats.total})
            </button>
            <button
              className={`filter-btn ${filter === 'incomplete' ? 'active' : ''}`}
              onClick={() => setFilter('incomplete')}
            >
              未完成 ({stats.incomplete})
            </button>
            <button
              className={`filter-btn ${filter === 'complete' ? 'active' : ''}`}
              onClick={() => setFilter('complete')}
            >
              已完成 ({stats.complete})
            </button>
            {filteredDiaries.length > 0 && (
              <button
                className="filter-btn select-mode-btn"
                onClick={() => setIsSelectMode(true)}
              >
                选择
              </button>
            )}
          </>
        )}
      </div>

      {/* 记录列表 */}
      <div className="memo-list">
        {filteredDiaries.length === 0 ? (
          <div className="memo-empty">
            <span className="empty-icon">🌱</span>
            <p>暂无记录</p>
          </div>
        ) : (
          filteredDiaries.map(diary => {
            const needsVehicle = !diary.vehicle;
            const isIncomplete = diary.status === 'incomplete';
            const isUnnotified = !diary.notified;
            const hasWarning = needsVehicle || isIncomplete || isUnnotified;
            const isSelected = selectedIds.has(diary.id);

            return (
              <div
                key={diary.id}
                className={`memo-item ${diary.status} ${hasWarning ? 'has-warning' : ''} ${isSelectMode && isSelected ? 'selected' : ''}`}
                onClick={() => isSelectMode ? toggleSelect(diary.id) : openModal(diary)}
              >
                <div className="memo-item-header">
                  {isSelectMode && (
                    <button
                      className={`memo-checkbox ${isSelected ? 'checked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(diary.id);
                      }}
                    >
                      {isSelected ? '✓' : ''}
                    </button>
                  )}
                  {getCustomerCode(diary.customer) && (
                    <span className="memo-code">
                      {getCustomerCode(diary.customer)}
                    </span>
                  )}
                  <span className="memo-customer">
                    {diary.customer || diary.user_name || '未命名'}
                  </span>
                  <span className={`memo-status ${diary.status}`}>
                    {diary.status === 'complete' ? '✓' : '○'}
                  </span>
                  {!isSelectMode && (
                    <button
                      className="memo-delete-btn"
                      onClick={(e) => handleDeleteSingle(diary.id, e)}
                      disabled={isDeleting}
                      title="删除记录"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* 警告标签 */}
                {hasWarning && (
                  <div className="memo-warnings">
                    {isUnnotified && (
                      <span className="warning-tag unnotified">
                        📞 未通知
                      </span>
                    )}
                    {needsVehicle && (
                      <span className="warning-tag vehicle">
                        🚗 未填车号
                      </span>
                    )}
                    {isIncomplete && (
                      <span className="warning-tag status">
                        ⏳ 未完成割果
                      </span>
                    )}
                  </div>
                )}

                <div className="memo-item-details">
                  {diary.weight && (
                    <span className="detail">⚖️ {diary.weight} {getDisplayUnit(diary) || ''}</span>
                  )}
                  {diary.worker && <span className="detail">👷 {diary.worker}</span>}
                  {diary.vehicle && <span className="detail">🚗 {diary.vehicle}</span>}
                </div>
                {diary.remark && (
                  <div className="memo-item-remark">{diary.remark}</div>
                )}
                <div className="memo-item-time">{formatDate(diary.created_at)}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
