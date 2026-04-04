import { supabase } from './supabase';
import type { WorkerDailyStatus } from '../types/database';

export async function getWorkerDailyStatuses(): Promise<WorkerDailyStatus[]> {
  const { data, error } = await supabase
    .from('worker_daily_statuses')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('获取工人每日状态失败:', error);
    return [];
  }

  return (data as WorkerDailyStatus[]) || [];
}
