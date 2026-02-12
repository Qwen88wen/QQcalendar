import { useState, useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { calculateSalary, exportSalaryCSV } from '../lib/salary';
import type { SalarySummary } from '../types/database';
import './SalaryReport.css';

export function SalaryReport() {
  const { diaries, showSalaryReport, toggleSalaryReport, workers } = useAppStore();

  // 默认日期范围：当前月份
  const now = new Date();
  const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [expandedWorker, setExpandedWorker] = useState<string | null>(null);

  // 计算薪资
  const summaries: SalarySummary[] = useMemo(() => {
    if (!startDate || !endDate) return [];
    return calculateSalary(
      diaries,
      new Date(startDate),
      new Date(endDate),
      selectedWorker || undefined
    );
  }, [diaries, startDate, endDate, selectedWorker]);

  // 总计
  const grandTotal = useMemo(
    () => Math.round(summaries.reduce((sum, s) => sum + s.total, 0) * 100) / 100,
    [summaries]
  );

  // 活跃工人列表
  const activeWorkers = useMemo(
    () => workers.filter(w => w.is_active).sort((a, b) => a.name.localeCompare(b.name)),
    [workers]
  );

  // 快捷选择月份
  const setMonth = (offset: number) => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const last = new Date(y, d.getMonth() + 1, 0).getDate();
    setStartDate(`${y}-${m}-01`);
    setEndDate(`${y}-${m}-${String(last).padStart(2, '0')}`);
  };

  const handleExportCSV = () => {
    if (summaries.length === 0) {
      alert('没有数据可导出');
      return;
    }
    exportSalaryCSV(summaries, new Date(startDate), new Date(endDate));
  };

  const toggleWorkerExpand = (workerName: string) => {
    setExpandedWorker(expandedWorker === workerName ? null : workerName);
  };

  if (!showSalaryReport) return null;

  return (
    <div className="salary-overlay" onClick={toggleSalaryReport}>
      <div className="salary-panel" onClick={(e) => e.stopPropagation()}>
        {/* 标题 */}
        <div className="salary-header">
          <h3>薪资报表</h3>
          <button className="salary-close-btn" onClick={toggleSalaryReport}>×</button>
        </div>

        {/* 筛选区 */}
        <div className="salary-filters">
          <div className="salary-date-row">
            <div className="salary-date-group">
              <label>开始</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <span className="salary-date-sep">~</span>
            <div className="salary-date-group">
              <label>结束</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="salary-quick-months">
            <button onClick={() => setMonth(-1)}>上月</button>
            <button onClick={() => setMonth(0)}>本月</button>
          </div>

          <div className="salary-worker-filter">
            <label>工人</label>
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
            >
              <option value="">全部工人</option>
              {activeWorkers.map(w => (
                <option key={w.id} value={w.name}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 汇总 */}
        <div className="salary-summary-bar">
          <span>共 {summaries.length} 位工人</span>
          <span className="salary-grand-total">总计: RM {grandTotal.toFixed(2)}</span>
        </div>

        {/* 报表内容 */}
        <div className="salary-content">
          {summaries.length === 0 ? (
            <div className="salary-empty">
              <span>📊</span>
              <p>暂无薪资数据</p>
              <p className="salary-empty-hint">请选择日期范围查看</p>
            </div>
          ) : (
            summaries.map((s) => (
              <div key={s.workerName} className="salary-worker-card">
                <div
                  className="salary-worker-header"
                  onClick={() => toggleWorkerExpand(s.workerName)}
                >
                  <div className="salary-worker-info">
                    <span className="salary-worker-name">{s.workerName}</span>
                    <span className="salary-worker-count">{s.details.length} 条记录</span>
                  </div>
                  <div className="salary-worker-total">
                    RM {s.total.toFixed(2)}
                    <span className={`salary-expand-icon ${expandedWorker === s.workerName ? 'expanded' : ''}`}>
                      ▸
                    </span>
                  </div>
                </div>

                {expandedWorker === s.workerName && (
                  <div className="salary-details">
                    <table className="salary-table">
                      <thead>
                        <tr>
                          <th>日期</th>
                          <th>园主</th>
                          <th>类型</th>
                          <th>数量</th>
                          <th>单价</th>
                          <th>小计</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.details.map((d, i) => (
                          <tr key={i}>
                            <td>{d.date}</td>
                            <td>{d.customer}</td>
                            <td>{d.workType}</td>
                            <td>{d.quantity} {d.unit}</td>
                            <td>{d.unitPrice}</td>
                            <td className="salary-subtotal">{d.subtotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 底部操作 */}
        <div className="salary-footer">
          <button className="salary-export-btn" onClick={handleExportCSV}>
            导出 CSV
          </button>
        </div>
      </div>
    </div>
  );
}
