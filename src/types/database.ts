export interface Database {
  public: {
    Tables: {
      diaries: {
        Row: {
          id: string;
          user_id: string;
          user_name: string | null;
          content: string;
          flower_type: number | null; // 1-5，决定3D场景中显示哪种花
          created_at: string; // 用于3D布局的时间轴
        };
        Insert: {
          id?: string;
          user_id: string;
          user_name?: string | null;
          content: string;
          flower_type?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_name?: string | null;
          content?: string;
          flower_type?: number | null;
          created_at?: string;
        };
      };
    };
  };
}

export type Diary = Database['public']['Tables']['diaries']['Row'];
export type DiaryInsert = Database['public']['Tables']['diaries']['Insert'];
export type DiaryUpdate = Database['public']['Tables']['diaries']['Update'];

// 花类型枚举 (1-5)
export type FlowerType = 1 | 2 | 3 | 4 | 5;
