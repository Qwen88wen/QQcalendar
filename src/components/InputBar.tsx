import { useState, useMemo } from 'react';
import { useAppStore, InputUser } from '../stores/appStore';
import { createDiary } from '../lib/diary';
import { LOCAL_USERS } from '../lib/users';
import type { FlowerType, DiaryStatus } from '../types/database';
import './InputBar.css';

// 用户花朵配置
const USER_FLOWER_CONFIG: Record<string, { icon: string; flowerType: FlowerType }> = {
  'QQrou': { icon: '🪻', flowerType: 3 },
  'QQfang': { icon: '🌹', flowerType: 1 },
  'QQwen': { icon: '🌸', flowerType: 4 },
};

export function InputBar() {
  const { activeInputUser, setActiveInputUser, diaries } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 表单字段
  const [customer, setCustomer] = useState('');
  const [worker, setWorker] = useState('');
  const [remark, setRemark] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [status, setStatus] = useState<DiaryStatus>('incomplete');

  // 获取今天的记录
  const todayRecords = useMemo(() => {
    const today = new Date().toDateString();
    return diaries.filter(d => new Date(d.created_at).toDateString() === today);
  }, [diaries]);

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
        worker: worker.trim() || null,
        remark: remark.trim() || null,
        vehicle: vehicle.trim() || null,
        status,
        flower_type: config?.flowerType || 1 as FlowerType,
      });

      if (newDiary) {
        // 不手动添加，让 realtime 订阅处理
        // 清空表单
        setCustomer('');
        setWorker('');
        setRemark('');
        setVehicle('');
        setStatus('incomplete');
      }
    } catch (error) {
      console.error('Failed to create diary:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`input-bar ${isExpanded ? 'expanded' : ''}`}>
      {/* 用户切换 */}
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
        <button
          className="expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '收起 ▼' : '展开 ▲'}
        </button>
      </div>

      {/* 今日记录表格 */}
      {isExpanded && todayRecords.length > 0 && (
        <div className="today-records">
          <h4>今日记录 ({todayRecords.length})</h4>
          <div className="records-table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th>园主</th>
                  <th>工人</th>
                  <th>备注</th>
                  <th>车号</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {todayRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{record.customer || '-'}</td>
                    <td>{record.worker || '-'}</td>
                    <td>{record.remark || '-'}</td>
                    <td>{record.vehicle || '-'}</td>
                    <td>
                      <span className={`status-badge ${record.status}`}>
                        {record.status === 'complete' ? '完成' : '未完成'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 输入表格 */}
      <div className="input-table">
        <table>
          <thead>
            <tr>
              <th>园主 *</th>
              <th>工人</th>
              <th>备注</th>
              <th>车号</th>
              <th>状态</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="园主"
                  disabled={isSubmitting}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={worker}
                  onChange={(e) => setWorker(e.target.value)}
                  placeholder="工人"
                  disabled={isSubmitting}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="备注"
                  disabled={isSubmitting}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  placeholder="车号"
                  disabled={isSubmitting}
                />
              </td>
              <td>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DiaryStatus)}
                  disabled={isSubmitting}
                >
                  <option value="incomplete">未完成</option>
                  <option value="complete">已完成</option>
                </select>
              </td>
              <td>
                <button
                  className="add-btn"
                  onClick={handleSubmit}
                  disabled={!customer.trim() || isSubmitting}
                >
                  {isSubmitting ? '...' : '🌱 添加'}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
