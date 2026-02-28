import { useState, useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { createDiary } from '../lib/diary';
import { resolveDiaryPrices } from '../lib/pricing';
import { getUserById } from '../lib/users';
import type { DiaryStatus, DiaryTag, UnitType, WorkType } from '../types/database';
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
    workPrices,
  } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 表单字段
  const [customer, setCustomer] = useState('');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [remark, setRemark] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [weight, setWeight] = useState('');
  const [status, setStatus] = useState<DiaryStatus>('incomplete');
  const [notified, setNotified] = useState(false);
  const [tag, setTag] = useState<DiaryTag | ''>('');

  // 下拉框显示状态
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);

  // 搜索状态
  const [customerSearch, setCustomerSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [workerSearch, setWorkerSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');

  // 庆祝动画状态
  const [showCelebration, setShowCelebration] = useState(false);

  // 获取当前登录用户信息
  const currentUser = userId ? getUserById(userId) : null;
  const currentUsername = currentUser?.username || 'QQrou';

  // 过滤园主列表
  const filteredCustomers = useMemo(() => {
    const sorted = [...storeCustomers].sort((a, b) => (a.code || '').localeCompare(b.code || ''));
    if (!customerSearch.trim()) return sorted;
    const search = customerSearch.toLowerCase();
    return sorted.filter(c =>
      c.name.toLowerCase().includes(search) ||
      (c.code && c.code.toLowerCase().includes(search))
    );
  }, [storeCustomers, customerSearch]);

  // 过滤工作类型
  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) return TAG_OPTIONS;
    const search = tagSearch.toLowerCase();
    return TAG_OPTIONS.filter(t => t.toLowerCase().includes(search));
  }, [tagSearch]);

  // 过滤工人列表
  const filteredWorkers = useMemo(() => {
    const sorted = [...storeWorkers].sort((a, b) => (a.code || '').localeCompare(b.code || ''));
    if (!workerSearch.trim()) return sorted;
    const search = workerSearch.toLowerCase();
    return sorted.filter(w =>
      w.name.toLowerCase().includes(search) ||
      (w.code && w.code.toLowerCase().includes(search))
    );
  }, [storeWorkers, workerSearch]);

  // 过滤车辆列表
  const filteredVehicles = useMemo(() => {
    const sorted = [...storeVehicles].sort((a, b) => a.plate_number.localeCompare(b.plate_number));
    if (!vehicleSearch.trim()) return sorted;
    const search = vehicleSearch.toLowerCase();
    return sorted.filter(v => v.plate_number.toLowerCase().includes(search));
  }, [storeVehicles, vehicleSearch]);

  // 根据工作类型获取可选单位
  const availableUnits = useMemo(() => {
    if (tag && tag in WORK_TYPE_UNIT_MAP) {
      return WORK_TYPE_UNIT_MAP[tag as WorkType];
    }

    return ALL_UNIT_OPTIONS;
  }, [tag]);

  // 切换工人选择
  const toggleWorker = (workerName: string) => {
    setSelectedWorkers(prev =>
      prev.includes(workerName)
        ? prev.filter(w => w !== workerName)
        : [...prev, workerName]
    );
  };

  // 切换车辆选择
  const toggleVehicle = (plate: string) => {
    setSelectedVehicles(prev =>
      prev.includes(plate)
        ? prev.filter(v => v !== plate)
        : [...prev, plate]
    );
  };

  // 关闭所有下拉框
  const closeAllDropdowns = () => {
    setShowCustomerDropdown(false);
    setShowTagDropdown(false);
    setShowWorkerDropdown(false);
    setShowVehicleDropdown(false);
  };

  const handleSubmit = async () => {
    if (!customer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const targetDate = selectedDate || today;

      let createdAt: string;
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

      const normalizedCustomerName = customer.trim();
      const matchedCustomer = storeCustomers.find(
        c => c.name.trim().toLowerCase() === normalizedCustomerName.toLowerCase()
      );

      const resolvedPrices = resolveDiaryPrices(
        tag || null,
        remark.trim() || null,
        normalizedCustomerName,
        storeCustomers,
        workPrices
      );

      const newDiary = await createDiary({
        user_id: currentUser?.id || userId || 'unknown',
        user_name: userName || currentUsername,
        customer: normalizedCustomerName,
        worker: selectedWorkers.length > 0 ? selectedWorkers.join(', ') : null,
        remark: remark.trim() || null,
        vehicle: selectedVehicles.length > 0 ? selectedVehicles.join(', ') : null,
        weight: weight.trim() || null,
        status,
        notified,
        tag: tag || null,
        customer_price: resolvedPrices.customerPrice,
        worker_price: resolvedPrices.workerPrice,
        customer_id: matchedCustomer?.id || null,
        salary_group: matchedCustomer?.salary_group_default || 'TongHuat',
        operators: [currentUsername],
        created_at: createdAt,
      });

      if (newDiary) {
        addDiary(newDiary);
        setCustomer('');
        setSelectedWorkers([]);
        setSelectedVehicles([]);
        setCustomerSearch('');
        setWorkerSearch('');
        setTagSearch('');
        setVehicleSearch('');
        setRemark('');
        setWeight('');
        setStatus('incomplete');
        setNotified(false);
        setTag('');
        closeAllDropdowns();

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
      {/* 庆祝动画 */}
      {showCelebration && (
        <div className="add-celebration-overlay">
          <div className="add-celebration-content">
            <img src="/receive.gif" alt="收到！" className="add-celebration-gif"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="add-celebration-text">{userName || currentUsername} 添加记录成功！</div>
          </div>
        </div>
      )}

      {/* 展开/收起按钮 */}
      <button className="toggle-btn" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="toggle-icon">{isExpanded ? '▼' : '▲'}</span>
        <span className="toggle-text">{isExpanded ? '收起' : '添加记录'}</span>
      </button>

      {/* 展开时显示的内容 */}
      {isExpanded && (
        <div className="input-content">
          {/* 第一行：主要输入字段 */}
          <div className="input-row">
            {/* 园主选择 */}
          <div className="input-field customer-field">
            <label>园主 *</label>
            <div className="dropdown-container">
              <button
                type="button"
                className="dropdown-btn"
                onClick={() => { closeAllDropdowns(); setShowCustomerDropdown(!showCustomerDropdown); }}
                disabled={isSubmitting}
              >
                <span className="dropdown-btn-text">
                  {customer || '选择园主'}
                </span>
                <span className="dropdown-arrow">{showCustomerDropdown ? '▲' : '▼'}</span>
              </button>
              {showCustomerDropdown && (
                <div className="dropdown-panel">
                  <div className="dropdown-header">
                    <span>选择园主</span>
                    <button type="button" onClick={() => setShowCustomerDropdown(false)}>✕</button>
                  </div>
                  <div className="dropdown-search">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="搜索园主..."
                      autoFocus
                    />
                  </div>
                  <div className="dropdown-list">
                    {filteredCustomers.map(c => (
                      <div
                        key={c.id}
                        className={`dropdown-option ${customer === c.name ? 'selected' : ''}`}
                        onClick={() => { setCustomer(c.name); setShowCustomerDropdown(false); }}
                      >
                        {c.code && <span className="option-code">{c.code}</span>}
                        <span className="option-name">{c.name}</span>
                      </div>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <div className="dropdown-empty">无匹配结果</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 工作类型选择 */}
          <div className="input-field tag-field">
            <label>工作类型</label>
            <div className="dropdown-container">
              <button
                type="button"
                className="dropdown-btn"
                onClick={() => { closeAllDropdowns(); setShowTagDropdown(!showTagDropdown); }}
                disabled={isSubmitting}
              >
                <span className="dropdown-btn-text">{tag || '选择类型'}</span>
                <span className="dropdown-arrow">{showTagDropdown ? '▲' : '▼'}</span>
              </button>
              {showTagDropdown && (
                <div className="dropdown-panel">
                  <div className="dropdown-header">
                    <span>选择工作类型</span>
                    <button type="button" onClick={() => setShowTagDropdown(false)}>✕</button>
                  </div>
                  <div className="dropdown-search">
                    <input
                      type="text"
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      placeholder="搜索类型..."
                      autoFocus
                    />
                  </div>
                  <div className="dropdown-list">
                    {filteredTags.map(t => (
                      <div
                        key={t}
                        className={`dropdown-option ${tag === t ? 'selected' : ''}`}
                        onClick={() => { setTag(t); setShowTagDropdown(false); }}
                      >
                        <span className="option-name">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 工人选择 */}
          <div className="input-field worker-field">
            <label>工人</label>
            <div className="dropdown-container">
              <button
                type="button"
                className="dropdown-btn"
                onClick={() => { closeAllDropdowns(); setShowWorkerDropdown(!showWorkerDropdown); }}
                disabled={isSubmitting}
              >
                <span className="dropdown-btn-text">
                  {selectedWorkers.length > 0 ? `已选 ${selectedWorkers.length} 人` : '选择工人'}
                </span>
                <span className="dropdown-arrow">{showWorkerDropdown ? '▲' : '▼'}</span>
              </button>
              {showWorkerDropdown && (
                <div className="dropdown-panel">
                  <div className="dropdown-header">
                    <span>选择工人 ({selectedWorkers.length})</span>
                    <button type="button" onClick={() => setShowWorkerDropdown(false)}>✕</button>
                  </div>
                  <div className="dropdown-search">
                    <input
                      type="text"
                      value={workerSearch}
                      onChange={(e) => setWorkerSearch(e.target.value)}
                      placeholder="搜索工人..."
                      autoFocus
                    />
                  </div>
                  <div className="dropdown-list">
                    {filteredWorkers.map(w => (
                      <div key={w.id} className="dropdown-option checkbox-option">
                        <label>
                          <input
                            type="checkbox"
                            checked={selectedWorkers.includes(w.name)}
                            onChange={() => toggleWorker(w.name)}
                          />
                          {w.code && <span className="option-code">{w.code}</span>}
                          <span className="option-name">{w.name}</span>
                        </label>
                      </div>
                    ))}
                    {filteredWorkers.length === 0 && (
                      <div className="dropdown-empty">无匹配结果</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 数量 */}
          <div className="input-field quantity-field">
            <label>数量</label>
            <div className="quantity-group">
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="数量"
                disabled={isSubmitting}
                className="quantity-input"
              />
              <select
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                disabled={isSubmitting}
                className="unit-select"
              >
                <option value="">单位/备注</option>
                {availableUnits.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 车号选择 */}
          <div className="input-field vehicle-field">
            <label>车号</label>
            <div className="dropdown-container">
              <button
                type="button"
                className="dropdown-btn"
                onClick={() => { closeAllDropdowns(); setShowVehicleDropdown(!showVehicleDropdown); }}
                disabled={isSubmitting}
              >
                <span className="dropdown-btn-text">
                  {selectedVehicles.length > 0 ? `已选 ${selectedVehicles.length} 辆` : '选择车号'}
                </span>
                <span className="dropdown-arrow">{showVehicleDropdown ? '▲' : '▼'}</span>
              </button>
              {showVehicleDropdown && (
                <div className="dropdown-panel">
                  <div className="dropdown-header">
                    <span>选择车号 ({selectedVehicles.length})</span>
                    <button type="button" onClick={() => setShowVehicleDropdown(false)}>✕</button>
                  </div>
                  <div className="dropdown-search">
                    <input
                      type="text"
                      value={vehicleSearch}
                      onChange={(e) => setVehicleSearch(e.target.value)}
                      placeholder="搜索车号..."
                      autoFocus
                    />
                  </div>
                  <div className="dropdown-list">
                    {filteredVehicles.map(v => (
                      <div key={v.id} className="dropdown-option checkbox-option">
                        <label>
                          <input
                            type="checkbox"
                            checked={selectedVehicles.includes(v.plate_number)}
                            onChange={() => toggleVehicle(v.plate_number)}
                          />
                          <span className="option-name">{v.plate_number}</span>
                        </label>
                      </div>
                    ))}
                    {filteredVehicles.length === 0 && (
                      <div className="dropdown-empty">无匹配结果</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>

          {/* 第二行：状态和提交 */}
          <div className="input-row status-row">
            {/* 通知状态 */}
            <div className="input-field status-field">
              <label>通知状态</label>
              <div className="status-toggle">
                <button
                  type="button"
                  className={`status-btn ${!notified ? 'active unnotified' : ''}`}
                  onClick={() => setNotified(false)}
                  disabled={isSubmitting}
                >
                  📞 未通知
                </button>
                <button
                  type="button"
                  className={`status-btn ${notified ? 'active notified' : ''}`}
                  onClick={() => setNotified(true)}
                  disabled={isSubmitting}
                >
                  ✅ 已通知
                </button>
              </div>
            </div>

            {/* 割果状态 */}
            <div className="input-field status-field">
              <label>割果状态</label>
              <div className="status-toggle">
                <button
                  type="button"
                  className={`status-btn ${status === 'incomplete' ? 'active incomplete' : ''}`}
                  onClick={() => setStatus('incomplete')}
                  disabled={isSubmitting}
                >
                  未完成
                </button>
                <button
                  type="button"
                  className={`status-btn ${status === 'complete' ? 'active complete' : ''}`}
                  onClick={() => setStatus('complete')}
                  disabled={isSubmitting}
                >
                  已完成
                </button>
              </div>
            </div>

            {/* 添加按钮 */}
            <div className="input-field submit-field">
              <button
                className="add-btn"
                onClick={handleSubmit}
                disabled={!customer.trim() || isSubmitting}
              >
                {isSubmitting ? '提交中...' : '🌱 添加记录'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
