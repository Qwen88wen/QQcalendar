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
  const { data: existing, error: findError } = await supabase
    .from('worker_daily_statuses')
    .select('id')
    .eq('date', params.date)
    .eq('worker_id', params.worker_id)
    .limit(1);

  if (findError) {
    console.error('查询工人每日状态失败:', findError);
    return null;
  }

  const existingId = (existing?.[0] as { id?: string } | undefined)?.id;

  if (existingId) {
    const { data, error } = await supabase
      .from('worker_daily_statuses')
      .update({
        status: params.status,
        note: params.note ?? null,
      } as never)
      .eq('id', existingId)
      .select()
      .single();

    if (error) {
      console.error('更新工人每日状态失败:', error);
      return null;
    }

    return data as WorkerDailyStatus;
  }

  const { data, error } = await supabase
    .from('worker_daily_statuses')
    .insert({
      date: params.date,
      worker_id: params.worker_id,
      status: params.status,
      note: params.note ?? null,
    } as never)
    .select()
    .single();

  if (error) {
    console.error('新增工人每日状态失败:', error);
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
