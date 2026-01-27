import { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { createDiary } from '../lib/diary';
import { getUserById } from '../lib/users';
import type { DiaryStatus } from '../types/database';
import './InputBar.css';

export function InputBar() {
  const { selectedDate, userId, userName } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // 默认收起

  // 表单字段
  const [customer, setCustomer] = useState('');
  const [worker, setWorker] = useState('');
  const [remark, setRemark] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [status, setStatus] = useState<DiaryStatus>('incomplete');

  // 庆祝动画状态
  const [showCelebration, setShowCelebration] = useState(false);

  // 获取当前登录用户信息
  const currentUser = userId ? getUserById(userId) : null;
  const currentUsername = currentUser?.username || 'QQrou';

  const handleSubmit = async () => {
    if (!customer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {

      // 使用选中的日期，如果没有选中则使用今天
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const targetDate = selectedDate || today;

      let createdAt: string;
      // 如果是今天，使用当前实际时间；如果是其他日期，使用中午12点
      if (targetDate.getTime() === today.getTime()) {
        createdAt = now.toISOString();
      } else {
        createdAt = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate(),
          12, 0, 0
        ).toISOString();
      }

      const newDiary = await createDiary({
        user_id: currentUser?.id || userId || 'unknown',
        user_name: userName || currentUsername,
        customer: customer.trim(),
        worker: worker.trim() || null,
        remark: remark.trim() || null,
        vehicle: vehicle.trim() || null,
        status,
        operators: [currentUsername],  // 初始操作者
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
    <div className={`input-bar ${isExpanded ? 'expanded' : 'collapsed'}`}>
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
            <div className="add-celebration-text">{userName || currentUsername} 添加记录成功！🎉</div>
          </div>
        </div>
      )}

      {/* 展开/收起按钮 */}
      <button
        className="toggle-btn"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? '收起' : '展开添加记录'}
      >
        <span className="toggle-icon">{isExpanded ? '▼' : '▲'}</span>
        <span className="toggle-text">{isExpanded ? '收起' : '➕ 添加记录'}</span>
      </button>

      {/* 展开时显示的内容 */}
      {isExpanded && (
        <>
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
        </>
      )}
    </div>
  );
}
