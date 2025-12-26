import { useEffect } from 'react';
import { getDiaries } from '../lib/diary';
import { useAppStore } from '../stores/appStore';

export function useAuth() {
  const { setDiaries, setLoading } = useAppStore();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // 获取所有日记
      const diaries = await getDiaries();
      setDiaries(diaries);

      setLoading(false);
    };

    loadData();
  }, [setDiaries, setLoading]);
}
