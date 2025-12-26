import { useState } from 'react';
import { useAppStore, InputUser } from '../stores/appStore';
import { createDiary } from '../lib/diary';
import { LOCAL_USERS } from '../lib/users';
import type { FlowerType } from '../types/database';
import './InputBar.css';

// 用户花朵配置
const USER_FLOWER_CONFIG: Record<string, { icon: string; flowerType: FlowerType }> = {
  'QQrou': { icon: '🪻', flowerType: 3 },   // 薰衣草
  'QQfang': { icon: '🌹', flowerType: 1 },  // 玫瑰
  'QQwen': { icon: '🌸', flowerType: 4 },   // 樱花
};

export function InputBar() {
  const { activeInputUser, setActiveInputUser, addDiary } = useAppStore();
  const [customer, setCustomer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUserSwitch = (user: InputUser) => {
    setActiveInputUser(user);
  };

  const handleSubmit = async () => {
    if (!customer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const config = USER_FLOWER_CONFIG[activeInputUser];
      const user = LOCAL_USERS.find(u => u.username === activeInputUser);

      const newDiary = await createDiary({
        user_id: user?.id || `user-${activeInputUser.toLowerCase()}`,
        user_name: user?.displayName || activeInputUser,
        customer: customer.trim(),
        status: 'incomplete',
        flower_type: config?.flowerType || 1 as FlowerType,
      });

      if (newDiary) {
        addDiary(newDiary);
        setCustomer('');
      }
    } catch (error) {
      console.error('Failed to create diary:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="input-bar">
      <div className="user-switcher">
        {LOCAL_USERS.map((user) => {
          const config = USER_FLOWER_CONFIG[user.username];
          return (
            <button
              key={user.id}
              className={`user-btn ${user.username.toLowerCase()} ${activeInputUser === user.username ? 'active' : ''}`}
              onClick={() => handleUserSwitch(user.username as InputUser)}
            >
              <span className="user-icon">{config?.icon || '🌸'}</span>
              <span className="user-name">{user.displayName}</span>
            </button>
          );
        })}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入园主名称..."
          disabled={isSubmitting}
        />
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={!customer.trim() || isSubmitting}
        >
          {isSubmitting ? '🌱' : '🌱 种花'}
        </button>
      </div>
    </div>
  );
}
