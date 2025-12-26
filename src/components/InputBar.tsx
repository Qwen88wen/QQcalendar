import { useState } from 'react';
import { useAppStore, InputUser } from '../stores/appStore';
import { createDiary } from '../lib/diary';
import './InputBar.css';

export function InputBar() {
  const { activeInputUser, setActiveInputUser, addDiary } = useAppStore();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUserSwitch = (user: InputUser) => {
    setActiveInputUser(user);
  };

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 根据选中用户确定 flower_type
      const flowerType = activeInputUser === 'QQrou' ? 3 : 1; // 薰衣草 or 玫瑰

      const newDiary = await createDiary({
        user_id: `user-${activeInputUser.toLowerCase()}`,
        user_name: activeInputUser,
        content: content.trim(),
        flower_type: flowerType,
      });

      if (newDiary) {
        addDiary(newDiary);
        setContent('');
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
        <button
          className={`user-btn qqrou ${activeInputUser === 'QQrou' ? 'active' : ''}`}
          onClick={() => handleUserSwitch('QQrou')}
        >
          <span className="user-icon">🪻</span>
          <span className="user-name">QQrou</span>
        </button>
        <button
          className={`user-btn qqfang ${activeInputUser === 'QQfang' ? 'active' : ''}`}
          onClick={() => handleUserSwitch('QQfang')}
        >
          <span className="user-icon">🌹</span>
          <span className="user-name">QQfang</span>
        </button>
      </div>

      <div className="input-area">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="写点什么，种一朵花..."
          rows={1}
          disabled={isSubmitting}
        />
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? '🌱' : '🌱 种花'}
        </button>
      </div>
    </div>
  );
}
