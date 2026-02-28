import { supabase } from './supabase';
import type { WorkPrice, WorkPriceInsert, WorkPriceUpdate, WorkType, UnitType } from '../types/database';

export type SalaryCalcMode = 'SHARED_BY_WORKERS' | 'PER_WORKER';

// 获取所有工作价格
export async function getAllWorkPrices(): Promise<WorkPrice[]> {
  const { data, error } = await supabase
    .from('work_prices')
    .select('*')
    .order('work_type', { ascending: true });

  if (error) {
    console.error('获取工作价格列表失败:', error);
    return [];
  }

  return data || [];
}

// 根据工作类型和单位获取价格
export async function getWorkPrice(workType: WorkType, unit: UnitType): Promise<WorkPrice | null> {
  const { data, error } = await supabase
    .from('work_prices')
    .select('*')
    .eq('work_type', workType)
    .eq('unit', unit)
    .single();

  if (error) {
    // 可能是找不到，不一定是错误
    return null;
  }

  return data;
}

// 新增工作价格
export async function createWorkPrice(workPrice: WorkPriceInsert): Promise<WorkPrice | null> {
  const { data, error } = await supabase
    .from('work_prices')
    .insert(workPrice as never)
    .select()
    .single();

  if (error) {
    console.error('新增工作价格失败:', error);
    if (error.code === '23505') {
      alert('该工作类型和单位组合已存在！');
    }
    return null;
  }

  return data;
}

// 更新工作价格
export async function updateWorkPrice(id: string, updates: WorkPriceUpdate): Promise<WorkPrice | null> {
  const { data, error } = await supabase
    .from('work_prices')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新工作价格失败:', error);
    return null;
  }

  return data;
}

// 删除工作价格
export async function deleteWorkPrice(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('work_prices')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('删除工作价格失败:', error);
    return false;
  }

  return true;
}

// 判断是否需要用户自定义价格
export function needsCustomPrice(workType: WorkType, unit: UnitType): boolean {
  // 固定价格的组合
  const fixedPrices: Array<{ workType: WorkType; unit: UnitType }> = [
    { workType: 'POISON', unit: 'DAY' },
    { workType: 'POISON', unit: 'HALF DAY' },
    { workType: 'FERTILIZE', unit: 'BAG' },
    { workType: 'FERTILIZE', unit: 'EKAR' },
    { workType: 'SEEDLING', unit: 'POKOK' },
  ];

  // HARVEST 从 customer master 读取，不算自定义
  if (workType === 'HARVEST') {
    return false;
  }

  // 检查是否在固定价格列表中
  const isFixed = fixedPrices.some(
    (fp) => fp.workType === workType && fp.unit === unit
  );

  return !isFixed;
}

// 判断是否需要从 Customer Master 读取价格
export function needsCustomerPrice(workType: WorkType): boolean {
  return workType === 'HARVEST';
}

// 判断 POISON 是否不需要平分（每人独立计算）
export function isPoisonWorkType(workType: WorkType): boolean {
  return workType === 'POISON';
}

/**
 * 薪资计算模式
 * - SHARED_BY_WORKERS: 同一条记录按工人人数平分数量与金额
 * - PER_WORKER: 每位工人独立按整笔数量（或按单价一笔）计算
 *
 * 目前仅 POISON 采用 PER_WORKER，其他工种统一按 SHARED_BY_WORKERS。
 * 该函数用于把规则显式化，方便后续扩展到「按工种+单位」差异化策略。
 */
export function getSalaryCalcMode(workType: WorkType, _unit: UnitType | null): SalaryCalcMode {
  if (workType === 'POISON') return 'PER_WORKER';
  return 'SHARED_BY_WORKERS';
}
