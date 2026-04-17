import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdToggleOn, MdToggleOff, MdHandshake } from 'react-icons/md';
import collaboratorApi from '../../api/collaboratorApi';
import userApi from '../../api/userApi';
import { useAuth } from '../../contexts/AuthContext';
import './Collaborator.css';

function CollaboratorList() {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCTV, setEditCTV] = useState(null);
  const [sales, setSales] = useState([]);
  const [form, setForm] = useState({
    fullName: '', phone: '', idCard: '', address: '',
    bankAccount: '', bankName: '', saleId: '', note: '',
  });
  const { user } = useAuth();
  const canCreate = ['ADMIN', 'TEAM_LEAD', 'SALE'].includes(user?.role);
  const canManage = ['ADMIN', 'TEAM_LEAD'].includes(user?.role);

  useEffect(() => { loadData(); }, [search]);

  async function loadData() {
    try {
      setLoading(true);
      const res = await collaboratorApi.getAll({ search: search || undefined, limit: 50 });
      setCollaborators(res.data);
    } catch { toast.error('Không thể tải danh sách CTV'); }
    finally { setLoading(false); }
  }

  async function openCreate() {
    setEditCTV(null);
    setForm({ fullName: '', phone: '', idCard: '', address: '', bankAccount: '', bankName: '', saleId: '', note: '' });
    if (user.role !== 'SALE') {
      try { const s = await userApi.getAll({ role: 'SALE', limit: 100 }); setSales(s.data); } catch { /* */ }
    }
    setShowModal(true);
  }

  async function openEdit(c) {
    setEditCTV(c);
    setForm({ fullName: c.fullName, phone: c.phone, idCard: c.idCard || '', address: c.address || '', bankAccount: c.bankAccount || '', bankName: c.bankName || '', saleId: c.saleId || '', note: c.note || '' });
    if (user.role !== 'SALE') {
      try { const s = await userApi.getAll({ role: 'SALE', limit: 100 }); setSales(s.data); } catch { /* */ }
    }
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editCTV) {
        await collaboratorApi.update(editCTV.id, form);
        toast.success('Cập nhật CTV thành công');
      } else {
        await collaboratorApi.create(form);
        toast.success('Tạo CTV thành công');
      }
      setShowModal(false);
      loadData();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  async function handleDelete(c) {
    if (!window.confirm(`Bạn có chắc muốn vô hiệu CTV "${c.fullName}"?`)) return;
    try {
      await collaboratorApi.remove(c.id);
      toast.success('Đã vô hiệu CTV');
      loadData();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  async function handleToggle(c) {
    const action = c.isActive ? 'Vô hiệu' : 'Kích hoạt';
    if (!window.confirm(`${action} CTV "${c.fullName}"?`)) return;
    try {
      await collaboratorApi.toggleActive(c.id);
      toast.success(`Đã ${action.toLowerCase()} CTV`);
      loadData();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <div className="ctv-page">
      <div className="page-header">
        <h2><MdHandshake /> Cộng tác viên (CTV)</h2>
        {canCreate && <button className="btn-primary" onClick={openCreate}><MdAdd /> Thêm CTV</button>}
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <MdSearch />
          <input placeholder="Tìm theo tên, SĐT, CCCD..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <p className="loading-text">Đang tải...</p> : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>SĐT</th>
                <th>CCCD</th>
                <th>Ngân hàng</th>
                <th>STK</th>
                <th>Sale quản lý</th>
                <th>CN đã GT</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {collaborators.map((c) => (
                <tr key={c.id} className={!c.isActive ? 'row-inactive' : ''}>
                  <td className="td-name" data-label="Họ tên">{c.fullName}</td>
                  <td data-label="SĐT">{c.phone}</td>
                  <td data-label="CCCD" className="td-hide-mobile">{c.idCard || '—'}</td>
                  <td data-label="Ngân hàng" className="td-hide-mobile">{c.bankName || '—'}</td>
                  <td data-label="STK" className="td-hide-mobile">{c.bankAccount || '—'}</td>
                  <td data-label="Sale">{c.sale?.fullName || '—'}</td>
                  <td data-label="CN đã GT"><strong>{c._count?.workers || 0}</strong></td>
                  <td data-label="Trạng thái"><span className={`status-dot ${c.isActive ? 'active' : 'inactive'}`}>{c.isActive ? 'Hoạt động' : 'Vô hiệu'}</span></td>
                  <td className="td-actions" data-label="">
                    {canCreate && <button className="btn-sm btn-edit" onClick={() => openEdit(c)} title="Sửa"><MdEdit /></button>}
                    {canManage && (
                      <>
                        <button className="btn-sm btn-toggle" onClick={() => handleToggle(c)} title={c.isActive ? 'Vô hiệu' : 'Kích hoạt'}>
                          {c.isActive ? <MdToggleOn /> : <MdToggleOff />}
                        </button>
                        <button className="btn-sm btn-delete" onClick={() => handleDelete(c)} title="Xóa"><MdDelete /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {collaborators.length === 0 && <tr><td colSpan="9" className="empty-text">Chưa có CTV</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editCTV ? 'Cập nhật CTV' : 'Thêm CTV mới'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label>Họ tên *</label><input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} required /></div>
                <div className="form-group"><label>SĐT *</label><input value={form.phone} onChange={(e) => set('phone', e.target.value)} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>CCCD</label><input value={form.idCard} onChange={(e) => set('idCard', e.target.value)} /></div>
                <div className="form-group"><label>Địa chỉ</label><input value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Tên ngân hàng</label><input value={form.bankName} onChange={(e) => set('bankName', e.target.value)} placeholder="VD: Vietcombank" /></div>
                <div className="form-group"><label>Số tài khoản</label><input value={form.bankAccount} onChange={(e) => set('bankAccount', e.target.value)} /></div>
              </div>
              {user.role !== 'SALE' && (
                <div className="form-group">
                  <label>Sale quản lý</label>
                  <select value={form.saleId} onChange={(e) => set('saleId', e.target.value)}>
                    <option value="">-- Chọn --</option>
                    {sales.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group"><label>Ghi chú</label><textarea rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} /></div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">{editCTV ? 'Cập nhật' : 'Tạo mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CollaboratorList;
