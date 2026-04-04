import type { Customer, Diary, Worker, WorkerDailyStatus } from '../types/database';

export type WorkerPanelStatus = 'REST' | 'WORKING' | 'UNASSIGNED';

export interface WorkerPanelCustomerRef {
  diaryId: string;
  customerId: string;
}

export interface WorkerPanelWorkerItem {
  workerId: string;
  workerCode: string | null;
  workerName: string;
  status: WorkerPanelStatus;
  restNote: string | null;
  customers: WorkerPanelCustomerRef[];
  restConflictCustomerCount: number;
}

export interface WorkerPanelStats {
  totalWorkers: number;
  workingWorkers: number;
  restWorkers: number;
  unassignedWorkers: number;
  totalCustomers: number;
}

interface BuildWorkerPanelParams {
  selectedDate: Date;
  diaries: Diary[];
  workers: Worker[];
  customers: Customer[];
  workerDailyStatuses: WorkerDailyStatus[];
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function resolveWorkerStatus(hasCustomers: boolean, restStatus?: WorkerDailyStatus): WorkerPanelStatus {
  if (restStatus?.status === 'REST') return 'REST';
  if (hasCustomers) return 'WORKING';
  return 'UNASSIGNED';
}

function extractDiaryWorkerIds(diary: Diary, workersByName: Map<string, Worker>): string[] {
  const byIds = diary.worker_ids?.filter(Boolean) ?? [];
  if (byIds.length > 0) return byIds;

  const names = (diary.worker || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  return names
    .map((name) => workersByName.get(name.toLowerCase())?.id || null)
    .filter((id): id is string => Boolean(id));
}

export function buildWorkerPanelData(params: BuildWorkerPanelParams): {
  dateKey: string;
  workerItems: WorkerPanelWorkerItem[];
  customerById: Map<string, Customer>;
  stats: WorkerPanelStats;
} {
  const { selectedDate, diaries, workers, customers, workerDailyStatuses } = params;
  const dateKey = toDateKey(selectedDate);

  const workersByName = new Map(workers.map((w) => [w.name.trim().toLowerCase(), w]));
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const restByWorkerId = new Map(
    workerDailyStatuses
      .filter((s) => s.date === dateKey)
      .map((s) => [s.worker_id, s])
  );

  const workerCustomerMap = new Map<string, WorkerPanelCustomerRef[]>();

  diaries
    .filter((diary) => diary.created_at.slice(0, 10) === dateKey)
    .forEach((diary) => {
      const customerId = diary.customer_id;
      if (!customerId || !customerById.has(customerId)) return;

      const workerIds = extractDiaryWorkerIds(diary, workersByName);
      workerIds.forEach((workerId) => {
        const refs = workerCustomerMap.get(workerId) || [];
        const exists = refs.some((item) => item.diaryId === diary.id && item.customerId === customerId);
        if (!exists) {
          refs.push({ diaryId: diary.id, customerId });
          workerCustomerMap.set(workerId, refs);
        }
      });
    });

  const workerItems = workers
    .filter((w) => w.is_active)
    .map((worker) => {
      const customersForWorker = workerCustomerMap.get(worker.id) || [];
      const restStatus = restByWorkerId.get(worker.id);
      const status = resolveWorkerStatus(customersForWorker.length > 0, restStatus);

      return {
        workerId: worker.id,
        workerCode: worker.code,
        workerName: worker.name,
        status,
        restNote: restStatus?.note || null,
        customers: customersForWorker,
        restConflictCustomerCount: status === 'REST' ? customersForWorker.length : 0,
      } satisfies WorkerPanelWorkerItem;
    })
    .sort((a, b) => a.workerName.localeCompare(b.workerName));

  const stats: WorkerPanelStats = {
    totalWorkers: workerItems.length,
    workingWorkers: workerItems.filter((item) => item.status === 'WORKING').length,
    restWorkers: workerItems.filter((item) => item.status === 'REST').length,
    unassignedWorkers: workerItems.filter((item) => item.status === 'UNASSIGNED').length,
    totalCustomers: new Set(workerItems.flatMap((item) => item.customers.map((c) => c.customerId))).size,
  };

  return { dateKey, workerItems, customerById, stats };
}

export function filterWorkerPanelItems(
  items: WorkerPanelWorkerItem[],
  customerById: Map<string, Customer>,
  query: string,
  statusFilter: 'ALL' | WorkerPanelStatus
): WorkerPanelWorkerItem[] {
  const normalized = query.trim().toLowerCase();

  return items.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }

    if (!normalized) return true;

    const workerMatched = [item.workerName, item.workerCode || '', item.workerId]
      .some((value) => value.toLowerCase().includes(normalized));

    if (workerMatched) return true;

    return item.customers.some((customerRef) => {
      const customer = customerById.get(customerRef.customerId);
      if (!customer) return false;
      return [customer.name, customer.code || '', customer.id]
        .some((value) => value.toLowerCase().includes(normalized));
    });
  });
}
