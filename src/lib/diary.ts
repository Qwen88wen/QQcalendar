import { supabase } from './supabase';
import type { Diary, DiaryInsert, DiaryUpdate } from '../types/database';

/**
 * 创建新日记
 * @param diary - 日记数据，包含 user_id, content, 可选的 user_name 和 flower_type (1-5)
 */
export async function createDiary(diary: DiaryInsert): Promise<Diary | null> {
  const { data, error } = await supabase
    .from('diaries')
    .insert(diary)
    .select()
    .single();

  if (error) {
    console.error('创建日记失败:', error.message);
    return null;
  }

  return data;
}

/**
 * 获取用户所有日记，按 created_at 倒序排列（用于3D时间轴布局）
 * @param userId - 用户ID
 */
export async function getDiaries(userId: string): Promise<Diary[]> {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取日记列表失败:', error.message);
    return [];
  }

  return data || [];
}

/**
 * 获取单篇日记
 */
export async function getDiary(id: string): Promise<Diary | null> {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('获取日记失败:', error.message);
    return null;
  }

  return data;
}

/**
 * 更新日记
 */
export async function updateDiary(id: string, updates: DiaryUpdate): Promise<Diary | null> {
  const { data, error } = await supabase
    .from('diaries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新日记失败:', error.message);
    return null;
  }

  return data;
}

/**
 * 删除日记
 */
export async function deleteDiary(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('diaries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('删除日记失败:', error.message);
    return false;
  }

  return true;
}
