import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { calculateSalary, exportSalaryCSV } from '../lib/salary';
import type { SalarySummary, SalaryGroup, SalaryWarning } from '../types/database';
import './SalaryReport.css';

type DeductionKey = 'adv' | 'advPeribadi' | 'motor' | 'epf' | 'socso' | 'permit' | 'makanan';
type WorkerDeduction = Record<DeductionKey, number>;

const FIXED_AIR = 30;
const DEFAULT_DEDUCTION: WorkerDeduction = {
  adv: 0,
  advPeribadi: 0,
  motor: 0,
  epf: 0,
  socso: 0,
  permit: 0,
  makanan: 0,
};

export function SalaryReport() {
  const { diaries, showSalaryReport, toggleSalaryReport, workers, customers, workPrices } = useAppStore();

  // 默认日期范围：当前月份
  const now = new Date();
  const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [expandedWorker, setExpandedWorker] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<SalaryGroup>('TongHuat');
  const [deductionsByWorker, setDeductionsByWorker] = useState<Record<string, WorkerDeduction>>({});

  const deductionStorageKey = useMemo(
    () => `salary-deductions:${selectedGroup}:${startDate}:${endDate}`,
    [selectedGroup, startDate, endDate]
  );

  const groupFilteredDiaries = useMemo(
    () => diaries.filter((d) => (d.salary_group || 'TongHuat') === selectedGroup),
    [diaries, selectedGroup]
  );

  // 计算薪资
  const calculationResult = useMemo(() => {
    if (!startDate || !endDate) return { summaries: [], warnings: [], excludedCount: 0 };
    return calculateSalary(
      groupFilteredDiaries,
      new Date(startDate),
      new Date(endDate),
      selectedWorker || undefined,
      customers,
      workPrices,
      workers
    );
  }, [groupFilteredDiaries, startDate, endDate, selectedWorker, customers, workPrices, workers]);

  const summaries: SalarySummary[] = calculationResult.summaries;
  const warnings: SalaryWarning[] = calculationResult.warnings;
  const excludedCount = calculationResult.excludedCount;

  // 总计
  const grandTotal = useMemo(
    () => Math.round(summaries.reduce((sum, s) => sum + s.total, 0) * 100) / 100,
    [summaries]
  );

  const getWorkerKey = (summary: SalarySummary): string => {
    return summary.workerId || summary.workerName;
  };

  const getWorkerDeduction = (summary: SalarySummary): WorkerDeduction => {
    return deductionsByWorker[getWorkerKey(summary)] || DEFAULT_DEDUCTION;
  };

  const calcWorkerDeductionTotal = (summary: SalarySummary): number => {
    const d = getWorkerDeduction(summary);
    return d.adv + d.advPeribadi + d.motor + d.epf + d.socso + d.permit + d.makanan + FIXED_AIR;
  };

  const calcWorkerNetTotal = (summary: SalarySummary): number => {
    return Math.max(0, summary.total - calcWorkerDeductionTotal(summary));
  };

  const grandNetTotal = useMemo(
    () => Math.round(summaries.reduce((sum, s) => sum + calcWorkerNetTotal(s), 0) * 100) / 100,
    [summaries, deductionsByWorker]
  );

  const handleDeductionChange = (summary: SalarySummary, key: DeductionKey, value: string) => {
    const parsed = value.trim() === '' ? 0 : Number(value);
    const amount = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    const workerKey = getWorkerKey(summary);
    setDeductionsByWorker(prev => ({
      ...prev,
      [workerKey]: {
        ...(prev[workerKey] || DEFAULT_DEDUCTION),
        [key]: amount,
      },
    }));
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(deductionStorageKey);
      if (!raw) {
        setDeductionsByWorker({});
        return;
      }
      const parsed = JSON.parse(raw) as Record<string, WorkerDeduction>;
      setDeductionsByWorker(parsed || {});
    } catch {
      setDeductionsByWorker({});
    }
  }, [deductionStorageKey]);

  useEffect(() => {
    localStorage.setItem(deductionStorageKey, JSON.stringify(deductionsByWorker));
  }, [deductionStorageKey, deductionsByWorker]);

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
    exportSalaryCSV(summaries, new Date(startDate), new Date(endDate), deductionsByWorker, FIXED_AIR);
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

        {/* 分组标签 */}
        <div className="salary-group-tabs">
          <button
            className={`salary-group-tab ${selectedGroup === 'TongHuat' ? 'active' : ''}`}
            onClick={() => setSelectedGroup('TongHuat')}
          >
            TongHuat
          </button>
          <button
            className={`salary-group-tab ${selectedGroup === 'AhSeng' ? 'active' : ''}`}
            onClick={() => setSelectedGroup('AhSeng')}
          >
            AhSeng
          </button>
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
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 汇总 */}
        <div className="salary-summary-bar">
          <span>共 {summaries.length} 位工人</span>
          <div className="salary-grand-totals">
            <span className="salary-grand-total">毛额: RM {grandTotal.toFixed(2)}</span>
            <span className="salary-grand-net-total">净额: RM {grandNetTotal.toFixed(2)}</span>
          </div>
        </div>

        {excludedCount > 0 && (
          <div className="salary-warning-panel">
            <div className="salary-warning-title">⚠️ 有 {excludedCount} 条记录未纳入核算</div>
            <div className="salary-warning-list">
              {warnings.map((w) => (
                <div key={`${w.diaryId}-${w.reason}`} className="salary-warning-item">
                  <strong>{w.date}</strong> · {w.customer} · {w.workType} ({w.unit})：{w.message}
                </div>
              ))}
            </div>
          </div>
        )}

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
                    <div className="salary-worker-money">
                      <span>毛额 RM {s.total.toFixed(2)}</span>
                      <span className="salary-worker-net">净额 RM {calcWorkerNetTotal(s).toFixed(2)}</span>
                    </div>
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
                            <td>{d.quantity == null ? '-' : d.quantity} {d.unit}</td>
                            <td>{d.unitPrice}</td>
                            <td className="salary-subtotal">{d.subtotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="salary-deduction-panel">
                      <div className="salary-deduction-title">扣除项（AIR 固定 RM {FIXED_AIR.toFixed(2)}）</div>
                      <div className="salary-deduction-grid">
                        <label>ADV<input type="number" min="0" step="0.01" value={getWorkerDeduction(s).adv} onChange={(e) => handleDeductionChange(s, 'adv', e.target.value)} /></label>
                        <label>ADV PERIBADI<input type="number" min="0" step="0.01" value={getWorkerDeduction(s).advPeribadi} onChange={(e) => handleDeductionChange(s, 'advPeribadi', e.target.value)} /></label>
                        <label>MOTOR<input type="number" min="0" step="0.01" value={getWorkerDeduction(s).motor} onChange={(e) => handleDeductionChange(s, 'motor', e.target.value)} /></label>
                        <label>EPF<input type="number" min="0" step="0.01" value={getWorkerDeduction(s).epf} onChange={(e) => handleDeductionChange(s, 'epf', e.target.value)} /></label>
                        <label>SOCSO<input type="number" min="0" step="0.01" value={getWorkerDeduction(s).socso} onChange={(e) => handleDeductionChange(s, 'socso', e.target.value)} /></label>
                        <label>PERMIT<input type="number" min="0" step="0.01" value={getWorkerDeduction(s).permit} onChange={(e) => handleDeductionChange(s, 'permit', e.target.value)} /></label>
                        <label>MAKANAN<input type="number" min="0" step="0.01" value={getWorkerDeduction(s).makanan} onChange={(e) => handleDeductionChange(s, 'makanan', e.target.value)} /></label>
                        <label>AIR<input type="number" value={FIXED_AIR.toFixed(2)} disabled /></label>
                      </div>
                      <div className="salary-deduction-result">
                        <span>扣除合计: RM {calcWorkerDeductionTotal(s).toFixed(2)}</span>
                        <strong>实发: RM {calcWorkerNetTotal(s).toFixed(2)}</strong>
                      </div>
                    </div>
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
