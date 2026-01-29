import { useState, useEffect, useRef, useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { updateDiary } from '../lib/diary';
import type { DiaryStatus, DiaryTag } from '../types/database';
import './DiaryModal.css';

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
  'RUDI', 'KURNIADI', 'KARIADI', 'BOHANUDIN', 'SUKERI', 'NASAR',
  'HAR', 'RASID', 'NURMAN', 'AMAT', 'NURSAN', 'MAWARDI',
  'MAHIRUN', 'ISMARYADI', 'MURTI', 'JUHARDI', 'CHAIRUL', 'TARSIMUN',
  'SUPANDI', 'LANI', 'EDI', 'MISNO', 'IHAP', 'ZAENUDIN',
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

export function DiaryModal() {
  const {
    isModalOpen,
    selectedDiary,
    isEditing,
    closeModal,
    activeInputUser,
    updateDiary: updateDiaryInStore,
  } = useAppStore();

  // 表单状态
  const [customer, setCustomer] = useState('');
  const [remark, setRemark] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [status, setStatus] = useState<DiaryStatus>('incomplete');
  const [notified, setNotified] = useState(false);
  const [tag, setTag] = useState<DiaryTag | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 工人选择状态
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const [workerSearch, setWorkerSearch] = useState('');
  const [workers] = useState<string[]>(getStoredWorkers());

  // 排序并过滤工人列表 (A-Z排序 + 搜索过滤)
  const sortedFilteredWorkers = useMemo(() => {
    const sorted = [...workers].sort((a, b) => a.localeCompare(b));
    if (!workerSearch.trim()) return sorted;
    const search = workerSearch.toLowerCase();
    return sorted.filter(w => w.toLowerCase().includes(search));
  }, [workers, workerSearch]);

  // 切换工人选择
  const toggleWorker = (w: string) => {
    setSelectedWorkers(prev =>
      prev.includes(w)
        ? prev.filter(x => x !== w)
        : [...prev, w]
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
        setRemark(selectedDiary.remark || '');
        setVehicle(selectedDiary.vehicle || '');
        setStatus(selectedDiary.status || 'incomplete');
        setNotified(selectedDiary.notified || false);
        setTag(selectedDiary.tag || null);
        // 解析工人列表
        const workerStr = selectedDiary.worker || '';
        const workerList = workerStr ? workerStr.split(',').map(w => w.trim()).filter(Boolean) : [];
        setSelectedWorkers(workerList);
        setWorkerSearch('');
        setShowWorkerDropdown(false);
      } else {
        // 新建时清空表单
        setCustomer('');
        setRemark('');
        setVehicle('');
        setStatus('incomplete');
        setNotified(false);
        setTag(null);
        setSelectedWorkers([]);
        setWorkerSearch('');
        setShowWorkerDropdown(false);
      }
    }
  }, [selectedDiary]);

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

    const diaryData = {
      customer: customer || null,
      remark: remark || null,
      worker: selectedWorkers.length > 0 ? selectedWorkers.join(', ') : null,
      vehicle: vehicle || null,
      status,
      notified,
      tag,
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
            <div className="form-group">
              <label>园主</label>
              <input
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="输入园主名称"
              />
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
              <label>备注</label>
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="输入备注"
              />
            </div>

            <div className="form-group">
              <label>标签</label>
              <select
                value={tag || ''}
                onChange={(e) => setTag(e.target.value as DiaryTag || null)}
                className="tag-select"
              >
                <option value="">无标签</option>
                {TAG_OPTIONS.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
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

            <div className={`form-group ${!vehicle ? 'warning' : ''}`}>
              <label>
                车号
                {!vehicle && <span className="required-dot">*</span>}
              </label>
              <input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="输入车号"
                className={!vehicle ? 'input-warning' : ''}
              />
              {!vehicle && (
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
