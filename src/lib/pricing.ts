import type { Customer, DiaryTag, UnitType, WorkPrice } from '../types/database';

function normalizeUnit(unit: string | null | undefined): UnitType | null {
  if (!unit) return null;
  const normalized = unit.trim().replace(/\s+/g, ' ').toUpperCase();
  const allowed: UnitType[] = ['TON', 'POKOK', 'EKAR', 'JOB', 'BAG', 'DAY', 'HALF DAY'];
  return allowed.includes(normalized as UnitType) ? (normalized as UnitType) : null;
}

function findCustomerByName(customers: Customer[], customerName: string | null | undefined): Customer | null {
  if (!customerName) return null;
  const target = customerName.trim().toLowerCase();
  return customers.find((c) => c.name.trim().toLowerCase() === target) || null;
}

export function resolveDiaryPrices(
  diaryTag: DiaryTag | null | undefined,
  unitValue: string | null | undefined,
  remark: string | null | undefined,
  customerName: string | null | undefined,
  customers: Customer[],
  workPrices: WorkPrice[]
): { customerPrice: number | null; workerPrice: number | null } {
  if (!diaryTag) {
    return { customerPrice: null, workerPrice: null };
  }

  if (diaryTag === 'HARVEST') {
    const customer = findCustomerByName(customers, customerName);
    return {
      customerPrice: customer?.harvest_customer_price ?? null,
      workerPrice: customer?.harvest_worker_price ?? null,
    };
  }

  const unit = normalizeUnit(unitValue) || normalizeUnit(remark);
  if (!unit) {
    return { customerPrice: null, workerPrice: null };
  }

  const price = workPrices.find((p) => p.work_type === diaryTag && p.unit === unit);
  return {
    customerPrice: price?.customer_price ?? null,
    workerPrice: price?.worker_price ?? null,
  };
}

export function parseDiaryUnit(remark: string | null | undefined): UnitType | null {
  return normalizeUnit(remark);
}
