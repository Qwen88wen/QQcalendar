import { useState, useEffect, useRef, useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { updateDiary } from '../lib/diary';
import { resolveDiaryPrices } from '../lib/pricing';
import type { DiaryStatus, DiaryTag, WorkType, UnitType } from '../types/database';
import './DiaryModal.css';

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

export function DiaryModal() {
  const {
    isModalOpen,
    selectedDiary,
    isEditing,
    closeModal,
    activeInputUser,
    updateDiary: updateDiaryInStore,
    workers: storeWorkers,
    vehicles: storeVehicles,
    customers: storeCustomers,
    workPrices,
  } = useAppStore();

  // 表单状态
  const [customer, setCustomer] = useState('');
  const [unit, setUnit] = useState<UnitType | ''>('');
  const [remark, setRemark] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [weight, setWeight] = useState('');
  const [status, setStatus] = useState<DiaryStatus>('incomplete');
  const [notified, setNotified] = useState(false);
  const [tag, setTag] = useState<DiaryTag | null>(null);
  const [manualWorkerPrice, setManualWorkerPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 工人选择状态
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const [workerSearch, setWorkerSearch] = useState('');

  // 车辆选择状态
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');

  // 园主搜索状态
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

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

  // 从 store 获取车牌列表（排序 + 过滤）
  const filteredVehicleOptions = useMemo(() => {
    const sorted = [...storeVehicles].sort((a, b) => a.plate_number.localeCompare(b.plate_number));
    if (!vehicleSearch.trim()) return sorted;
    const search = vehicleSearch.toLowerCase();
    return sorted.filter(v => v.plate_number.toLowerCase().includes(search));
  }, [storeVehicles, vehicleSearch]);

  // 从 store 获取园主列表并过滤
  const filteredCustomers = useMemo(() => {
    if (!customer.trim()) return storeCustomers;
    const search = customer.toLowerCase();
    return storeCustomers.filter(c => c.name.toLowerCase().includes(search));
  }, [storeCustomers, customer]);

  // 切换工人选择
  const toggleWorker = (w: string) => {
    setSelectedWorkers(prev =>
      prev.includes(w)
        ? prev.filter(x => x !== w)
        : [...prev, w]
    );
  };

  const normalizeSelectedWorkers = (names: string[]): string[] => {
    const seen = new Set<string>();
    const normalized: string[] = [];
    for (const name of names) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      normalized.push(trimmed);
    }
    return normalized;
  };

  // 切换车辆选择
  const toggleVehicle = (plate: string) => {
    setSelectedVehicles(prev =>
      prev.includes(plate)
        ? prev.filter(x => x !== plate)
        : [...prev, plate]
    );
  };

  // 记录当前打开的日记ID
  const currentDiaryIdRef = useRef<string | null>(null);

  // 加载已有数据 - 只在打开不同记录时重置
  useEffect(() => {
    const newDiaryId = selectedDiary?.id || null;

    // 只有在打开不同的记录时才重置表单
    if (newDiaryId !== currentDiaryIdRef.current) {
      currentDiaryIdRef.current = newDiaryId;

      if (selectedDiary) {
        setCustomer(selectedDiary.customer || '');
        const rawRemark = selectedDiary.remark || '';
        const normalizedRemark = rawRemark.trim().toUpperCase();
        const unitFromLegacy = ['TON', 'POKOK', 'EKAR', 'JOB', 'BAG', 'DAY', 'HALF DAY'].includes(normalizedRemark)
          ? normalizedRemark
          : '';
        setUnit((selectedDiary.unit as UnitType | null) || (unitFromLegacy as UnitType | ''));
        setRemark(unitFromLegacy ? '' : rawRemark);
        setWeight(selectedDiary.weight || '');
        setStatus(selectedDiary.status || 'incomplete');
        setNotified(selectedDiary.notified || false);
        setTag(selectedDiary.tag || null);
        setManualWorkerPrice(selectedDiary.worker_price == null ? '' : String(selectedDiary.worker_price));
        // 解析工人列表
        const workerFromIds = (selectedDiary.worker_ids || [])
          .map((id) => storeWorkers.find((w) => w.id === id)?.name)
          .filter((name): name is string => Boolean(name));
        const workerStr = selectedDiary.worker || '';
        const workerFromText = workerStr ? workerStr.split(',').map(w => w.trim()).filter(Boolean) : [];
        const workerList = workerFromIds.length > 0 ? workerFromIds : workerFromText;
        setSelectedWorkers(workerList);
        setWorkerSearch('');
        setShowWorkerDropdown(false);
        // 解析车辆列表
        const vehicleStr = selectedDiary.vehicle || '';
        const vehicleList = vehicleStr ? vehicleStr.split(',').map(v => v.trim()).filter(Boolean) : [];
        setSelectedVehicles(vehicleList);
        setVehicleSearch('');
        setShowVehicleDropdown(false);
      } else {
        // 新建时清空表单
        setCustomer('');
        setUnit('');
        setRemark('');
        setWeight('');
        setStatus('incomplete');
        setNotified(false);
        setTag(null);
        setManualWorkerPrice('');
        setSelectedWorkers([]);
        setWorkerSearch('');
        setShowWorkerDropdown(false);
        setSelectedVehicles([]);
        setVehicleSearch('');
        setShowVehicleDropdown(false);
      }
    }
  }, [selectedDiary, storeWorkers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 必须是编辑模式（查看已有记录）
    if (!isEditing || !selectedDiary) return;

    setIsSubmitting(true);

    // 更新操作者列表 - 添加当前用户（如果不存在）
    const currentOperators = selectedDiary.operators || [];
    const newOperators = currentOperators.includes(activeInputUser)
      ? currentOperators
      : [...currentOperators, activeInputUser];

    const normalizedCustomerName = (customer || '').trim();
    const matchedCustomer = storeCustomers.find(
      c => c.name.trim().toLowerCase() === normalizedCustomerName.toLowerCase()
    );

    if (!matchedCustomer?.salary_group_default) {
      alert('该园主未配置薪资分组，请先在主档设置后再保存。');
      setIsSubmitting(false);
      return;
    }

    const parsedQty = weight.trim() === '' ? Number.NaN : Number(weight.trim());
    const isPerWorkerType = tag === 'POISON';
    if (!isPerWorkerType && (!Number.isFinite(parsedQty) || parsedQty <= 0)) {
      alert('普通工种必须填写有效数量（大于 0）。');
      setIsSubmitting(false);
      return;
    }

    if (!unit) {
      alert('请选择单位后再保存。');
      setIsSubmitting(false);
      return;
    }

    const resolvedPrices = resolveDiaryPrices(
      tag,
      unit || null,
      remark || null,
      customer || null,
      storeCustomers,
      workPrices
    );

    const parsedManualWorkerPrice = manualWorkerPrice.trim() === ''
      ? null
      : Number(manualWorkerPrice.trim());
    const finalWorkerPrice = Number.isFinite(parsedManualWorkerPrice as number)
      ? parsedManualWorkerPrice
      : resolvedPrices.workerPrice;

    const normalizedWorkers = normalizeSelectedWorkers(selectedWorkers);
    const workerIds = normalizedWorkers
      .map((name) => storeWorkers.find((w) => w.name.trim().toLowerCase() === name.toLowerCase())?.id)
      .filter((id): id is string => Boolean(id));

    const diaryData = {
      customer: customer || null,
      unit: unit || null,
      remark: remark || null,
      worker: normalizedWorkers.length > 0 ? normalizedWorkers.join(', ') : null,
      worker_ids: workerIds.length > 0 ? workerIds : null,
      vehicle: selectedVehicles.length > 0 ? selectedVehicles.join(', ') : null,
      weight: weight || null,
      status,
      notified,
      tag,
      customer_price: resolvedPrices.customerPrice,
      worker_price: finalWorkerPrice,
      salary_group: matchedCustomer.salary_group_default,
      operators: newOperators,
    };

    console.log('[DiaryModal] 正在保存记录:', selectedDiary.id, diaryData);

    const result = await updateDiary(selectedDiary.id, diaryData);

    setIsSubmitting(false);

    if (result) {
      console.log('[DiaryModal] 保存成功');
      // 更新本地状态，实现实时更新
      updateDiaryInStore(result);
      currentDiaryIdRef.current = null; // 重置ID
      closeModal();
    } else {
      console.error('[DiaryModal] 保存失败 - 请检查网络连接或刷新页面重试');
      // 注意: updateDiary 函数已经显示了 alert，这里只记录日志
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={closeModal}>
          ×
        </button>

        <h2>{isEditing ? '查看/编辑记录' : '新增记录'}</h2>

        {/* 表单 - 所有用户都可编辑 */}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group customer-group">
              <label>园主</label>
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
                  placeholder="输入园主名称"
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
            </div>

            <div className="form-group">
              <label>通知状态</label>
              <div className="notified-options">
                <button
                  type="button"
                  className={`notified-option ${!notified ? 'active unnotified' : ''}`}
                  onClick={() => setNotified(false)}
                >
                  📞 未通知
                </button>
                <button
                  type="button"
                  className={`notified-option ${notified ? 'active notified' : ''}`}
                  onClick={() => setNotified(true)}
                >
                  ✅ 已通知
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>工作类型</label>
              <select
                value={tag || ''}
                onChange={(e) => setTag(e.target.value as DiaryTag || null)}
                className="tag-select"
              >
                <option value="">选择工作类型</option>
                {TAG_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>数量</label>
              <div className="quantity-input-group">
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="输入数量"
                  className="quantity-number"
                />
                <select
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="quantity-unit"
                >
                  <option value="">单位</option>
                  {availableUnits.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>备注</label>
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="备注（可选）"
              />
            </div>

            <div className="form-group worker-group">
              <label>工人</label>
              <div className="worker-select-container">
                <button
                  type="button"
                  className="worker-select-btn"
                  onClick={() => setShowWorkerDropdown(!showWorkerDropdown)}
                >
                  {selectedWorkers.length > 0
                    ? `已选 ${selectedWorkers.length} 人: ${selectedWorkers.slice(0, 2).join(', ')}${selectedWorkers.length > 2 ? '...' : ''}`
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
                      {sortedFilteredWorkers.map(w => (
                        <div key={w} className="worker-option">
                          <label>
                            <input
                              type="checkbox"
                              checked={selectedWorkers.includes(w)}
                              onChange={() => toggleWorker(w)}
                            />
                            <span>{w}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>工资单价（可选）</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={manualWorkerPrice}
                onChange={(e) => setManualWorkerPrice(e.target.value)}
                placeholder="留空则自动带出"
              />
            </div>

            <div className={`form-group worker-group ${selectedVehicles.length === 0 ? 'warning' : ''}`}>
              <label>
                车号
                {selectedVehicles.length === 0 && <span className="required-dot">*</span>}
              </label>
              <div className="worker-select-container">
                <button
                  type="button"
                  className={`worker-select-btn ${selectedVehicles.length === 0 ? 'input-warning' : ''}`}
                  onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
                >
                  {selectedVehicles.length > 0
                    ? `已选 ${selectedVehicles.length} 辆: ${selectedVehicles.slice(0, 2).join(', ')}${selectedVehicles.length > 2 ? '...' : ''}`
                    : '选择车号'}
                  <span className="dropdown-arrow">{showVehicleDropdown ? '▲' : '▼'}</span>
                </button>
                {showVehicleDropdown && (
                  <div className="worker-dropdown">
                    <div className="worker-dropdown-header">
                      <span>选择车号 ({selectedVehicles.length})</span>
                      <button type="button" onClick={() => setShowVehicleDropdown(false)}>✕</button>
                    </div>
                    <div className="worker-search">
                      <input
                        type="text"
                        value={vehicleSearch}
                        onChange={(e) => setVehicleSearch(e.target.value)}
                        placeholder="🔍 搜索车号..."
                        className="worker-search-input"
                      />
                    </div>
                    <div className="worker-list">
                      {filteredVehicleOptions.map(v => (
                        <div key={v.id} className="worker-option">
                          <label>
                            <input
                              type="checkbox"
                              checked={selectedVehicles.includes(v.plate_number)}
                              onChange={() => toggleVehicle(v.plate_number)}
                            />
                            <span>{v.plate_number}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {selectedVehicles.length === 0 && (
                <div className="vehicle-warning">
                  请记得填写车号！
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>割果状态</label>
            <div className="status-options">
              <button
                type="button"
                className={`status-option ${status === 'incomplete' ? 'active incomplete' : ''}`}
                onClick={() => setStatus('incomplete')}
              >
                未完成
              </button>
              <button
                type="button"
                className={`status-option ${status === 'complete' ? 'active complete' : ''}`}
                onClick={() => setStatus('complete')}
              >
                已完成
              </button>
            </div>
          </div>

          {isEditing && (
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : '保存修改'}
            </button>
          )}
        </form>

        {/* 操作记录 */}
        {selectedDiary && (
          <div className="diary-meta">
            <div className="meta-item">
              <span className="meta-label">创建时间:</span>
              <span className="meta-value">{new Date(selectedDiary.created_at).toLocaleString('zh-CN')}</span>
            </div>
            {selectedDiary.updated_at && selectedDiary.updated_at !== selectedDiary.created_at && (
              <div className="meta-item">
                <span className="meta-label">最后修改:</span>
                <span className="meta-value">{new Date(selectedDiary.updated_at).toLocaleString('zh-CN')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
