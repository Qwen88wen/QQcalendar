import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 检查环境变量是否配置
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

// 创建 Supabase 客户端（仅在配置正确时）
// 如果未配置，使用空字符串创建一个占位客户端（不会实际使用）
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

// 用于检查配置的辅助函数
export function checkSupabaseConfig(): void {
  if (!isSupabaseConfigured) {
    throw new Error(
      '请配置 Supabase 环境变量。\n\n' +
      '1. 复制 .env.example 为 .env\n' +
      '2. 填入您的 Supabase URL 和 Anon Key\n' +
      '3. 重新启动开发服务器'
    );
  }
}
