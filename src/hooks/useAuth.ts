import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getProfile, getDiaries } from '../lib/diary';
import { useAppStore } from '../stores/appStore';

export function useAuth() {
  const { setUser, setProfile, setDiaries, setLoading } = useAppStore();

  useEffect(() => {
    // 获取当前会话
    const initAuth = async () => {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user.id, session.user.email ?? null);

        // 获取用户角色
        const profile = await getProfile(session.user.id);
        setProfile(profile);
      }

      // 获取所有日记
      const diaries = await getDiaries();
      setDiaries(diaries);

      setLoading(false);
    };

    initAuth();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user.id, session.user.email ?? null);
          const profile = await getProfile(session.user.id);
          setProfile(profile);
        } else {
          setUser(null, null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setDiaries, setLoading]);
}
