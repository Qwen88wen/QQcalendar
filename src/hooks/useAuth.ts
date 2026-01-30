import { useEffect } from 'react';
import { getDiaries, getTodos } from '../lib/diary';
import { getActiveCustomers } from '../lib/customers';
import { getActiveWorkers } from '../lib/workers';
import { getActiveVehicles } from '../lib/vehicles';
import { getAllWorkPrices } from '../lib/workPrices';
import { useAppStore } from '../stores/appStore';

export function useAuth() {
  const {
    setDiaries,
    setTodos,
    setLoading,
    setError,
    setCustomers,
    setWorkers,
    setVehicles,
    setWorkPrices,
  } = useAppStore();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 获取所有日记、待办和主档数据
        const [diaries, todos, customers, workers, vehicles, workPrices] = await Promise.all([
          getDiaries(),
          getTodos(),
          getActiveCustomers(),
          getActiveWorkers(),
          getActiveVehicles(),
          getAllWorkPrices(),
        ]);
        setDiaries(diaries);
        setTodos(todos);
        setCustomers(customers);
        setWorkers(workers);
        setVehicles(vehicles);
        setWorkPrices(workPrices);
      } catch (err) {
        console.error('数据加载失败:', err);
        setError(err instanceof Error ? err.message : '数据加载失败，请检查网络连接');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setDiaries, setTodos, setLoading, setError, setCustomers, setWorkers, setVehicles, setWorkPrices]);
}
