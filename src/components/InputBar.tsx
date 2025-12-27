import { useState, useMemo } from 'react';
import { useAppStore, InputUser } from '../stores/appStore';
import { createDiary } from '../lib/diary';
import { LOCAL_USERS } from '../lib/users';
import { USER_FLOWERS, getFlowerTypeByUser } from '../lib/flowers';
import type { DiaryStatus } from '../types/database';
import './InputBar.css';

export function InputBar() {
  const { activeInputUser, setActiveInputUser, diaries, selectedDate } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 表单字段
  const [customer, setCustomer] = useState('');
  const [worker, setWorker] = useState('');
  const [remark, setRemark] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [status, setStatus] = useState<DiaryStatus>('incomplete');

  // 庆祝动画状态
  const [showCelebration, setShowCelebration] = useState(false);

  // 获取当前查看日期的记录
  const viewDate = selectedDate || new Date();
  const viewDateRecords = useMemo(() => {
    const dateStr = viewDate.toDateString();
    return diaries.filter(d => new Date(d.created_at).toDateString() === dateStr);
  }, [diaries, viewDate]);

  // 格式化日期标题
  const formatViewDate = () => {
    const today = new Date();
    if (viewDate.toDateString() === today.toDateString()) {
      return '今日';
    }
    return `${viewDate.getMonth() + 1}月${viewDate.getDate()}日`;
  };

  const handleUserSwitch = (user: InputUser) => {
    setActiveInputUser(user);
  };

  const handleSubmit = async () => {
    if (!customer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const user = LOCAL_USERS.find(u => u.username === activeInputUser);

      // 使用选中的日期，如果没有选中则使用今天
      const targetDate = selectedDate || new Date();
      // 设置为当天的中午12点，避免时区问题
      const createdAt = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        12, 0, 0
      ).toISOString();

      const newDiary = await createDiary({
        user_id: user?.id || `user-${activeInputUser.toLowerCase()}`,
        user_name: user?.displayName || activeInputUser,
        customer: customer.trim(),
        worker: worker.trim() || null,
        remark: remark.trim() || null,
        vehicle: vehicle.trim() || null,
        status,
        flower_type: getFlowerTypeByUser(activeInputUser),
        operators: [activeInputUser],  // 初始操作者
        created_at: createdAt,  // 使用选中的日期
      });

      if (newDiary) {
        // 不手动添加，让 realtime 订阅处理
        // 清空表单
        setCustomer('');
        setWorker('');
        setRemark('');
        setVehicle('');
        setStatus('incomplete');

        // 显示庆祝动画
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }
    } catch (error) {
      console.error('Failed to create diary:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`input-bar ${isExpanded ? 'expanded' : ''}`}>
      {/* 添加记录庆祝动画 */}
      {showCelebration && (
        <div className="add-celebration-overlay">
          <div className="add-celebration-content">
            <img
              src="/receive.gif"
              alt="收到！"
              className="add-celebration-gif"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="add-celebration-text">记录添加成功！🎉</div>
          </div>
        </div>
      )}

      {/* 用户切换 */}
      <div className="user-switcher">
        {LOCAL_USERS.map((user) => {
          const flower = USER_FLOWERS[user.username];
          return (
            <button
              key={user.id}
              className={`user-btn ${user.username.toLowerCase()} ${activeInputUser === user.username ? 'active' : ''}`}
              onClick={() => handleUserSwitch(user.username as InputUser)}
            >
              <span className="user-icon">{flower?.icon || '🌸'}</span>
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

      {/* 当日记录表格 */}
      {isExpanded && viewDateRecords.length > 0 && (
        <div className="today-records">
          <h4>{formatViewDate()}记录 ({viewDateRecords.length})</h4>
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
                {viewDateRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{record.customer || '-'}</td>
                    <td>{record.worker || '-'}</td>
                    <td>{record.remark || '-'}</td>
                    <td className={!record.vehicle ? 'needs-vehicle' : ''}>
                      {record.vehicle || '-'}
                      {!record.vehicle && <span className="vehicle-warning-dot"></span>}
                    </td>
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
