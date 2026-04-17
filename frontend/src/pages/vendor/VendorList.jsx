import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MdAdd, MdEdit, MdSearch, MdVisibility, MdBusiness } from 'react-icons/md';
import vendorApi from '../../api/vendorApi';
import { useAuth } from '../../contexts/AuthContext';
import './Vendor.css';

const EMPLOYMENT_LABELS = { SEASONAL: 'Thời vụ', PERMANENT: 'Chính thức' };

function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [form, setForm] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '', note: '' });
  const { user } = useAuth();
  const navigate = useNavigate();
  const canEdit = ['ADMIN', 'DIRECTOR', 'TEAM_LEAD'].includes(user?.role);

  useEffect(() => { loadVendors(); }, [search]);

  async function loadVendors() {
    try {
      setLoading(true);
      const res = await vendorApi.getAll({ search: search || undefined, limit: 50 });
      setVendors(res.data);
    } catch { toast.error('Không thể tải danh sách Vendor'); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditVendor(null);
    setForm({ name: '', contactPerson: '', phone: '', email: '', address: '', note: '' });
    setShowModal(true);
  }

  function openEdit(v) {
    setEditVendor(v);
    setForm({ name: v.name, contactPerson: v.contactPerson, phone: v.phone, email: v.email || '', address: v.address || '', note: v.note || '' });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editVendor) {
        await vendorApi.update(editVendor.id, form);
        toast.success('Cập nhật Vendor thành công');
      } else {
        await vendorApi.create(form);
        toast.success('Tạo Vendor thành công');
      }
      setShowModal(false);
      loadVendors();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  return (
    <div className="vendor-page">
      <div className="page-header">
        <h2><MdBusiness /> Quản lý Vendor</h2>
        {canEdit && (
          <button className="btn-primary" onClick={openCreate}>
            <MdAdd /> Thêm Vendor
          </button>
        )}
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <MdSearch />
          <input placeholder="Tìm theo tên, người liên hệ, SĐT..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Đang tải...</p>
      ) : (
        <div className="vendor-grid">
          {vendors.map((v) => (
            <div key={v.id} className={`vendor-card ${!v.isActive ? 'inactive' : ''}`}>
              <div className="vendor-card-header">
                <h3>{v.name}</h3>
                {!v.isActive && <span className="badge-inactive">Ngừng HĐ</span>}
              </div>
              <div className="vendor-card-body">
                <p><strong>Liên hệ:</strong> {v.contactPerson}</p>
                <p><strong>SĐT:</strong> {v.phone}</p>
                {v.email && <p><strong>Email:</strong> {v.email}</p>}
                <div className="factory-tags">
                  {v.factories.map((vf) => (
                    <span key={vf.id} className={`factory-tag ${vf.employmentType.toLowerCase()}`}>
                      {vf.factory.name} — {EMPLOYMENT_LABELS[vf.employmentType]}
                    </span>
                  ))}
                  {v.factories.length === 0 && <span className="no-factory">Chưa liên kết nhà máy</span>}
                </div>
                <p className="order-count">{v._count.recruitmentOrders} đơn tuyển</p>
              </div>
              <div className="vendor-card-actions">
                <button className="btn-icon" title="Xem chi tiết" onClick={() => navigate(`/vendors/${v.id}`)}>
                  <MdVisibility />
                </button>
                {canEdit && (
                  <button className="btn-icon" title="Sửa" onClick={() => openEdit(v)}>
                    <MdEdit />
                  </button>
                )}
              </div>
            </div>
          ))}
          {vendors.length === 0 && <p className="empty-text">Chưa có Vendor nào</p>}
        </div>
      )}

      {/* Modal tạo/sửa Vendor */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editVendor ? 'Cập nhật Vendor' : 'Thêm Vendor mới'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên Vendor *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Người liên hệ *</label>
                  <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Ghi chú</label>
                <textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">{editVendor ? 'Cập nhật' : 'Tạo mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorList;
