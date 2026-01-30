import { useState, useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { createDiary } from '../lib/diary';
import { getUserById } from '../lib/users';
import type { DiaryStatus, DiaryTag, WorkType, UnitType } from '../types/database';
import './InputBar.css';

// 标签选项 (工作类型)
const TAG_OPTIONS: DiaryTag[] = [
  'HARVEST',
  'PRUNNING',
  'FERTILIZE',
  'POISON',
  'SEEDLING',
  'SAND/ STONE',
  'WELDING',
  'BUILDING HOUSE',
];

// 工作类型对应的单位选项
const WORK_TYPE_UNIT_MAP: Record<WorkType, UnitType[]> = {
  'POISON': ['DAY', 'HALF DAY'],
  'FERTILIZE': ['BAG', 'EKAR', 'JOB'],
  'PRUNNING': ['EKAR', 'POKOK', 'JOB'],
  'HARVEST': ['TON'],
  'SEEDLING': ['POKOK'],
  'SAND/ STONE': ['TON', 'JOB'],
  'WELDING': ['JOB'],
  'BUILDING HOUSE': ['JOB'],
};

// 所有单位选项 (用于未选择工作类型时)
const ALL_UNIT_OPTIONS: UnitType[] = ['TON', 'POKOK', 'EKAR', 'JOB', 'BAG', 'DAY', 'HALF DAY'];

export function InputBar() {
  const {
    selectedDate,
    userId,
    userName,
    addDiary,
    workers: storeWorkers,
    vehicles: storeVehicles,
    customers: storeCustomers,
  } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // 默认收起

  // 表单字段
  const [customer, setCustomer] = useState('');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const [workerSearch, setWorkerSearch] = useState('');
  const [remark, setRemark] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [weight, setWeight] = useState('');
  const [status, setStatus] = useState<DiaryStatus>('incomplete');
  const [tag, setTag] = useState<DiaryTag | ''>('');

  // 园主搜索状态
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // 庆祝动画状态
  const [showCelebration, setShowCelebration] = useState(false);

  // 获取当前登录用户信息
  const currentUser = userId ? getUserById(userId) : null;
  const currentUsername = currentUser?.username || 'QQrou';

  // 根据选择的工作类型获取可用单位
  const availableUnits = useMemo(() => {
    if (tag && tag in WORK_TYPE_UNIT_MAP) {
      return WORK_TYPE_UNIT_MAP[tag as WorkType];
    }
    return ALL_UNIT_OPTIONS;
  }, [tag]);

  // 从 store 获取工人名称列表并排序过滤
  const sortedFilteredWorkers = useMemo(() => {
    const workerNames = storeWorkers.map(w => w.name);
    const sorted = [...workerNames].sort((a, b) => a.localeCompare(b));
    if (!workerSearch.trim()) return sorted;
    const search = workerSearch.toLowerCase();
    return sorted.filter(w => w.toLowerCase().includes(search));
  }, [storeWorkers, workerSearch]);

  // 从 store 获取车牌列表
  const vehicleOptions = useMemo(() => {
    return storeVehicles.map(v => v.plate_number);
  }, [storeVehicles]);

  // 从 store 获取园主列表并过滤
  const filteredCustomers = useMemo(() => {
    if (!customer.trim()) return storeCustomers;
    const search = customer.toLowerCase();
    return storeCustomers.filter(c => c.name.toLowerCase().includes(search));
  }, [storeCustomers, customer]);

  // 切换工人选择
  const toggleWorker = (worker: string) => {
    setSelectedWorkers(prev =>
      prev.includes(worker)
        ? prev.filter(w => w !== worker)
        : [...prev, worker]
    );
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
        weight: weight.trim() || null,
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
        setWeight('');
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
                  <th>工作类型</th>
                  <th>工人</th>
                  <th>数量</th>
                  <th>车号</th>
                  <th>状态</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="customer-cell">
                    <div className="customer-input-container">
                      <input
                        type="text"
                        value={customer}
                        onChange={(e) => {
                          setCustomer(e.target.value);
                          setShowCustomerDropdown(true);
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                        placeholder="园主"
                        disabled={isSubmitting}
                      />
                      {showCustomerDropdown && filteredCustomers.length > 0 && (
                        <div className="customer-dropdown">
                          {filteredCustomers.slice(0, 10).map(c => (
                            <div
                              key={c.id}
                              className="customer-option"
                              onClick={() => {
                                setCustomer(c.name);
                                setShowCustomerDropdown(false);
                              }}
                            >
                              {c.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
                            <span>选择工人 (A-Z)</span>
                            <button type="button" onClick={() => setShowWorkerDropdown(false)}>✕</button>
                          </div>
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
                              </div>
                            ))}
                            {sortedFilteredWorkers.length === 0 && (
                              <div className="no-workers">暂无工人数据，请在主档管理中添加</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="quantity-input-group">
                      <input
                        type="text"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="数量"
                        disabled={isSubmitting}
                        className="quantity-number"
                      />
                      <select
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        disabled={isSubmitting}
                        className="quantity-unit"
                      >
                        <option value="">单位</option>
                        {availableUnits.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td>
                    <select
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      disabled={isSubmitting}
                      className="vehicle-select"
                    >
                      <option value="">选择车号</option>
                      {vehicleOptions.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
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
