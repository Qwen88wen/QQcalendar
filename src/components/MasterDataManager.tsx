import { useState, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { createCustomer, updateCustomer, deactivateCustomer, activateCustomer, importCustomers } from '../lib/customers';
import { createWorker, updateWorker, deactivateWorker, activateWorker } from '../lib/workers';
import { createVehicle, updateVehicle, deactivateVehicle, activateVehicle } from '../lib/vehicles';
import type { Customer, Worker, Vehicle, CustomerInsert } from '../types/database';
import './MasterDataManager.css';

type TabType = 'customers' | 'workers' | 'vehicles';

// 解析 CSV 内容
function parseCustomerCSV(csvText: string): CustomerInsert[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return []; // 至少要有表头和一行数据

  const results: CustomerInsert[] = [];

  // 跳过表头，从第二行开始
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 解析 CSV 行 (处理逗号和引号)
    const columns = parseCSVLine(line);
    if (columns.length < 2) continue;

    const [code, name, customerPriceStr, workerPriceStr] = columns;

    // 解析价格 (数字或文字)
    const customerPrice = parsePrice(customerPriceStr);
    const workerPrice = parsePrice(workerPriceStr);

    // 如果价格是文字，存到 notes
    let notes: string | null = null;
    if (customerPriceStr && isNaN(parseFloat(customerPriceStr))) {
      notes = customerPriceStr;
    }

    results.push({
      code: code?.trim() || null,
      name: name?.trim() || '',
      notes,
      harvest_customer_price: customerPrice,
      harvest_worker_price: workerPrice,
    });
  }

  return results.filter(c => c.name); // 过滤掉没有名字的
}

// 解析 CSV 行 (处理逗号和引号)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

// 解析价格 (返回数字或 null)
function parsePrice(str: string | undefined): number | null {
  if (!str) return null;
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

export function MasterDataManager() {
  const {
    customers,
    workers,
    vehicles,
    addCustomer,
    updateCustomer: updateCustomerInStore,
    addWorker,
    updateWorker: updateWorkerInStore,
    addVehicle,
    updateVehicle: updateVehicleInStore,
    setCustomers,
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [showInactive, setShowInactive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CSV 导入状态
  const [importStatus, setImportStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  // 新增表单状态
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerNotes, setNewCustomerNotes] = useState('');
  const [newCustomerHarvestCustomerPrice, setNewCustomerHarvestCustomerPrice] = useState('');
  const [newCustomerHarvestWorkerPrice, setNewCustomerHarvestWorkerPrice] = useState('');

  const [newWorkerName, setNewWorkerName] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');

  // 过滤数据
  const filteredCustomers = showInactive ? customers : customers.filter(c => c.is_active);
  const filteredWorkers = showInactive ? workers : workers.filter(w => w.is_active);
  const filteredVehicles = showInactive ? vehicles : vehicles.filter(v => v.is_active);

  // 新增园主
  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) return;
    setIsSubmitting(true);
    const result = await createCustomer({
      name: newCustomerName.trim(),
      notes: newCustomerNotes.trim() || null,
      harvest_customer_price: newCustomerHarvestCustomerPrice ? parseFloat(newCustomerHarvestCustomerPrice) : null,
      harvest_worker_price: newCustomerHarvestWorkerPrice ? parseFloat(newCustomerHarvestWorkerPrice) : null,
    });
    if (result) {
      addCustomer(result);
      setNewCustomerName('');
      setNewCustomerNotes('');
      setNewCustomerHarvestCustomerPrice('');
      setNewCustomerHarvestWorkerPrice('');
    }
    setIsSubmitting(false);
  };

  // 新增工人
  const handleAddWorker = async () => {
    if (!newWorkerName.trim()) return;
    setIsSubmitting(true);
    const result = await createWorker({
      name: newWorkerName.trim().toUpperCase(),
    });
    if (result) {
      addWorker(result);
      setNewWorkerName('');
    }
    setIsSubmitting(false);
  };

  // 新增车辆
  const handleAddVehicle = async () => {
    if (!newVehiclePlate.trim()) return;
    setIsSubmitting(true);
    const result = await createVehicle({
      plate_number: newVehiclePlate.trim().toUpperCase(),
    });
    if (result) {
      addVehicle(result);
      setNewVehiclePlate('');
    }
    setIsSubmitting(false);
  };

  // 开始编辑
  const startEdit = (type: TabType, item: Customer | Worker | Vehicle) => {
    setEditingId(item.id);
    if (type === 'customers') {
      const c = item as Customer;
      setEditForm({
        name: c.name,
        notes: c.notes || '',
        harvest_customer_price: c.harvest_customer_price?.toString() || '',
        harvest_worker_price: c.harvest_worker_price?.toString() || '',
      });
    } else if (type === 'workers') {
      setEditForm({ name: (item as Worker).name });
    } else {
      setEditForm({ plate_number: (item as Vehicle).plate_number });
    }
  };

  // 保存编辑
  const saveEdit = async (type: TabType) => {
    if (!editingId) return;
    setIsSubmitting(true);

    if (type === 'customers') {
      const result = await updateCustomer(editingId, {
        name: editForm.name,
        notes: editForm.notes || null,
        harvest_customer_price: editForm.harvest_customer_price ? parseFloat(editForm.harvest_customer_price) : null,
        harvest_worker_price: editForm.harvest_worker_price ? parseFloat(editForm.harvest_worker_price) : null,
      });
      if (result) updateCustomerInStore(result);
    } else if (type === 'workers') {
      const result = await updateWorker(editingId, { name: editForm.name });
      if (result) updateWorkerInStore(result);
    } else {
      const result = await updateVehicle(editingId, { plate_number: editForm.plate_number });
      if (result) updateVehicleInStore(result);
    }

    setEditingId(null);
    setEditForm({});
    setIsSubmitting(false);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // 切换激活状态
  const toggleActive = async (type: TabType, item: Customer | Worker | Vehicle) => {
    setIsSubmitting(true);
    let result = false;

    if (type === 'customers') {
      const c = item as Customer;
      if (c.is_active) {
        result = await deactivateCustomer(c.id);
        if (result) updateCustomerInStore({ ...c, is_active: false });
      } else {
        result = await activateCustomer(c.id);
        if (result) updateCustomerInStore({ ...c, is_active: true });
      }
    } else if (type === 'workers') {
      const w = item as Worker;
      if (w.is_active) {
        result = await deactivateWorker(w.id);
        if (result) updateWorkerInStore({ ...w, is_active: false });
      } else {
        result = await activateWorker(w.id);
        if (result) updateWorkerInStore({ ...w, is_active: true });
      }
    } else {
      const v = item as Vehicle;
      if (v.is_active) {
        result = await deactivateVehicle(v.id);
        if (result) updateVehicleInStore({ ...v, is_active: false });
      } else {
        result = await activateVehicle(v.id);
        if (result) updateVehicleInStore({ ...v, is_active: true });
      }
    }

    setIsSubmitting(false);
  };

  // CSV 导入处理
  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    setImportStatus('正在读取文件...');

    try {
      const text = await file.text();
      const customersToImport = parseCustomerCSV(text);

      if (customersToImport.length === 0) {
        setImportStatus('CSV 文件格式错误或无有效数据');
        setIsSubmitting(false);
        return;
      }

      setImportStatus(`正在导入 ${customersToImport.length} 条数据...`);

      const count = await importCustomers(customersToImport);

      if (count > 0) {
        setImportStatus(`成功导入 ${count} 条园主数据！`);
        // 重新加载数据
        const { getActiveCustomers } = await import('../lib/customers');
        const newCustomers = await getActiveCustomers();
        setCustomers(newCustomers);
      } else {
        setImportStatus('导入失败，请检查数据格式');
      }
    } catch (err) {
      console.error('CSV 导入失败:', err);
      setImportStatus('导入失败: ' + (err instanceof Error ? err.message : '未知错误'));
    } finally {
      setIsSubmitting(false);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) {
    return (
      <button className="master-data-btn" onClick={() => setIsOpen(true)}>
        <span>&#9881;</span> 主档管理
      </button>
    );
  }

  return (
    <div className="master-data-overlay" onClick={() => setIsOpen(false)}>
      <div className="master-data-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setIsOpen(false)}>
          &times;
        </button>

        <h2>主档数据管理</h2>

        {/* 标签页 */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            园主 ({filteredCustomers.length})
          </button>
          <button
            className={`tab ${activeTab === 'workers' ? 'active' : ''}`}
            onClick={() => setActiveTab('workers')}
          >
            工人 ({filteredWorkers.length})
          </button>
          <button
            className={`tab ${activeTab === 'vehicles' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehicles')}
          >
            车辆 ({filteredVehicles.length})
          </button>
        </div>

        {/* 显示非活跃开关 */}
        <div className="show-inactive-toggle">
          <label>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            显示已停用
          </label>
        </div>

        {/* 园主管理 */}
        {activeTab === 'customers' && (
          <div className="tab-content">
            {/* CSV 导入 */}
            <div className="csv-import-section">
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                ref={fileInputRef}
                style={{ display: 'none' }}
                id="csv-file-input"
              />
              <button
                className="csv-import-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
              >
                CSV 导入园主
              </button>
              {importStatus && <span className="import-status">{importStatus}</span>}
            </div>

            <div className="add-form customer-add-form">
              <input
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="园主名称 *"
                disabled={isSubmitting}
              />
              <input
                type="text"
                value={newCustomerNotes}
                onChange={(e) => setNewCustomerNotes(e.target.value)}
                placeholder="备注"
                disabled={isSubmitting}
              />
              <input
                type="number"
                step="0.01"
                value={newCustomerHarvestCustomerPrice}
                onChange={(e) => setNewCustomerHarvestCustomerPrice(e.target.value)}
                placeholder="割果客户价"
                disabled={isSubmitting}
              />
              <input
                type="number"
                step="0.01"
                value={newCustomerHarvestWorkerPrice}
                onChange={(e) => setNewCustomerHarvestWorkerPrice(e.target.value)}
                placeholder="割果工人价"
                disabled={isSubmitting}
              />
              <button onClick={handleAddCustomer} disabled={!newCustomerName.trim() || isSubmitting}>
                添加
              </button>
            </div>

            <div className="data-list">
              {filteredCustomers.map((c) => (
                <div key={c.id} className={`data-item ${!c.is_active ? 'inactive' : ''}`}>
                  {editingId === c.id ? (
                    <div className="edit-form customer-edit-form">
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="名称"
                      />
                      <input
                        type="text"
                        value={editForm.notes || ''}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        placeholder="备注"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.harvest_customer_price || ''}
                        onChange={(e) => setEditForm({ ...editForm, harvest_customer_price: e.target.value })}
                        placeholder="客户价"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.harvest_worker_price || ''}
                        onChange={(e) => setEditForm({ ...editForm, harvest_worker_price: e.target.value })}
                        placeholder="工人价"
                      />
                      <div className="edit-actions">
                        <button onClick={() => saveEdit('customers')} disabled={isSubmitting}>保存</button>
                        <button onClick={cancelEdit} className="cancel-btn">取消</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="item-info">
                        <span className="item-name">{c.name}</span>
                        {c.notes && <span className="item-notes">{c.notes}</span>}
                        {(c.harvest_customer_price || c.harvest_worker_price) && (
                          <span className="item-prices">
                            割果: {c.harvest_customer_price || '-'} / {c.harvest_worker_price || '-'}
                          </span>
                        )}
                        {!c.is_active && <span className="inactive-badge">已停用</span>}
                      </div>
                      <div className="item-actions">
                        <button onClick={() => startEdit('customers', c)} className="edit-btn">编辑</button>
                        <button
                          onClick={() => toggleActive('customers', c)}
                          className={c.is_active ? 'deactivate-btn' : 'activate-btn'}
                          disabled={isSubmitting}
                        >
                          {c.is_active ? '停用' : '启用'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {filteredCustomers.length === 0 && (
                <div className="empty-message">暂无园主数据</div>
              )}
            </div>
          </div>
        )}

        {/* 工人管理 */}
        {activeTab === 'workers' && (
          <div className="tab-content">
            <div className="add-form">
              <input
                type="text"
                value={newWorkerName}
                onChange={(e) => setNewWorkerName(e.target.value)}
                placeholder="工人名称 *"
                disabled={isSubmitting}
              />
              <button onClick={handleAddWorker} disabled={!newWorkerName.trim() || isSubmitting}>
                添加
              </button>
            </div>

            <div className="data-list">
              {filteredWorkers.map((w) => (
                <div key={w.id} className={`data-item ${!w.is_active ? 'inactive' : ''}`}>
                  {editingId === w.id ? (
                    <div className="edit-form">
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="名称"
                      />
                      <div className="edit-actions">
                        <button onClick={() => saveEdit('workers')} disabled={isSubmitting}>保存</button>
                        <button onClick={cancelEdit} className="cancel-btn">取消</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="item-info">
                        <span className="item-name">{w.name}</span>
                        {!w.is_active && <span className="inactive-badge">已停用</span>}
                      </div>
                      <div className="item-actions">
                        <button onClick={() => startEdit('workers', w)} className="edit-btn">编辑</button>
                        <button
                          onClick={() => toggleActive('workers', w)}
                          className={w.is_active ? 'deactivate-btn' : 'activate-btn'}
                          disabled={isSubmitting}
                        >
                          {w.is_active ? '停用' : '启用'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {filteredWorkers.length === 0 && (
                <div className="empty-message">暂无工人数据</div>
              )}
            </div>
          </div>
        )}

        {/* 车辆管理 */}
        {activeTab === 'vehicles' && (
          <div className="tab-content">
            <div className="add-form">
              <input
                type="text"
                value={newVehiclePlate}
                onChange={(e) => setNewVehiclePlate(e.target.value)}
                placeholder="车牌号 *"
                disabled={isSubmitting}
              />
              <button onClick={handleAddVehicle} disabled={!newVehiclePlate.trim() || isSubmitting}>
                添加
              </button>
            </div>

            <div className="data-list">
              {filteredVehicles.map((v) => (
                <div key={v.id} className={`data-item ${!v.is_active ? 'inactive' : ''}`}>
                  {editingId === v.id ? (
                    <div className="edit-form">
                      <input
                        type="text"
                        value={editForm.plate_number || ''}
                        onChange={(e) => setEditForm({ ...editForm, plate_number: e.target.value })}
                        placeholder="车牌号"
                      />
                      <div className="edit-actions">
                        <button onClick={() => saveEdit('vehicles')} disabled={isSubmitting}>保存</button>
                        <button onClick={cancelEdit} className="cancel-btn">取消</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="item-info">
                        <span className="item-name">{v.plate_number}</span>
                        {!v.is_active && <span className="inactive-badge">已停用</span>}
                      </div>
                      <div className="item-actions">
                        <button onClick={() => startEdit('vehicles', v)} className="edit-btn">编辑</button>
                        <button
                          onClick={() => toggleActive('vehicles', v)}
                          className={v.is_active ? 'deactivate-btn' : 'activate-btn'}
                          disabled={isSubmitting}
                        >
                          {v.is_active ? '停用' : '启用'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {filteredVehicles.length === 0 && (
                <div className="empty-message">暂无车辆数据</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
