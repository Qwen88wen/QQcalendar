// 用户角色
export type UserRole = 'editor' | 'viewer';

// 花类型 (1-5)
export type FlowerType = 1 | 2 | 3 | 4 | 5;

// 状态类型
export type DiaryStatus = 'complete' | 'incomplete';

// profiles 表
export interface Profile {
  id: string;
  role: UserRole;
}

// diaries 表
export interface Diary {
  id: string;
  user_id: string;
  user_name: string | null;
  status: DiaryStatus;            // 状态: complete/incomplete
  customer: string | null;        // 园主
  remark: string | null;          // 备注
  worker: string | null;          // 工人
  vehicle: string | null;         // 车号
  flower_type: FlowerType | null;
  operators: string[] | null;     // 操作过的用户列表
  created_at: string;
  updated_at: string;
}

export interface DiaryInsert {
  user_id: string;
  user_name?: string | null;
  status?: DiaryStatus;
  customer?: string | null;
  remark?: string | null;
  worker?: string | null;
  vehicle?: string | null;
  flower_type?: FlowerType | null;
  operators?: string[] | null;
}

export interface DiaryUpdate {
  status?: DiaryStatus;
  customer?: string | null;
  remark?: string | null;
  worker?: string | null;
  vehicle?: string | null;
  flower_type?: FlowerType | null;
  operators?: string[] | null;
}

// diary_remarks 表 (无 user_id，只有 user_name)
export interface DiaryRemark {
  id: string;
  diary_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface DiaryRemarkInsert {
  diary_id: string;
  user_name: string;
  content: string;
}

// Database 类型定义
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Profile;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      diaries: {
        Row: Diary;
        Insert: DiaryInsert;
        Update: DiaryUpdate;
      };
      diary_remarks: {
        Row: DiaryRemark;
        Insert: DiaryRemarkInsert;
        Update: Partial<Omit<DiaryRemark, 'id' | 'created_at'>>;
      };
    };
  };
}
