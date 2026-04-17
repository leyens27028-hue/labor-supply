import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdToggleOn, MdToggleOff, MdFactory } from 'react-icons/md';
import factoryApi from '../../api/factoryApi';
import { useAuth } from '../../contexts/AuthContext';
import './FactoryList.css';

function FactoryList() {
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '', note: '' });
  const { user } = useAuth();
  const canManage = ['ADMIN', 'DIRECTOR', 'TEAM_LEAD'].includes(user?.role);

  useEffect(() => { loadData(); }, [search]);

  async function loadData() {
    try {
      setLoading(true);
      const res = await factoryApi.getAll({ search: search || undefined, limit: 100 });
      setFactories(res.data);
    } catch { toast.error('Không thể tải danh sách nhà máy'); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditItem(null);
    setForm({ name: '', address: '', phone: '', note: '' });
    setShowModal(true);
  }

  function openEdit(f) {
    setEditItem(f);
    setForm({ name: f.name, address: f.address || '', phone: f.phone || '', note: f.note || '' });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editItem) {
        await factoryApi.update(editItem.id, form);
        toast.success('Cập nhật nhà máy thành công');
      } else {
        await factoryApi.create(form);
        toast.success('Tạo nhà máy thành công');
      }
      setShowModal(false);
      loadData();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  async function handleDelete(f) {
    if (!window.confirm(`Bạn có chắc muốn vô hiệu nhà máy "${f.name}"?`)) return;
    try {
      await factoryApi.remove(f.id);
      toast.success('Đã vô hiệu nhà máy');
      loadData();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  async function handleToggle(f) {
    if (!window.confirm(`${f.isActive ? 'Vô hiệu' : 'Kích hoạt'} nhà máy "${f.name}"?`)) return;
    try {
      await factoryApi.toggleActive(f.id);
      toast.success(f.isActive ? 'Đã vô hiệu' : 'Đã kích hoạt');
      loadData();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <div className="factory-page">
      <div className="page-header">
        <h2><MdFactory /> Quản lý Nhà máy</h2>
        {canManage && <button className="btn-primary" onClick={openCreate}><MdAdd /> Thêm nhà máy</button>}
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <MdSearch />
          <input placeholder="Tìm theo tên, địa chỉ..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <p className="loading-text">Đang tải...</p> : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên nhà máy</th>
                <th>Địa chỉ</th>
                <th>SĐT</th>
                <th>Vendor liên kết</th>
                <th>Số CN</th>
                <th>Đơn tuyển</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {factories.map((f) => (
                <tr key={f.id} className={!f.isActive ? 'row-inactive' : ''}>
                  <td className="td-name">{f.name}</td>
                  <td>{f.address || '—'}</td>
                  <td>{f.phone || '—'}</td>
                  <td>
                    {f.vendors?.length > 0
                      ? f.vendors.map((vf) => (
                        <span key={vf.id} className={`type-badge ${vf.employmentType.toLowerCase()}`} style={{ marginRight: 4 }}>
                          {vf.vendor.name}
                        </span>
                      ))
                      : '—'}
                  </td>
                  <td><strong>{f._count?.workers || 0}</strong></td>
                  <td>{f._count?.recruitmentOrders || 0}</td>
                  <td>
                    <span className={`status-dot ${f.isActive ? 'active' : 'inactive'}`}>
                      {f.isActive ? 'Hoạt động' : 'Vô hiệu'}
                    </span>
                  </td>
                  <td className="td-actions">
                    {canManage && (
                      <>
                        <button className="btn-sm btn-edit" onClick={() => openEdit(f)} title="Sửa"><MdEdit /></button>
                        <button className="btn-sm btn-toggle" onClick={() => handleToggle(f)} title={f.isActive ? 'Vô hiệu' : 'Kích hoạt'}>
                          {f.isActive ? <MdToggleOn /> : <MdToggleOff />}
                        </button>
                        <button className="btn-sm btn-delete" onClick={() => handleDelete(f)} title="Xóa"><MdDelete /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {factories.length === 0 && <tr><td colSpan="8" className="empty-text">Chưa có nhà máy nào</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editItem ? 'Cập nhật nhà máy' : 'Thêm nhà máy mới'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Tên nhà máy *</label><input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="VD: Samsung Bắc Giang" /></div>
              <div className="form-group"><label>Địa chỉ</label><input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="VD: KCN Vân Trung, Bắc Giang" /></div>
              <div className="form-row">
                <div className="form-group"><label>SĐT</label><input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
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

export default FactoryList;
