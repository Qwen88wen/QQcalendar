import type { UserRole } from '../types/database';

// 用户配置接口
export interface LocalUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

// 用户基本信息 (不含密码)
const USER_CONFIG: LocalUser[] = [
  {
    id: 'user-qqrou',
    username: 'QQrou',
    displayName: 'QQ柔',
    role: 'editor',
  },
  {
    id: 'user-qqfang',
    username: 'QQfang',
    displayName: 'QQ芳',
    role: 'editor',
  },
  {
    id: 'user-qqwen',
    username: 'QQwen',
    displayName: 'QQ雯',
    role: 'editor',
  },
];

// 从环境变量获取密码
function getPasswordForUser(username: string): string {
  const upperUsername = username.toUpperCase();
  switch (upperUsername) {
    case 'QQROU':
      return import.meta.env.VITE_USER_QQROU_PASSWORD || '';
    case 'QQFANG':
      return import.meta.env.VITE_USER_QQFANG_PASSWORD || '';
    case 'QQWEN':
      return import.meta.env.VITE_USER_QQWEN_PASSWORD || '';
    default:
      return '';
  }
}

// 导出用户列表 (供 UI 显示使用，不含密码)
export const LOCAL_USERS: LocalUser[] = USER_CONFIG;

// 验证用户登录 (用户名不区分大小写)
export function authenticateUser(username: string, password: string): LocalUser | null {
  const user = USER_CONFIG.find(
    (u) => u.username.toUpperCase() === username.toUpperCase()
  );

  if (!user) return null;

  const correctPassword = getPasswordForUser(user.username);
  if (!correctPassword) {
    console.warn(`Password not configured for user: ${username}`);
    return null;
  }

  if (password === correctPassword) {
    return user;
  }

  return null;
}

// 根据 ID 获取用户
export function getUserById(id: string): LocalUser | null {
  return USER_CONFIG.find((u) => u.id === id) || null;
}
