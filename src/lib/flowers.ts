import type { FlowerType } from '../types/database';

// 用户对应的花朵类型
export const USER_FLOWERS: Record<string, { type: FlowerType; icon: string; name: string }> = {
  'QQrou': { type: 3, icon: '💐', name: '花束' },
  'QQfang': { type: 1, icon: '🌹', name: '玫瑰' },
  'QQwen': { type: 4, icon: '🌸', name: '樱花' },
};

// 根据花朵类型获取图标
export const FLOWER_ICONS: Record<number, string> = {
  1: '🌹',  // 玫瑰 - QQfang
  2: '🌷',  // 郁金香
  3: '💐',  // 花束 - QQrou
  4: '🌸',  // 樱花 - QQwen
  5: '🌻',  // 向日葵
};

// 根据用户名获取花朵图标
export function getFlowerIconByUser(username: string): string {
  return USER_FLOWERS[username]?.icon || '🌸';
}

// 根据用户名获取花朵类型
export function getFlowerTypeByUser(username: string): FlowerType {
  return USER_FLOWERS[username]?.type || 4;
}

// 根据操作者列表获取所有花朵图标
export function getFlowersByOperators(operators: string[] | null): string[] {
  if (!operators || operators.length === 0) return [];

  // 按用户顺序返回花朵，去重
  const uniqueOperators = [...new Set(operators)];
  return uniqueOperators.map(op => getFlowerIconByUser(op));
}
