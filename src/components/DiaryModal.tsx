import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { createDiary, updateDiary, getRemarks, createRemark } from '../lib/diary';
import type { FlowerType, DiaryRemark } from '../types/database';
import './DiaryModal.css';

const FLOWER_OPTIONS: { value: FlowerType; label: string; emoji: string }[] = [
  { value: 1, label: '红玫瑰', emoji: '🌹' },
  { value: 2, label: '郁金香', emoji: '🌷' },
  { value: 3, label: '薰衣草', emoji: '💜' },
  { value: 4, label: '樱花', emoji: '🌸' },
  { value: 5, label: '向日葵', emoji: '🌻' },
];

export function DiaryModal() {
  const {
    isModalOpen,
    selectedDiary,
    isEditing,
    closeModal,
    userId,
    userName,
    userRole,
  } = useAppStore();

  // 表单状态
  const [customer, setCustomer] = useState('');
  const [remark, setRemark] = useState('');
  const [worker, setWorker] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [content, setContent] = useState('');
  const [flowerType, setFlowerType] = useState<FlowerType>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 备注状态
  const [remarks, setRemarks] = useState<DiaryRemark[]>([]);
  const [newRemark, setNewRemark] = useState('');
  const [isLoadingRemarks, setIsLoadingRemarks] = useState(false);

  const isEditor = userRole === 'editor';

  // 加载已有数据
  useEffect(() => {
    if (selectedDiary) {
      setCustomer(selectedDiary.customer || '');
      setRemark(selectedDiary.remark || '');
      setWorker(selectedDiary.worker || '');
      setVehicle(selectedDiary.vehicle || '');
      setContent(selectedDiary.content || '');
      setFlowerType((selectedDiary.flower_type as FlowerType) || 1);

      // 加载备注
      loadRemarks(selectedDiary.id);
    } else {
      // 新建时清空表单
      setCustomer('');
      setRemark('');
      setWorker('');
      setVehicle('');
      setContent('');
      setFlowerType(1);
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
    if (!userId || !isEditor) return;

    setIsSubmitting(true);

    const diaryData = {
      customer: customer || null,
      remark: remark || null,
      worker: worker || null,
      vehicle: vehicle || null,
      content,
      flower_type: flowerType,
    };

    if (isEditing && selectedDiary) {
      await updateDiary(selectedDiary.id, diaryData);
    } else {
      await createDiary({
        ...diaryData,
        user_id: userId,
        user_name: userName,
      });
    }

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

        <h2>{isEditing ? '编辑记录' : '新增记录'}</h2>

        {/* 表单 - 仅 Editor 可编辑 */}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>园主</label>
              <input
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                disabled={!isEditor}
                placeholder="输入园主名称"
              />
            </div>

            <div className="form-group">
              <label>备注</label>
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                disabled={!isEditor}
                placeholder="输入备注"
              />
            </div>

            <div className="form-group">
              <label>工人</label>
              <input
                type="text"
                value={worker}
                onChange={(e) => setWorker(e.target.value)}
                disabled={!isEditor}
                placeholder="输入工人信息"
              />
            </div>

            <div className="form-group">
              <label>车号</label>
              <input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                disabled={!isEditor}
                placeholder="输入车号"
              />
            </div>
          </div>

          <div className="form-group">
            <label>内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={!isEditor}
              placeholder="输入记录内容"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>选择花朵</label>
            <div className="flower-options">
              {FLOWER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`flower-option ${flowerType === option.value ? 'active' : ''}`}
                  onClick={() => isEditor && setFlowerType(option.value)}
                  disabled={!isEditor}
                >
                  <span className="flower-emoji">{option.emoji}</span>
                  <span className="flower-label">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {isEditor && (
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? '提交中...' : isEditing ? '保存修改' : '创建记录'}
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
