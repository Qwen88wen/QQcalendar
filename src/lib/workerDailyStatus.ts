import { supabase } from './supabase';
import type { WorkerDailyStatus, WorkerDailyStatusType } from '../types/database';

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

export async function upsertWorkerDailyStatus(params: {
  date: string;
  worker_id: string;
  status: WorkerDailyStatusType;
  note?: string | null;
}): Promise<WorkerDailyStatus | null> {
  const { data, error } = await supabase
    .from('worker_daily_statuses')
    .upsert(params as never, { onConflict: 'date,worker_id' })
    .select()
    .single();

  if (error) {
    console.error('更新工人每日状态失败:', error);
    return null;
  }

  return data as WorkerDailyStatus;
}

export async function clearWorkerDailyStatus(date: string, workerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('worker_daily_statuses')
    .delete()
    .eq('date', date)
    .eq('worker_id', workerId);

  if (error) {
    console.error('清除工人每日状态失败:', error);
    return false;
  }

  return true;
}
