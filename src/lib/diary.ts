import { supabase } from './supabase';
import type { Diary, DiaryInsert, DiaryUpdate, DiaryRemark, DiaryRemarkInsert, Profile, Todo, TodoInsert, TodoUpdate } from '../types/database';

// ========== Profile ==========

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('获取用户角色失败:', error.message);
    return null;
  }

  return data as Profile;
}

// ========== Diaries ==========

export async function createDiary(diary: DiaryInsert): Promise<Diary | null> {
  console.log('[DB] 正在创建记录:', diary);

  const { data, error } = await supabase
    .from('diaries')
    .insert(diary as never)
    .select()
    .single();

  if (error) {
    console.error('[DB] 创建记录失败:', error.message, error);
    alert(`创建失败: ${error.message}`);
    return null;
  }

  console.log('[DB] 记录创建成功:', data);
  return data as Diary;
}

export async function getDiaries(): Promise<Diary[]> {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取日记列表失败:', error.message);
    return [];
  }

  return (data as Diary[]) || [];
}

export async function updateDiary(id: string, updates: DiaryUpdate): Promise<Diary | null> {
  console.log('[DB] 正在更新记录:', id, updates);

  const { data, error } = await supabase
    .from('diaries')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[DB] 更新记录失败:', error.message, error);
    alert(`更新失败: ${error.message}`);
    return null;
  }

  console.log('[DB] 记录更新成功:', data);
  return data as Diary;
}

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

// ========== Remarks ==========

export async function getRemarks(diaryId: string): Promise<DiaryRemark[]> {
  const { data, error } = await supabase
    .from('diary_remarks')
    .select('*')
    .eq('diary_id', diaryId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('获取备注失败:', error.message);
    return [];
  }

  return (data as DiaryRemark[]) || [];
}

export async function createRemark(remark: DiaryRemarkInsert): Promise<DiaryRemark | null> {
  const { data, error } = await supabase
    .from('diary_remarks')
    .insert(remark as never)
    .select()
    .single();

  if (error) {
    console.error('创建备注失败:', error.message);
    return null;
  }

  return data as DiaryRemark;
}

// ========== Todos ==========

export async function getTodos(): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[DB] 获取待办失败:', error.message);
    return [];
  }

  return (data as Todo[]) || [];
}

export async function createTodo(todo: TodoInsert): Promise<Todo | null> {
  console.log('[DB] 正在创建待办:', todo);

  const { data, error } = await supabase
    .from('todos')
    .insert(todo as never)
    .select()
    .single();

  if (error) {
    console.error('[DB] 创建待办失败:', error.message, error);
    return null;
  }

  console.log('[DB] 待办创建成功:', data);
  return data as Todo;
}

export async function updateTodo(id: string, updates: TodoUpdate): Promise<Todo | null> {
  const { data, error } = await supabase
    .from('todos')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[DB] 更新待办失败:', error.message);
    return null;
  }

  return data as Todo;
}

export async function deleteTodo(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[DB] 删除待办失败:', error.message);
    return false;
  }

  return true;
}
