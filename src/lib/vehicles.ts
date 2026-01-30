import { supabase } from './supabase';
import type { Vehicle, VehicleInsert, VehicleUpdate } from '../types/database';

// 获取所有活跃的车辆
export async function getActiveVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)
    .order('plate_number', { ascending: true });

  if (error) {
    console.error('获取车辆列表失败:', error);
    return [];
  }

  return data || [];
}

// 获取所有车辆（包括非活跃）
export async function getAllVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('plate_number', { ascending: true });

  if (error) {
    console.error('获取车辆列表失败:', error);
    return [];
  }

  return data || [];
}

// 新增车辆
export async function createVehicle(vehicle: VehicleInsert): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicle as never)
    .select()
    .single();

  if (error) {
    console.error('新增车辆失败:', error);
    if (error.code === '23505') {
      alert('车牌号已存在！');
    }
    return null;
  }

  return data;
}

// 更新车辆
export async function updateVehicle(id: string, updates: VehicleUpdate): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新车辆失败:', error);
    return null;
  }

  return data;
}

// 停用车辆
export async function deactivateVehicle(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('vehicles')
    .update({ is_active: false } as never)
    .eq('id', id);

  if (error) {
    console.error('停用车辆失败:', error);
    return false;
  }

  return true;
}

// 激活车辆
export async function activateVehicle(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('vehicles')
    .update({ is_active: true } as never)
    .eq('id', id);

  if (error) {
    console.error('激活车辆失败:', error);
    return false;
  }

  return true;
}

// 批量导入车辆
export async function importVehicles(vehicles: VehicleInsert[]): Promise<number> {
  const { data, error } = await supabase
    .from('vehicles')
    .upsert(vehicles as never[], { onConflict: 'plate_number' })
    .select();

  if (error) {
    console.error('批量导入车辆失败:', error);
    return 0;
  }

  return data?.length || 0;
}
