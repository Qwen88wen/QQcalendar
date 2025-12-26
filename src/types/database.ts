export interface Database {
  public: {
    Tables: {
      diaries: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          mood: string | null;
          weather: string | null;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          mood?: string | null;
          weather?: string | null;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          mood?: string | null;
          weather?: string | null;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Diary = Database['public']['Tables']['diaries']['Row'];
export type DiaryInsert = Database['public']['Tables']['diaries']['Insert'];
export type DiaryUpdate = Database['public']['Tables']['diaries']['Update'];
