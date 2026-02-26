import type { Diary, SalarySummary, SalaryDetail, WorkType } from '../types/database';

/**
 * 计算指定日期范围内的工人薪资
 * - 只计算 status='complete' 的记录
 * - 多工人时平均分摊数量
 * - 忽略缺少 worker_price 或 weight 的记录
 */
export function calculateSalary(
  diaries: Diary[],
  startDate: Date,
  endDate: Date,
  workerName?: string
): SalarySummary[] {
  // 设置日期范围（包含起止日）
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // 按工人分组
  const workerMap = new Map<string, SalaryDetail[]>();

  for (const diary of diaries) {
    // 只算已完成的记录
    if (diary.status !== 'complete') continue;

    // 需要有价格和数量
    if (diary.worker_price == null || diary.weight == null) continue;

    const quantity = parseFloat(diary.weight);
    if (isNaN(quantity) || quantity <= 0) continue;

    // 日期筛选
    const diaryDate = new Date(diary.created_at);
    if (diaryDate < start || diaryDate > end) continue;

    // 解析工人列表
    const workers = (diary.worker || '')
      .split(',')
      .map(w => w.trim())
      .filter(w => w.length > 0);

    if (workers.length === 0) continue;

    // 按工人名筛选
    if (workerName && !workers.includes(workerName)) continue;

    // 平均分摊数量
    const shareQuantity = quantity / workers.length;
    const unitPrice = diary.worker_price;

    for (const worker of workers) {
      if (workerName && worker !== workerName) continue;

      const detail: SalaryDetail = {
        date: diary.created_at.split('T')[0],
        customer: diary.customer || '-',
        workType: (diary.tag || 'HARVEST') as WorkType,
        unit: diary.remark || '-',
        quantity: Math.round(shareQuantity * 100) / 100,
        unitPrice,
        subtotal: Math.round(shareQuantity * unitPrice * 100) / 100,
      };

      const existing = workerMap.get(worker);
      if (existing) {
        existing.push(detail);
      } else {
        workerMap.set(worker, [detail]);
      }
    }
  }

  // 转换为 SalarySummary 数组
  const summaries: SalarySummary[] = [];
  for (const [name, details] of workerMap) {
    // 按日期排序
    details.sort((a, b) => a.date.localeCompare(b.date));
    const total = details.reduce((sum, d) => sum + d.subtotal, 0);
    summaries.push({
      workerName: name,
      details,
      total: Math.round(total * 100) / 100,
    });
  }

  // 按总薪资降序排列
  summaries.sort((a, b) => b.total - a.total);

  return summaries;
}

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

  // BOM for Excel to recognize UTF-8
  let csv = '\uFEFF';

  // 标题行
  csv += `薪资报表 (${formatDate(startDate)} ~ ${formatDate(endDate)})\n\n`;

  // 汇总表
  csv += '=== 汇总 ===\n';
  csv += '工人,总薪资\n';
  let grandTotal = 0;
  for (const s of summaries) {
    csv += `${s.workerName},${s.total.toFixed(2)}\n`;
    grandTotal += s.total;
  }
  csv += `合计,${grandTotal.toFixed(2)}\n\n`;

  // 明细表
  csv += '=== 明细 ===\n';
  csv += '工人,日期,园主,工作类型,单位,数量,单价,小计\n';
  for (const s of summaries) {
    for (const d of s.details) {
      csv += `${s.workerName},${d.date},${d.customer},${d.workType},${d.unit},${d.quantity},${d.unitPrice},${d.subtotal.toFixed(2)}\n`;
    }
  }

  // 下载文件
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
