import { useEffect } from 'react';
import { getDiaries, getTodos } from '../lib/diary';
import { useAppStore } from '../stores/appStore';

export function useAuth() {
  const { setDiaries, setTodos, setLoading, setError } = useAppStore();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 获取所有日记和待办
        const [diaries, todos] = await Promise.all([
          getDiaries(),
          getTodos(),
        ]);
        setDiaries(diaries);
        setTodos(todos);
      } catch (err) {
        console.error('数据加载失败:', err);
        setError(err instanceof Error ? err.message : '数据加载失败，请检查网络连接');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setDiaries, setTodos, setLoading, setError]);
}
