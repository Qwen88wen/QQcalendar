import { getSalaryCalcMode } from './workPrices';
import { parseDiaryUnit, resolveDiaryPrices } from './pricing';
import type { Customer, Diary, SalarySummary, SalaryDetail, SalaryWarning, SalaryCalculationResult, WorkPrice, WorkType, Worker } from '../types/database';

const round2 = (v: number) => Math.round(v * 100) / 100;

const MS_PER_HOUR = 60 * 60 * 1000;
const KL_OFFSET_HOURS = 8;

const formatKlDate = (value: string): string => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const kl = new Date(d.getTime() + KL_OFFSET_HOURS * MS_PER_HOUR);
  return `${kl.getUTCFullYear()}-${String(kl.getUTCMonth() + 1).padStart(2, '0')}-${String(kl.getUTCDate()).padStart(2, '0')}`;
};

const toKlStartMs = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), -KL_OFFSET_HOURS, 0, 0, 0);
const toKlEndMs = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23 - KL_OFFSET_HOURS, 59, 59, 999);

/**
 * 计算指定日期范围内的工人薪资
 * - 统计所有状态记录（complete / incomplete）
 * - 普通工种: 多工人时平均分摊数量
 * - POISON: 每位工人独立计算，不平分
 * - 若 diary.worker_price 缺失，会尝试从 customer master / work_prices 回查
 */
export function calculateSalary(
  diaries: Diary[],
  startDate: Date,
  endDate: Date,
  workerId?: string,
  customers: Customer[] = [],
  workPrices: WorkPrice[] = [],
  workers: Worker[] = []
): SalaryCalculationResult {
  const startMs = toKlStartMs(startDate);
  const endMs = toKlEndMs(endDate);

  type WorkerBucket = {
    workerId: string | null;
    displayName: string;
    details: SalaryDetail[];
  };

  const workerMap = new Map<string, WorkerBucket>();
  const warnings: SalaryWarning[] = [];
  let excludedCount = 0;

  const workersById = new Map(workers.map((w) => [w.id, w]));
  const workersByName = new Map(workers.map((w) => [w.name.trim().toLowerCase(), w]));

  for (const diary of diaries) {
    const diaryMs = Date.parse(diary.created_at);
    if (Number.isNaN(diaryMs) || diaryMs < startMs || diaryMs > endMs) continue;

    const workType = (diary.tag || 'HARVEST') as WorkType;
    if (workType === 'TRANSPORTATION') continue;

    const displayDate = formatKlDate(diary.created_at);
    const displayUnit = diary.unit || diary.remark || '-';

    const warnAndExclude = (reason: SalaryWarning['reason'], message: string) => {
      warnings.push({
        diaryId: diary.id,
        date: displayDate,
        customer: diary.customer || '-',
        workType,
        unit: displayUnit,
        reason,
        message,
      });
      excludedCount += 1;
    };

    const workerEntries: Array<{ id: string | null; name: string }> = [];
    const seenWorkerKeys = new Set<string>();

    for (const id of diary.worker_ids || []) {
      const worker = workersById.get(id);
      if (!worker) continue;
      const key = `id:${worker.id}`;
      if (seenWorkerKeys.has(key)) continue;
      seenWorkerKeys.add(key);
      workerEntries.push({ id: worker.id, name: worker.name });
    }

    const workerNames = (diary.worker || '')
      .split(/[,，、]/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    for (const workerName of workerNames) {
      const matched = workersByName.get(workerName.toLowerCase());
      if (matched) {
        const key = `id:${matched.id}`;
        if (seenWorkerKeys.has(key)) continue;
        seenWorkerKeys.add(key);
        workerEntries.push({ id: matched.id, name: matched.name });
        continue;
      }

      const key = `name:${workerName.toLowerCase()}`;
      if (seenWorkerKeys.has(key)) continue;
      seenWorkerKeys.add(key);
      workerEntries.push({ id: null, name: workerName });
    }

    if (workerEntries.length === 0) {
      warnAndExclude('missing_workers', '无工人，未纳入核算');
      continue;
    }

    if (workerId) {
      const filteredEntries = workerEntries.filter((w) => w.id === workerId);
      if (filteredEntries.length === 0) continue;
      workerEntries.length = 0;
      workerEntries.push(...filteredEntries);
    }

    const unit = parseDiaryUnit(diary.unit || diary.remark);
    if (!unit) {
      warnAndExclude('invalid_unit', '单位缺失或无效，未纳入核算');
      continue;
    }
    const calcMode = getSalaryCalcMode(workType, unit);
    const perWorkerMode = calcMode === 'PER_WORKER';

    const resolved = resolveDiaryPrices(
      diary.tag,
      diary.unit || null,
      diary.remark,
      diary.customer,
      customers,
      workPrices
    );

    const unitPrice = diary.worker_price ?? resolved.workerPrice;
    if (unitPrice == null) {
      warnAndExclude('missing_unit_price', '缺少工资单价，未纳入核算');
      continue;
    }

    const rawQty = diary.weight ? parseFloat(diary.weight) : Number.NaN;
    const hasQty = Number.isFinite(rawQty) && rawQty > 0;

    if (!perWorkerMode && !hasQty) {
      warnAndExclude('invalid_quantity', '普通工种数量缺失或无效，未纳入核算');
      continue;
    }

    const sharedQtyCents = !perWorkerMode && hasQty ? Math.round(rawQty * 100) : 0;
    const sharedSubtotalCents = !perWorkerMode && hasQty ? Math.round(rawQty * unitPrice * 100) : 0;

    for (const [index, worker] of workerEntries.entries()) {
      let quantity: number | null;
      let subtotal: number;

      if (perWorkerMode) {
        if (hasQty) {
          quantity = round2(rawQty);
          subtotal = round2(rawQty * unitPrice);
        } else {
          quantity = null;
          subtotal = round2(unitPrice);
        }
      } else {
        const qtyBase = Math.floor(sharedQtyCents / workerEntries.length);
        const qtyRemainder = sharedQtyCents % workerEntries.length;
        const subtotalBase = Math.floor(sharedSubtotalCents / workerEntries.length);
        const subtotalRemainder = sharedSubtotalCents % workerEntries.length;
        const qtyCents = qtyBase + (index < qtyRemainder ? 1 : 0);
        const subtotalCents = subtotalBase + (index < subtotalRemainder ? 1 : 0);

        quantity = round2(qtyCents / 100);
        subtotal = round2(subtotalCents / 100);
      }

      const detail: SalaryDetail = {
        date: displayDate,
        customer: diary.customer || '-',
        workType,
        unit,
        quantity,
        unitPrice,
        subtotal,
      };

      const workerKey = worker.id || `name:${worker.name.toLowerCase()}`;
      const existing = workerMap.get(workerKey);
      if (existing) {
        existing.details.push(detail);
      } else {
        workerMap.set(workerKey, {
          workerId: worker.id,
          displayName: worker.name,
          details: [detail],
        });
      }
    }
  }

  const summaries: SalarySummary[] = [];
  for (const [, workerData] of workerMap) {
    const details = workerData.details;
    details.sort((a, b) => a.date.localeCompare(b.date));
    const total = details.reduce((sum, d) => sum + d.subtotal, 0);
    summaries.push({
      workerId: workerData.workerId,
      workerName: workerData.displayName,
      details,
      total: round2(total),
    });
  }

  summaries.sort((a, b) => b.total - a.total);
  return { summaries, warnings, excludedCount };
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
  endDate: Date,
  deductionsByWorkerId: Record<string, {
    adv: number;
    advPeribadi: number;
    motor: number;
    epf: number;
    socso: number;
    permit: number;
    makanan: number;
  }> = {},
  fixedAir = 30
): void {
  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  let csv = '\uFEFF';
  csv += `${escapeCsv(`薪资报表 (${formatDate(startDate)} ~ ${formatDate(endDate)})`)}\n\n`;

  csv += '=== 汇总 ===\n';
  csv += '工人,总薪资,总扣除,净薪资\n';
  let grandTotal = 0;
  let grandDeduction = 0;
  let grandNet = 0;
  for (const s of summaries) {
    const workerKey = s.workerId || s.workerName;
    const d = deductionsByWorkerId[workerKey] || {
      adv: 0,
      advPeribadi: 0,
      motor: 0,
      epf: 0,
      socso: 0,
      permit: 0,
      makanan: 0,
    };
    const deductionTotal = d.adv + d.advPeribadi + d.motor + d.epf + d.socso + d.permit + d.makanan + fixedAir;
    const net = Math.max(0, s.total - deductionTotal);
    csv += `${escapeCsv(s.workerName)},${escapeCsv(s.total.toFixed(2))},${escapeCsv(deductionTotal.toFixed(2))},${escapeCsv(net.toFixed(2))}\n`;
    grandTotal += s.total;
    grandDeduction += deductionTotal;
    grandNet += net;
  }
  csv += `${escapeCsv('合计')},${escapeCsv(grandTotal.toFixed(2))},${escapeCsv(grandDeduction.toFixed(2))},${escapeCsv(grandNet.toFixed(2))}\n\n`;

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
