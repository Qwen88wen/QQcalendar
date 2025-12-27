import { useEffect } from 'react';
import { getDiaries, getTodos } from '../lib/diary';
import { useAppStore } from '../stores/appStore';

export function useAuth() {
  const { setDiaries, setTodos, setLoading } = useAppStore();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // 获取所有日记和待办
      const [diaries, todos] = await Promise.all([
        getDiaries(),
        getTodos(),
      ]);
      setDiaries(diaries);
      setTodos(todos);

      setLoading(false);
    };

    loadData();
  }, [setDiaries, setTodos, setLoading]);
}
