import { supabase } from './supabase';
import type { Customer, CustomerInsert, CustomerUpdate } from '../types/database';

// 获取所有活跃的园主
export async function getActiveCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('获取园主列表失败:', error);
    return [];
  }

  return (data as Customer[]) || [];
}

// 获取所有园主（包括非活跃）
export async function getAllCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('获取园主列表失败:', error);
    return [];
  }

  return (data as Customer[]) || [];
}

// 根据 ID 获取园主
export async function getCustomerById(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('获取园主失败:', error);
    return null;
  }

  return data as Customer;
}

// 根据名称获取园主
export async function getCustomerByName(name: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('name', name)
    .single();

  if (error) {
    // 可能是找不到，不一定是错误
    return null;
  }

  return data as Customer;
}

// 新增园主
export async function createCustomer(customer: CustomerInsert): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .insert(customer as never)
    .select()
    .single();

  if (error) {
    console.error('新增园主失败:', error);
    if (error.code === '23505') {
      alert('园主名称已存在！');
    }
    return null;
  }

  return data as Customer;
}

// 更新园主
export async function updateCustomer(id: string, updates: CustomerUpdate): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新园主失败:', error);
    return null;
  }

  return data as Customer;
}

// 停用园主 (软删除)
export async function deactivateCustomer(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('customers')
    .update({ is_active: false } as never)
    .eq('id', id);

  if (error) {
    console.error('停用园主失败:', error);
    return false;
  }

  return true;
}

// 激活园主
export async function activateCustomer(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('customers')
    .update({ is_active: true } as never)
    .eq('id', id);

  if (error) {
    console.error('激活园主失败:', error);
    return false;
  }

  return true;
}

// 批量导入园主 (从 CSV)
export async function importCustomers(customers: CustomerInsert[]): Promise<number> {
  const { data, error } = await supabase
    .from('customers')
    .upsert(customers as never[], { onConflict: 'name' })
    .select();

  if (error) {
    console.error('批量导入园主失败:', error);
    return 0;
  }

  return data?.length || 0;
}
