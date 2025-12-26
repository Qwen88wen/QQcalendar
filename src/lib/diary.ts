import { supabase } from './supabase';
import type { Diary, DiaryInsert, DiaryUpdate, DiaryRemark, DiaryRemarkInsert, Profile } from '../types/database';

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

  return data;
}

// ========== Diaries ==========

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

export async function getDiaries(): Promise<Diary[]> {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取日记列表失败:', error.message);
    return [];
  }

  return data || [];
}

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

  return data || [];
}

export async function createRemark(remark: DiaryRemarkInsert): Promise<DiaryRemark | null> {
  const { data, error } = await supabase
    .from('diary_remarks')
    .insert(remark)
    .select()
    .single();

  if (error) {
    console.error('创建备注失败:', error.message);
    return null;
  }

  return data;
}
