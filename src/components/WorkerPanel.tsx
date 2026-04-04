import { useMemo, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { buildWorkerPanelData, filterWorkerPanelItems, type WorkerPanelStatus } from '../lib/workerPanel';
import { upsertWorkerDailyStatus } from '../lib/workerDailyStatus';
import './WorkerPanel.css';

type StatusFilter = 'ALL' | WorkerPanelStatus;

const STATUS_LABEL: Record<WorkerPanelStatus, string> = {
  WORKING: '上班',
  REST: '休息',
};

function formatDateLabel(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function WorkerPanel() {
  const { diaries, workers, customers, workerDailyStatuses, selectedDate, upsertWorkerDailyStatus: upsertStatusInStore } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMenuWorkerId, setStatusMenuWorkerId] = useState<string | null>(null);
  const [updatingWorkerId, setUpdatingWorkerId] = useState<string | null>(null);

  const activeDate = selectedDate || new Date();

  const panelData = useMemo(
    () => buildWorkerPanelData({
      selectedDate: activeDate,
      diaries,
      workers,
      customers,
      workerDailyStatuses,
    }),
    [activeDate, diaries, workers, customers, workerDailyStatuses]
  );

  const visibleItems = useMemo(
    () => filterWorkerPanelItems(panelData.workerItems, panelData.customerById, searchQuery, statusFilter),
    [panelData.workerItems, panelData.customerById, searchQuery, statusFilter]
  );

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleStatusSelect = async (workerId: string, nextStatus: WorkerPanelStatus, customerCount: number) => {
    if (nextStatus === 'REST' && customerCount > 0) {
      const confirmed = window.confirm(`该工人已有 ${customerCount} 个顾客安排，确定仍设置为休息吗？`);
      if (!confirmed) return;
    }

    setUpdatingWorkerId(workerId);
    try {
      const updated = await upsertWorkerDailyStatus({
        date: formatDateKey(activeDate),
        worker_id: workerId,
        status: nextStatus,
      });

      if (!updated) {
        alert('更新状态失败，请稍后重试');
      } else {
        upsertStatusInStore(updated);
      }
    } finally {
      setUpdatingWorkerId(null);
      setStatusMenuWorkerId(null);
    }
  };

  return (
    <>
      <button
        className={`worker-panel-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        title={isOpen ? '收起工人管理栏' : '展开工人管理栏'}
      >
        👷 工人管理
      </button>

      <aside className={`worker-panel-drawer ${isOpen ? 'open' : ''}`}>
        <div className="worker-panel-header">
          <div>
            <h3>👷 工人管理</h3>
            <p>{formatDateLabel(activeDate)}</p>
          </div>
          <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
        </div>

        <div className="worker-panel-search">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索工人/顾客 名称或编号"
          />
        </div>

        <div className="worker-panel-filters">
          {[
            ['ALL', '全部'],
            ['WORKING', '上班'],
            ['REST', '休息'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={statusFilter === value ? 'active' : ''}
              onClick={() => setStatusFilter(value as StatusFilter)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="worker-panel-stats">
          <span>工人 {panelData.stats.totalWorkers}</span>
          <span>上班 {panelData.stats.workingWorkers}</span>
          <span>休息 {panelData.stats.restWorkers}</span>
          <span>顾客 {panelData.stats.totalCustomers}</span>
        </div>

        <div className="worker-panel-list">
          {visibleItems.length === 0 ? (
            <div className="empty">暂无符合条件的工人</div>
          ) : (
            visibleItems.map((item) => {
              const showCustomers = item.customers.slice(0, 3);
              const extra = item.customers.length - showCustomers.length;

              return (
                <article className="worker-card" key={item.workerId}>
                  <div className="worker-card-head">
                    <strong>{item.workerCode || item.workerId} {item.workerName}</strong>
                    <div className="status-dropdown">
                      <button
                        className={`status-btn ${item.status.toLowerCase()}`}
                        onClick={() => setStatusMenuWorkerId(prev => prev === item.workerId ? null : item.workerId)}
                        disabled={updatingWorkerId === item.workerId}
                      >
                        {STATUS_LABEL[item.status]} ▼
                      </button>
                      {statusMenuWorkerId === item.workerId && (
                        <div className="status-menu">
                          <button onClick={() => handleStatusSelect(item.workerId, 'WORKING', item.customers.length)}>上班（WORKING）</button>
                          <button onClick={() => handleStatusSelect(item.workerId, 'REST', item.customers.length)}>休息（REST）</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {item.status === 'REST' ? (
                    <div className="worker-card-body">
                      <p>今日无顾客安排</p>
                      {item.restNote && <p>备注：{item.restNote}</p>}
                      {item.restConflictCustomerCount > 0 && (
                        <p className="warning">⚠ 原本有 {item.restConflictCustomerCount} 个顾客安排</p>
                      )}
                    </div>
                  ) : item.customers.length > 0 ? (
                    <div className="worker-card-body">
                      <p>顾客：</p>
                      <ul>
                        {showCustomers.map((ref) => {
                          const customer = panelData.customerById.get(ref.customerId);
                          if (!customer) return null;
                          return <li key={`${item.workerId}-${ref.diaryId}-${customer.id}`}>{customer.code || customer.id} {customer.name}</li>;
                        })}
                      </ul>
                      {extra > 0 && <p className="more">+{extra} 更多</p>}
                    </div>
                  ) : <div className="worker-card-body"><p>今日未分配顾客</p></div>}
                </article>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
