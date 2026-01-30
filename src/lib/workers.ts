import { supabase } from './supabase';
import type { Worker, WorkerInsert, WorkerUpdate } from '../types/database';

// 获取所有活跃的工人
export async function getActiveWorkers(): Promise<Worker[]> {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('获取工人列表失败:', error);
    return [];
  }

  return (data as Worker[]) || [];
}

// 获取所有工人（包括非活跃）
export async function getAllWorkers(): Promise<Worker[]> {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('获取工人列表失败:', error);
    return [];
  }

  return (data as Worker[]) || [];
}

// 根据 ID 获取工人
export async function getWorkerById(id: string): Promise<Worker | null> {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('获取工人失败:', error);
    return null;
  }

  return data as Worker;
}

// 根据名称获取工人
export async function getWorkerByName(name: string): Promise<Worker | null> {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('name', name)
    .single();

  if (error) {
    return null;
  }

  return data as Worker;
}

// 新增工人
export async function createWorker(worker: WorkerInsert): Promise<Worker | null> {
  const { data, error } = await supabase
    .from('workers')
    .insert(worker as never)
    .select()
    .single();

  if (error) {
    console.error('新增工人失败:', error);
    if (error.code === '23505') {
      alert('工人名称已存在！');
    }
    return null;
  }

  return data as Worker;
}

// 更新工人
export async function updateWorker(id: string, updates: WorkerUpdate): Promise<Worker | null> {
  const { data, error } = await supabase
    .from('workers')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新工人失败:', error);
    return null;
  }

  return data as Worker;
}

// 停用工人 (软删除)
export async function deactivateWorker(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('workers')
    .update({ is_active: false } as never)
    .eq('id', id);

  if (error) {
    console.error('停用工人失败:', error);
    return false;
  }

  return true;
}

// 激活工人
export async function activateWorker(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('workers')
    .update({ is_active: true } as never)
    .eq('id', id);

  if (error) {
    console.error('激活工人失败:', error);
    return false;
  }

  return true;
}

// 批量导入工人
export async function importWorkers(workers: WorkerInsert[]): Promise<number> {
  const { data, error } = await supabase
    .from('workers')
    .upsert(workers as never[], { onConflict: 'name' })
    .select();

  if (error) {
    console.error('批量导入工人失败:', error);
    return 0;
  }

  return data?.length || 0;
}
