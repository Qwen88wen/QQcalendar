import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { updateDiary, getRemarks, createRemark } from '../lib/diary';
import { USER_FLOWERS } from '../lib/flowers';
import type { DiaryRemark, DiaryStatus } from '../types/database';
import './DiaryModal.css';

export function DiaryModal() {
  const {
    isModalOpen,
    selectedDiary,
    isEditing,
    closeModal,
    userName,
    activeInputUser,
  } = useAppStore();

  // 表单状态
  const [customer, setCustomer] = useState('');
  const [remark, setRemark] = useState('');
  const [worker, setWorker] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [status, setStatus] = useState<DiaryStatus>('incomplete');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 备注状态
  const [remarks, setRemarks] = useState<DiaryRemark[]>([]);
  const [newRemark, setNewRemark] = useState('');
  const [isLoadingRemarks, setIsLoadingRemarks] = useState(false);

  // 加载已有数据
  useEffect(() => {
    if (selectedDiary) {
      setCustomer(selectedDiary.customer || '');
      setRemark(selectedDiary.remark || '');
      setWorker(selectedDiary.worker || '');
      setVehicle(selectedDiary.vehicle || '');
      setStatus(selectedDiary.status || 'incomplete');

      // 加载备注
      loadRemarks(selectedDiary.id);
    } else {
      // 新建时清空表单
      setCustomer('');
      setRemark('');
      setWorker('');
      setVehicle('');
      setStatus('incomplete');
      setRemarks([]);
    }
  }, [selectedDiary]);

  const loadRemarks = async (diaryId: string) => {
    setIsLoadingRemarks(true);
    const data = await getRemarks(diaryId);
    setRemarks(data);
    setIsLoadingRemarks(false);
  };

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
      worker: worker || null,
      vehicle: vehicle || null,
      status,
      operators: newOperators,
    };

    await updateDiary(selectedDiary.id, diaryData);

    setIsSubmitting(false);
    closeModal();
  };

  const handleAddRemark = async () => {
    if (!userName || !selectedDiary || !newRemark.trim()) return;

    const remarkData = await createRemark({
      diary_id: selectedDiary.id,
      user_name: userName,
      content: newRemark.trim(),
    });

    if (remarkData) {
      setRemarks([...remarks, remarkData]);
      setNewRemark('');
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

        {/* 当前操作用户提示 */}
        <div className="current-user-hint">
          当前用户: <strong>{activeInputUser}</strong>
        </div>

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
              <label>备注</label>
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="输入备注"
              />
            </div>

            <div className="form-group">
              <label>工人</label>
              <input
                type="text"
                value={worker}
                onChange={(e) => setWorker(e.target.value)}
                placeholder="输入工人信息"
              />
            </div>

            <div className="form-group">
              <label>车号</label>
              <input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="输入车号"
              />
            </div>
          </div>

          <div className="form-group">
            <label>状态</label>
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

          {/* 操作者花朵显示 */}
          {selectedDiary && selectedDiary.operators && selectedDiary.operators.length > 0 && (
            <div className="form-group">
              <label>参与者</label>
              <div className="operators-display">
                {selectedDiary.operators.map((op, idx) => (
                  <span key={idx} className="operator-flower" title={op}>
                    {USER_FLOWERS[op]?.icon || '🌸'} {op}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 当前用户花朵提示 */}
          <div className="form-group">
            <label>你的花朵</label>
            <div className="your-flower">
              <span className="flower-icon">{USER_FLOWERS[activeInputUser]?.icon || '🌸'}</span>
              <span className="flower-name">{USER_FLOWERS[activeInputUser]?.name || '樱花'}</span>
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

        {/* 备注区域 - 所有人可见和添加 */}
        {selectedDiary && (
          <div className="remarks-section">
            <h3>协作备注</h3>

            {isLoadingRemarks ? (
              <p className="loading">加载中...</p>
            ) : (
              <div className="remarks-list">
                {remarks.length === 0 ? (
                  <p className="no-remarks">暂无备注</p>
                ) : (
                  remarks.map((remarkItem) => (
                    <div key={remarkItem.id} className="remark-item">
                      <div className="remark-header">
                        <span className="remark-author">
                          {remarkItem.user_name || '匿名'}
                        </span>
                        <span className="remark-time">
                          {new Date(remarkItem.created_at).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <p className="remark-content">{remarkItem.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {userName && (
              <div className="add-remark">
                <textarea
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  placeholder="添加备注..."
                  rows={2}
                />
                <button
                  onClick={handleAddRemark}
                  disabled={!newRemark.trim()}
                >
                  发送
                </button>
              </div>
            )}
          </div>
        )}

        {/* 时间信息 */}
        {selectedDiary && (
          <div className="diary-meta">
            <span>创建时间: {new Date(selectedDiary.created_at).toLocaleString('zh-CN')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
