import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';
import type { Diary, DiaryRemark, Todo } from '../types/database';

export function useRealtime() {
  const { addDiary, updateDiary, removeDiary, addRemark, selectedDiary, addTodo, updateTodo, removeTodo } = useAppStore();

  useEffect(() => {
    console.log('[Realtime] 正在建立实时连接...');

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
          console.log('[Realtime] 收到数据变更:', payload.eventType, payload.new);
          if (payload.eventType === 'INSERT') {
            addDiary(payload.new as Diary);
          } else if (payload.eventType === 'UPDATE') {
            updateDiary(payload.new as Diary);
          } else if (payload.eventType === 'DELETE') {
            removeDiary((payload.old as { id: string }).id);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] diaries 订阅状态:', status);
      });

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

    // 监听 todos 表变更
    const todosChannel = supabase
      .channel('todos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
        },
        (payload) => {
          console.log('[Realtime] 收到待办变更:', payload.eventType, payload.new);
          if (payload.eventType === 'INSERT') {
            addTodo(payload.new as Todo);
          } else if (payload.eventType === 'UPDATE') {
            updateTodo(payload.new as Todo);
          } else if (payload.eventType === 'DELETE') {
            removeTodo((payload.old as { id: string }).id);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] todos 订阅状态:', status);
      });

    return () => {
      supabase.removeChannel(diariesChannel);
      supabase.removeChannel(remarksChannel);
      supabase.removeChannel(todosChannel);
    };
  }, [addDiary, updateDiary, removeDiary, addRemark, selectedDiary, addTodo, updateTodo, removeTodo]);
}
