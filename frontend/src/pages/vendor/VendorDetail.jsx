import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MdArrowBack, MdAdd, MdDelete, MdFactory } from 'react-icons/md';
import vendorApi from '../../api/vendorApi';
import factoryApi from '../../api/factoryApi';
import { useAuth } from '../../contexts/AuthContext';
import './Vendor.css';

const EMPLOYMENT_LABELS = { SEASONAL: 'Thời vụ', PERMANENT: 'Chính thức' };
const ORDER_STATUS_LABELS = { NEW: 'Mới', RECRUITING: 'Đang tuyển', FULFILLED: 'Đã đủ', CLOSED: 'Đóng' };

function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = ['ADMIN', 'DIRECTOR', 'TEAM_LEAD'].includes(user?.role);

  const [vendor, setVendor] = useState(null);
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkForm, setLinkForm] = useState({ factoryId: '', employmentType: 'SEASONAL' });

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const [vendorRes, factoriesRes] = await Promise.all([
        vendorApi.getById(id),
        factoryApi.getAll({ limit: 100 }),
      ]);
      setVendor(vendorRes.data);
      setFactories(factoriesRes.data);
    } catch { toast.error('Không thể tải dữ liệu'); navigate('/vendors'); }
    finally { setLoading(false); }
  }

  async function handleAddFactory(e) {
    e.preventDefault();
    try {
      await vendorApi.addFactory(id, linkForm);
      toast.success('Liên kết nhà máy thành công');
      setShowLinkModal(false);
      loadData();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  async function handleRemoveFactory(linkId, factoryName) {
    if (!window.confirm(`Xóa liên kết với ${factoryName}?`)) return;
    try {
      await vendorApi.removeFactory(id, linkId);
      toast.success('Đã xóa liên kết');
      loadData();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  if (loading) return <p className="loading-text">Đang tải...</p>;
  if (!vendor) return null;

  return (
    <div className="vendor-detail">
      <button className="btn-back" onClick={() => navigate('/vendors')}>
        <MdArrowBack /> Quay lại
      </button>

      <div className="detail-header">
        <div>
          <h2>{vendor.name}</h2>
          <span className={`status-dot ${vendor.isActive ? 'active' : 'inactive'}`}>
            {vendor.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
          </span>
        </div>
      </div>

      <div className="detail-grid">
        {/* Thông tin Vendor */}
        <div className="detail-card">
          <h3>Thông tin liên hệ</h3>
          <div className="info-list">
            <div className="info-item"><span>Người liên hệ:</span><strong>{vendor.contactPerson}</strong></div>
            <div className="info-item"><span>SĐT:</span><strong>{vendor.phone}</strong></div>
            {vendor.email && <div className="info-item"><span>Email:</span><strong>{vendor.email}</strong></div>}
            {vendor.address && <div className="info-item"><span>Địa chỉ:</span><strong>{vendor.address}</strong></div>}
            {vendor.note && <div className="info-item"><span>Ghi chú:</span><strong>{vendor.note}</strong></div>}
          </div>
        </div>

        {/* Nhà máy liên kết */}
        <div className="detail-card">
          <div className="card-header-row">
            <h3><MdFactory /> Nhà máy liên kết ({vendor.factories.length})</h3>
            {canEdit && (
              <button className="btn-sm" onClick={() => setShowLinkModal(true)}>
                <MdAdd /> Thêm
              </button>
            )}
          </div>
          <div className="linked-list">
            {vendor.factories.map((vf) => (
              <div key={vf.id} className="linked-item">
                <div>
                  <strong>{vf.factory.name}</strong>
                  <span className={`type-badge ${vf.employmentType.toLowerCase()}`}>
                    {EMPLOYMENT_LABELS[vf.employmentType]}
                  </span>
                </div>
                {canEdit && (
                  <button className="btn-icon danger" onClick={() => handleRemoveFactory(vf.id, vf.factory.name)}>
                    <MdDelete />
                  </button>
                )}
              </div>
            ))}
            {vendor.factories.length === 0 && <p className="empty-text">Chưa liên kết nhà máy nào</p>}
          </div>
        </div>
      </div>

      {/* Đơn tuyển gần đây */}
      {vendor.recruitmentOrders.length > 0 && (
        <div className="detail-card" style={{ marginTop: '1rem' }}>
          <h3>Đơn tuyển gần đây ({vendor._count.recruitmentOrders})</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Nhà máy</th>
                  <th>Loại hình</th>
                  <th>SL cần</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {vendor.recruitmentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="td-name">{o.title}</td>
                    <td>{o.factory.name}</td>
                    <td><span className={`type-badge ${o.employmentType.toLowerCase()}`}>{EMPLOYMENT_LABELS[o.employmentType]}</span></td>
                    <td>{o.quantity}</td>
                    <td>{ORDER_STATUS_LABELS[o.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal liên kết nhà máy */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <h3>Liên kết Nhà máy</h3>
            <form onSubmit={handleAddFactory}>
              <div className="form-group">
                <label>Chọn nhà máy *</label>
                <select value={linkForm.factoryId} onChange={(e) => setLinkForm({ ...linkForm, factoryId: e.target.value })} required>
                  <option value="">-- Chọn --</option>
                  {factories.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Loại hình *</label>
                <select value={linkForm.employmentType} onChange={(e) => setLinkForm({ ...linkForm, employmentType: e.target.value })}>
                  <option value="SEASONAL">Thời vụ</option>
                  <option value="PERMANENT">Chính thức</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowLinkModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Liên kết</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorDetail;
