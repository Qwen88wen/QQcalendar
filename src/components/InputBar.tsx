import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { createDiary } from '../lib/diary';
import { getUserById } from '../lib/users';
import type { DiaryStatus, DiaryTag } from '../types/database';
import './InputBar.css';

// 标签选项
const TAG_OPTIONS: DiaryTag[] = [
  'HARVEST',
  'PRUNNING',
  'FERTILIZE',
  'POISON',
  'SEEDLING',
  'STONE',
  'SAND',
  'VENDING',
  'BUILDING HOUSE',
];

// 默认工人列表
const DEFAULT_WORKERS = [
  'RUDI',
  'KURNIADI',
  'KARIADI',
  'BOHANUDIN',
  'SUKERI',
  'NASAR',
  'HAR',
  'RASID',
  'NURMAN',
  'AMAT',
  'NURSAN',
  'MAWARDI',
  'MAHIRUN',
  'ISMARYADI',
  'MURTI',
  'JUHARDI',
  'CHAIRUL',
  'TARSIMUN',
  'SUPANDI',
  'LANI',
  'EDI',
  'MISNO',
  'IHAP',
  'ZAENUDIN',
];

// localStorage key
const WORKERS_STORAGE_KEY = 'qq-calendar-workers';

// 从 localStorage 获取工人列表
function getStoredWorkers(): string[] {
  try {
    const stored = localStorage.getItem(WORKERS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load workers from localStorage:', e);
  }
  return DEFAULT_WORKERS;
}

// 保存工人列表到 localStorage
function saveWorkers(workers: string[]) {
  try {
    localStorage.setItem(WORKERS_STORAGE_KEY, JSON.stringify(workers));
  } catch (e) {
    console.error('Failed to save workers to localStorage:', e);
  }
}

export function InputBar() {
  const { selectedDate, userId, userName, addDiary } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // 默认收起

  // 表单字段
  const [customer, setCustomer] = useState('');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const [workerSearch, setWorkerSearch] = useState('');
  const [remark, setRemark] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [status, setStatus] = useState<DiaryStatus>('incomplete');
  const [tag, setTag] = useState<DiaryTag | ''>('');

  // 工人列表管理
  const [workers, setWorkers] = useState<string[]>(DEFAULT_WORKERS);
  const [showWorkerManager, setShowWorkerManager] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');

  // 庆祝动画状态
  const [showCelebration, setShowCelebration] = useState(false);

  // 获取当前登录用户信息
  const currentUser = userId ? getUserById(userId) : null;
  const currentUsername = currentUser?.username || 'QQrou';

  // 加载工人列表
  useEffect(() => {
    setWorkers(getStoredWorkers());
  }, []);

  // 排序并过滤工人列表 (A-Z排序 + 搜索过滤)
  const sortedFilteredWorkers = useMemo(() => {
    const sorted = [...workers].sort((a, b) => a.localeCompare(b));
    if (!workerSearch.trim()) return sorted;
    const search = workerSearch.toLowerCase();
    return sorted.filter(w => w.toLowerCase().includes(search));
  }, [workers, workerSearch]);

  // 切换工人选择
  const toggleWorker = (worker: string) => {
    setSelectedWorkers(prev =>
      prev.includes(worker)
        ? prev.filter(w => w !== worker)
        : [...prev, worker]
    );
  };

  // 添加新工人
  const addWorker = () => {
    const name = newWorkerName.trim().toUpperCase();
    if (name && !workers.includes(name)) {
      const newWorkers = [...workers, name];
      setWorkers(newWorkers);
      saveWorkers(newWorkers);
      setNewWorkerName('');
    }
  };

  // 删除工人
  const removeWorker = (worker: string) => {
    const newWorkers = workers.filter(w => w !== worker);
    setWorkers(newWorkers);
    saveWorkers(newWorkers);
    // 同时从已选中移除
    setSelectedWorkers(prev => prev.filter(w => w !== worker));
  };

  // 重置为默认列表
  const resetWorkers = () => {
    if (confirm('确定要恢复默认工人列表吗？')) {
      setWorkers(DEFAULT_WORKERS);
      saveWorkers(DEFAULT_WORKERS);
      setSelectedWorkers([]);
    }
  };

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
        worker: selectedWorkers.length > 0 ? selectedWorkers.join(', ') : null,
        remark: remark.trim() || null,
        vehicle: vehicle.trim() || null,
        status,
        tag: tag || null,
        operators: [currentUsername],  // 初始操作者
        created_at: createdAt,  // 使用选中的日期
      });

      if (newDiary) {
        // 立即更新本地状态，实现实时更新
        addDiary(newDiary);
        // 清空表单
        setCustomer('');
        setSelectedWorkers([]);
        setWorkerSearch('');
        setRemark('');
        setVehicle('');
        setStatus('incomplete');
        setTag('');

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
                  <th>标签</th>
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
                    <select
                      value={tag}
                      onChange={(e) => setTag(e.target.value as DiaryTag | '')}
                      disabled={isSubmitting}
                      className="tag-select"
                    >
                      <option value="">选择标签</option>
                      {TAG_OPTIONS.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </td>
                  <td className="worker-cell">
                    <div className="worker-select-container">
                      <button
                        type="button"
                        className="worker-select-btn"
                        onClick={() => setShowWorkerDropdown(!showWorkerDropdown)}
                        disabled={isSubmitting}
                      >
                        {selectedWorkers.length > 0
                          ? `已选 ${selectedWorkers.length} 人`
                          : '选择工人'}
                        <span className="dropdown-arrow">{showWorkerDropdown ? '▲' : '▼'}</span>
                      </button>
                      {showWorkerDropdown && (
                        <div className="worker-dropdown">
                          <div className="worker-dropdown-header">
                            <span>选择工人</span>
                            <button
                              type="button"
                              className="manage-workers-btn"
                              onClick={() => setShowWorkerManager(!showWorkerManager)}
                            >
                              {showWorkerManager ? '完成' : '✏️ 编辑'}
                            </button>
                          </div>
                          {showWorkerManager && (
                            <div className="worker-manager">
                              <div className="add-worker-row">
                                <input
                                  type="text"
                                  value={newWorkerName}
                                  onChange={(e) => setNewWorkerName(e.target.value)}
                                  placeholder="输入新工人名字"
                                  onKeyDown={(e) => e.key === 'Enter' && addWorker()}
                                />
                                <button type="button" onClick={addWorker}>➕</button>
                              </div>
                              <button type="button" className="reset-btn" onClick={resetWorkers}>
                                🔄 恢复默认
                              </button>
                            </div>
                          )}
                          <div className="worker-search">
                            <input
                              type="text"
                              value={workerSearch}
                              onChange={(e) => setWorkerSearch(e.target.value)}
                              placeholder="🔍 搜索工人..."
                              className="worker-search-input"
                            />
                          </div>
                          <div className="worker-list">
                            {sortedFilteredWorkers.map(worker => (
                              <div key={worker} className="worker-option">
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={selectedWorkers.includes(worker)}
                                    onChange={() => toggleWorker(worker)}
                                  />
                                  <span>{worker}</span>
                                </label>
                                {showWorkerManager && (
                                  <button
                                    type="button"
                                    className="delete-worker-btn"
                                    onClick={() => removeWorker(worker)}
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
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
