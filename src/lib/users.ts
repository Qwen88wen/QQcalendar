import type { UserRole } from '../types/database';

// 硬编码用户配置
export interface LocalUser {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
}

export const LOCAL_USERS: LocalUser[] = [
  {
    id: 'user-qqrou',
    username: 'QQrou',
    password: '920607',
    displayName: 'QQ柔',
    role: 'editor',
  },
  {
    id: 'user-qqfang',
    username: 'QQfang',
    password: '990129',
    displayName: 'QQ芳',
    role: 'editor',
  },
  {
    id: 'user-qqwen',
    username: 'QQwen',
    password: '020808',
    displayName: 'QQ雯',
    role: 'editor',
  },
];

// 验证用户登录
export function authenticateUser(username: string, password: string): LocalUser | null {
  const user = LOCAL_USERS.find(
    (u) => u.username === username && u.password === password
  );
  return user || null;
}

// 根据 ID 获取用户
export function getUserById(id: string): LocalUser | null {
  return LOCAL_USERS.find((u) => u.id === id) || null;
}
