import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdAdd, MdAccessTime, MdEdit, MdDelete } from 'react-icons/md';
import workingHoursApi from '../../api/workingHoursApi';
import workerApi from '../../api/workerApi';
import { useAuth } from '../../contexts/AuthContext';
import './Salary.css';

function WorkingHoursPage() {
  const now = new Date();
  const [records, setRecords] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ workerId: '', totalHours: '', note: '' });
  const { user } = useAuth();
  const canManage = ['ADMIN', 'TEAM_LEAD'].includes(user?.role);

  useEffect(() => { loadData(); }, [month, year]);

  async function loadData() {
    try {
      setLoading(true);
      const [hRes, wRes] = await Promise.all([
        workingHoursApi.getAll({ month, year, limit: 200 }),
        workerApi.getAll({ status: 'WORKING', limit: 200 }),
      ]);
      setRecords(hRes.data);
      setWorkers(wRes.data);
    } catch { toast.error('Không thể tải dữ liệu'); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditItem(null);
    setForm({ workerId: '', totalHours: '', note: '' });
    setShowModal(true);
  }

  function openEdit(r) {
    setEditItem(r);
    setForm({ workerId: r.workerId, totalHours: Number(r.totalHours), note: r.note || '' });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editItem) {
        await workingHoursApi.update(editItem.id, { totalHours: form.totalHours, note: form.note });
        toast.success('Cập nhật giờ thành công');
      } else {
        await workingHoursApi.create({ ...form, month, year });
        toast.success('Nhập giờ thành công');
      }
      setShowModal(false);
      loadData();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  async function handleDelete(r) {
    if (!window.confirm(`Xóa giờ làm của "${r.worker.fullName}" (${Number(r.totalHours)}h)?`)) return;
    try {
      await workingHoursApi.remove(r.id);
      toast.success('Đã xóa bản ghi giờ làm');
      loadData();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  const totalAll = records.reduce((sum, r) => sum + Number(r.totalHours), 0);

  return (
    <div className="salary-page">
      <div className="page-header">
        <h2><MdAccessTime /> Nhập giờ làm việc</h2>
        <button className="btn-primary" onClick={openCreate}>
          <MdAdd /> Nhập giờ
        </button>
      </div>

      <div className="filter-bar">
        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
          {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="total-hours-badge">Tổng: <strong>{totalAll.toLocaleString('vi-VN')}h</strong> ({records.length} CN)</div>
      </div>

      {loading ? <p className="loading-text">Đang t���i...</p> : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Công nhân</th>
                <th>CCCD</th>
                <th>Nhà máy</th>
                <th>Sale</th>
                <th>Tổng giờ</th>
                <th>Người nhập</th>
                <th>Thời gian nhập</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="td-name">{r.worker.fullName}</td>
                  <td>{r.worker.idCard}</td>
                  <td>{r.worker.factory?.name || '—'}</td>
                  <td>{r.worker.sale?.fullName || '—'}</td>
                  <td className="td-money">{Number(r.totalHours).toLocaleString('vi-VN')}h</td>
                  <td>{r.enteredBy.fullName}</td>
                  <td>{new Date(r.enteredAt).toLocaleString('vi-VN')}</td>
                  <td className="td-actions">
                    <button className="btn-sm btn-edit" onClick={() => openEdit(r)} title="Sửa"><MdEdit /></button>
                    {canManage && <button className="btn-sm btn-delete" onClick={() => handleDelete(r)} title="X��a"><MdDelete /></button>}
                  </td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan="8" className="empty-text">Ch��a có dữ liệu giờ làm</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <h3>{editItem ? `Sửa giờ — ${editItem.worker.fullName}` : `Nhập giờ — T${month}/${year}`}</h3>
            <form onSubmit={handleSubmit}>
              {!editItem && (
                <div className="form-group">
                  <label>Chọn công nhân *</label>
                  <select value={form.workerId} onChange={(e) => setForm({ ...form, workerId: e.target.value })} required>
                    <option value="">-- Ch���n CN --</option>
                    {workers.map((w) => <option key={w.id} value={w.id}>{w.fullName} ({w.idCard})</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>T���ng giờ trong tháng *</label>
                <input type="number" min="0" step="0.5" value={form.totalHours} onChange={(e) => setForm({ ...form, totalHours: e.target.value })} required placeholder="VD: 176" />
              </div>
              <div className="form-group"><label>Ghi chú</label><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">{editItem ? 'Cập nhật' : 'Lưu'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkingHoursPage;
