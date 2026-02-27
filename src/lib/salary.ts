import { isPoisonWorkType } from './workPrices';
import { resolveDiaryPrices } from './pricing';
import type { Customer, Diary, SalarySummary, SalaryDetail, WorkPrice, WorkType } from '../types/database';

const round2 = (v: number) => Math.round(v * 100) / 100;

const toUtcStartMs = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0);
const toUtcEndMs = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999);

/**
 * 计算指定日期范围内的工人薪资
 * - 只计算 status='complete' 的记录
 * - 普通工种: 多工人时平均分摊数量
 * - POISON: 每位工人独立计算，不平分
 * - 若 diary.worker_price 缺失，会尝试从 customer master / work_prices 回查
 */
export function calculateSalary(
  diaries: Diary[],
  startDate: Date,
  endDate: Date,
  workerName?: string,
  customers: Customer[] = [],
  workPrices: WorkPrice[] = []
): SalarySummary[] {
  const startMs = toUtcStartMs(startDate);
  const endMs = toUtcEndMs(endDate);

  const workerMap = new Map<string, SalaryDetail[]>();

  for (const diary of diaries) {
    if (diary.status !== 'complete') continue;

    const diaryMs = Date.parse(diary.created_at);
    if (Number.isNaN(diaryMs) || diaryMs < startMs || diaryMs > endMs) continue;

    const workers = (diary.worker || '')
      .split(',')
      .map(w => w.trim())
      .filter(w => w.length > 0);

    if (workers.length === 0) continue;
    if (workerName && !workers.includes(workerName)) continue;

    const workType = (diary.tag || 'HARVEST') as WorkType;
    const poisonMode = isPoisonWorkType(workType);

    const resolved = resolveDiaryPrices(
      diary.tag,
      diary.remark,
      diary.customer,
      customers,
      workPrices
    );

    const unitPrice = diary.worker_price ?? resolved.workerPrice;
    if (unitPrice == null) continue;

    const rawQty = diary.weight ? parseFloat(diary.weight) : Number.NaN;
    const hasQty = Number.isFinite(rawQty) && rawQty > 0;

    if (!poisonMode && !hasQty) continue;

    for (const worker of workers) {
      if (workerName && worker !== workerName) continue;

      let quantity: number | null;
      let subtotal: number;

      if (poisonMode) {
        if (hasQty) {
          quantity = round2(rawQty);
          subtotal = round2(rawQty * unitPrice);
        } else {
          // 保留空白数量但仍记录该工作（按单价计一笔）
          quantity = null;
          subtotal = round2(unitPrice);
        }
      } else {
        const shareQuantity = rawQty / workers.length;
        quantity = round2(shareQuantity);
        subtotal = round2(shareQuantity * unitPrice);
      }

      const detail: SalaryDetail = {
        date: new Date(diary.created_at).toISOString().split('T')[0],
        customer: diary.customer || '-',
        workType,
        unit: diary.remark || '-',
        quantity,
        unitPrice,
        subtotal,
      };

      const existing = workerMap.get(worker);
      if (existing) {
        existing.push(detail);
      } else {
        workerMap.set(worker, [detail]);
      }
    }
  }

  const summaries: SalarySummary[] = [];
  for (const [name, details] of workerMap) {
    details.sort((a, b) => a.date.localeCompare(b.date));
    const total = details.reduce((sum, d) => sum + d.subtotal, 0);
    summaries.push({
      workerName: name,
      details,
      total: round2(total),
    });
  }

  summaries.sort((a, b) => b.total - a.total);
  return summaries;
}

const escapeCsv = (value: string | number | null | undefined): string => {
  const raw = value == null ? '' : String(value);
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
};

/**
 * 导出薪资报表为 CSV
 */
export function exportSalaryCSV(
  summaries: SalarySummary[],
  startDate: Date,
  endDate: Date
): void {
  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  let csv = '\uFEFF';
  csv += `${escapeCsv(`薪资报表 (${formatDate(startDate)} ~ ${formatDate(endDate)})`)}\n\n`;

  csv += '=== 汇总 ===\n';
  csv += '工人,总薪资\n';
  let grandTotal = 0;
  for (const s of summaries) {
    csv += `${escapeCsv(s.workerName)},${escapeCsv(s.total.toFixed(2))}\n`;
    grandTotal += s.total;
  }
  csv += `${escapeCsv('合计')},${escapeCsv(grandTotal.toFixed(2))}\n\n`;

  csv += '=== 明细 ===\n';
  csv += '工人,日期,园主,工作类型,单位,数量,单价,小计\n';
  for (const s of summaries) {
    for (const d of s.details) {
      const quantityLabel = d.quantity == null ? '' : d.quantity;
      csv += `${escapeCsv(s.workerName)},${escapeCsv(d.date)},${escapeCsv(d.customer)},${escapeCsv(d.workType)},${escapeCsv(d.unit)},${escapeCsv(quantityLabel)},${escapeCsv(d.unitPrice)},${escapeCsv(d.subtotal.toFixed(2))}\n`;
    }
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `薪资报表_${formatDate(startDate)}_${formatDate(endDate)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
