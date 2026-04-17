import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MdAdd, MdSearch, MdVisibility, MdEngineering, MdEdit, MdDelete, MdToggleOn, MdToggleOff } from 'react-icons/md';
import workerApi from '../../api/workerApi';
import collaboratorApi from '../../api/collaboratorApi';
import userApi from '../../api/userApi';
import vendorApi from '../../api/vendorApi';
import factoryApi from '../../api/factoryApi';
import { useAuth } from '../../contexts/AuthContext';
import './Worker.css';

const STATUS_MAP = { AVAILABLE: { label: 'Chờ việc', color: '#6366f1' }, WORKING: { label: 'Đang làm', color: '#10b981' }, RESIGNED: { label: 'Đã nghỉ', color: '#6b7280' } };
const TYPE_MAP = { SEASONAL: 'Thời vụ', PERMANENT: 'Chính thức' };

function WorkerList() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [sales, setSales] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [factories, setFactories] = useState([]);
  const [form, setForm] = useState({
    fullName: '', idCard: '', phone: '', address: '', gender: 'ANY',
    dateOfBirth: '', employmentType: '', saleId: '', collaboratorId: '',
    factoryId: '', note: '',
  });
  const { user } = useAuth();
  const navigate = useNavigate();
  const canCreate = ['ADMIN', 'TEAM_LEAD', 'SALE'].includes(user?.role);
  const canManage = ['ADMIN', 'TEAM_LEAD'].includes(user?.role);

  useEffect(() => { loadWorkers(); }, [search, filterStatus]);

  async function loadWorkers() {
    try {
      setLoading(true);
      const res = await workerApi.getAll({ search: search || undefined, status: filterStatus || undefined, limit: 50 });
      setWorkers(res.data);
    } catch { toast.error('Không thể tải danh sách CN'); }
    finally { setLoading(false); }
  }

  async function loadFormData() {
    try {
      const [cRes, sRes, vRes, fRes] = await Promise.all([
        collaboratorApi.getAll({ limit: 100 }),
        user.role === 'SALE' ? Promise.resolve({ data: [] }) : userApi.getAll({ role: 'SALE', limit: 100 }),
        vendorApi.getAll({ limit: 100 }),
        factoryApi.getAll({ limit: 100 }),
      ]);
      setCollaborators(cRes.data);
      setSales(sRes.data);
      setVendors(vRes.data);
      setFactories(fRes.data);
    } catch { /* ignore */ }
  }

  async function openCreate() {
    setEditItem(null);
    setForm({ fullName: '', idCard: '', phone: '', address: '', gender: 'ANY', dateOfBirth: '', employmentType: '', saleId: '', collaboratorId: '', factoryId: '', note: '' });
    await loadFormData();
    setShowModal(true);
  }

  async function openEdit(w) {
    setEditItem(w);
    setForm({
      fullName: w.fullName || '', idCard: w.idCard || '', phone: w.phone || '', address: w.address || '',
      gender: w.gender || 'ANY', dateOfBirth: w.dateOfBirth ? w.dateOfBirth.substring(0, 10) : '',
      employmentType: w.employmentType || '', saleId: w.saleId || '', collaboratorId: w.collaboratorId || '',
      factoryId: w.factoryId || '', note: w.note || '',
    });
    await loadFormData();
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editItem) {
        await workerApi.update(editItem.id, form);
        toast.success('Cập nhật công nhân thành công');
      } else {
        await workerApi.create(form);
        toast.success('Tạo công nhân thành công');
      }
      setShowModal(false);
      loadWorkers();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  async function handleDelete(w) {
    if (!window.confirm(`Bạn có chắc muốn vô hiệu công nhân "${w.fullName}"?`)) return;
    try {
      await workerApi.remove(w.id);
      toast.success('Đã vô hiệu công nhân');
      loadWorkers();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  async function handleToggle(w) {
    const action = w.status === 'RESIGNED' ? 'Kích hoạt' : 'Vô hiệu';
    if (!window.confirm(`${action} công nhân "${w.fullName}"?`)) return;
    try {
      await workerApi.toggleStatus(w.id);
      toast.success(`Đã ${action.toLowerCase()} công nhân`);
      loadWorkers();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <div className="worker-page">
      <div className="page-header">
        <h2><MdEngineering /> Quản lý Công nhân</h2>
        {canCreate && <button className="btn-primary" onClick={openCreate}><MdAdd /> Thêm CN</button>}
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <MdSearch />
          <input placeholder="Tìm theo tên, CCCD, SĐT..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="AVAILABLE">Chờ việc</option>
          <option value="WORKING">Đang làm</option>
          <option value="RESIGNED">Đã nghỉ</option>
        </select>
      </div>

      {loading ? <p className="loading-text">Đang tải...</p> : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>CCCD</th>
                <th>SĐT</th>
                <th>Loại hình</th>
                <th>Nhà máy</th>
                <th>Sale</th>
                <th>CTV</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w.id} className={w.status === 'RESIGNED' ? 'row-inactive' : ''}>
                  <td className="td-name">{w.fullName}</td>
                  <td>{w.idCard}</td>
                  <td>{w.phone || '—'}</td>
                  <td>{w.employmentType ? <span className={`type-badge ${w.employmentType.toLowerCase()}`}>{TYPE_MAP[w.employmentType]}</span> : '—'}</td>
                  <td>{w.factory?.name || '—'}</td>
                  <td>{w.sale?.fullName || '—'}</td>
                  <td>{w.collaborator?.fullName || '—'}</td>
                  <td><span className="status-badge" style={{ background: STATUS_MAP[w.status]?.color }}>{STATUS_MAP[w.status]?.label}</span></td>
                  <td className="td-actions">
                    <button className="btn-sm btn-view" onClick={() => navigate(`/workers/${w.id}`)} title="Xem"><MdVisibility /></button>
                    {canCreate && <button className="btn-sm btn-edit" onClick={() => openEdit(w)} title="Sửa"><MdEdit /></button>}
                    {canManage && (
                      <>
                        <button className="btn-sm btn-toggle" onClick={() => handleToggle(w)} title={w.status === 'RESIGNED' ? 'Kích hoạt' : 'Vô hiệu'}>
                          {w.status === 'RESIGNED' ? <MdToggleOff /> : <MdToggleOn />}
                        </button>
                        <button className="btn-sm btn-delete" onClick={() => handleDelete(w)} title="Xóa"><MdDelete /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {workers.length === 0 && <tr><td colSpan="9" className="empty-text">Chưa có công nhân</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editItem ? 'Cập nhật công nhân' : 'Thêm công nhân mới'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label>Họ tên *</label><input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} required /></div>
                <div className="form-group"><label>Số CCCD *</label><input value={form.idCard} onChange={(e) => set('idCard', e.target.value)} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>SĐT</label><input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
                <div className="form-group">
                  <label>Giới tính</label>
                  <select value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                    <option value="ANY">Không xác định</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Ngày sinh</label><input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} /></div>
                <div className="form-group">
                  <label>Loại hình</label>
                  <select value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)}>
                    <option value="">Chưa xác định</option>
                    <option value="SEASONAL">Thời vụ</option>
                    <option value="PERMANENT">Chính thức</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Địa chỉ</label><input value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
              <div className="form-row">
                <div className="form-group">
                  <label>Nhà máy</label>
                  <select value={form.factoryId} onChange={(e) => set('factoryId', e.target.value)}>
                    <option value="">-- Chọn nhà máy --</option>
                    {factories.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                {user.role !== 'SALE' && (
                  <div className="form-group">
                    <label>Sale phụ trách</label>
                    <select value={form.saleId} onChange={(e) => set('saleId', e.target.value)}>
                      <option value="">-- Chọn --</option>
                      {sales.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>CTV giới thiệu</label>
                <select value={form.collaboratorId} onChange={(e) => set('collaboratorId', e.target.value)}>
                  <option value="">Không có</option>
                  {collaborators.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Ghi chú</label><textarea rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} /></div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">{editItem ? 'Cập nhật' : 'Tạo mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkerList;
