import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 检查环境变量是否配置
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

// 延迟创建 Supabase 客户端，避免在环境变量缺失时立即崩溃
let _supabase: SupabaseClient<Database> | null = null;

export const getSupabase = (): SupabaseClient<Database> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase 环境变量未配置。请复制 .env.example 为 .env 并填入正确的 Supabase URL 和 Key。');
  }
  if (!_supabase) {
    _supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }
  return _supabase;
};

// 保持向后兼容 - 但使用 getter 延迟初始化
export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseKey)
  : (null as unknown as SupabaseClient<Database>);
