import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';
import type { Diary, DiaryRemark } from '../types/database';

export function useRealtime() {
  const { addDiary, updateDiary, removeDiary, addRemark, selectedDiary } = useAppStore();

  useEffect(() => {
    // 监听 diaries 表变更
    const diariesChannel = supabase
      .channel('diaries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'diaries',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            addDiary(payload.new as Diary);
          } else if (payload.eventType === 'UPDATE') {
            updateDiary(payload.new as Diary);
          } else if (payload.eventType === 'DELETE') {
            removeDiary((payload.old as { id: string }).id);
          }
        }
      )
      .subscribe();

    // 监听 diary_remarks 表变更
    const remarksChannel = supabase
      .channel('remarks-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'diary_remarks',
        },
        (payload) => {
          const newRemark = payload.new as DiaryRemark;
          // 只添加当前选中日记的备注
          if (selectedDiary && newRemark.diary_id === selectedDiary.id) {
            addRemark(newRemark);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(diariesChannel);
      supabase.removeChannel(remarksChannel);
    };
  }, [addDiary, updateDiary, removeDiary, addRemark, selectedDiary]);
}
