import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MdArrowBack, MdAdd, MdDelete, MdEdit } from 'react-icons/md';
import orderApi from '../../api/orderApi';
import { useAuth } from '../../contexts/AuthContext';
import './Order.css';

const STATUS_MAP = { NEW: 'Mới', RECRUITING: 'Đang tuyển', FULFILLED: 'Đã đủ', CLOSED: 'Đóng' };
const TYPE_MAP = { SEASONAL: 'Thời vụ', PERMANENT: 'Chính thức' };
const GENDER_MAP = { MALE: 'Nam', FEMALE: 'Nữ', ANY: 'Không yêu cầu' };

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = ['ADMIN', 'DIRECTOR', 'TEAM_LEAD'].includes(user?.role);
  const canAssign = ['ADMIN', 'TEAM_LEAD', 'SALE'].includes(user?.role);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => { loadOrder(); }, [id]);

  async function loadOrder() {
    try {
      setLoading(true);
      const res = await orderApi.getById(id);
      setOrder(res.data);
    } catch { toast.error('Không thể tải đơn tuyển'); navigate('/orders'); }
    finally { setLoading(false); }
  }

  async function handleRemoveWorker(assignmentId, workerName) {
    if (!window.confirm(`Gỡ ${workerName} khỏi đơn này?`)) return;
    try {
      await orderApi.removeWorker(id, assignmentId);
      toast.success(`Đã gỡ ${workerName}`);
      loadOrder();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  async function handleChangeStatus() {
    try {
      await orderApi.update(id, { status: newStatus });
      toast.success('Đã cập nhật trạng thái');
      setShowStatusModal(false);
      loadOrder();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  if (loading) return <p className="loading-text">Đang tải...</p>;
  if (!order) return null;

  const filledCount = order.workerAssignments.length;
  const progress = Math.min((filledCount / order.quantity) * 100, 100);

  return (
    <div className="order-detail">
      <button className="btn-back" onClick={() => navigate('/orders')}><MdArrowBack /> Quay lại</button>

      {/* Header */}
      <div className="detail-header">
        <div>
          <h2>{order.title}</h2>
          <div className="detail-tags">
            <span className={`type-badge ${order.employmentType.toLowerCase()}`}>{TYPE_MAP[order.employmentType]}</span>
            <span className="status-badge" style={{ background: { NEW: '#6366f1', RECRUITING: '#f59e0b', FULFILLED: '#10b981', CLOSED: '#6b7280' }[order.status] }}>
              {STATUS_MAP[order.status]}
            </span>
          </div>
        </div>
        <div className="header-actions">
          {canEdit && (
            <button className="btn-sm" onClick={() => { setNewStatus(order.status); setShowStatusModal(true); }}>
              <MdEdit /> Đổi trạng thái
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-section">
        <div className="progress-label">
          <span>Tiến độ: <strong>{filledCount}/{order.quantity}</strong> công nhân</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="detail-grid">
        {/* Thông tin đơn */}
        <div className="detail-card">
          <h3>Thông tin đơn tuyển</h3>
          <div className="info-list">
            <div className="info-item"><span>Vendor:</span><strong>{order.vendor.name}</strong></div>
            <div className="info-item"><span>Nhà máy:</span><strong>{order.factory.name}</strong></div>
            <div className="info-item"><span>Giới tính:</span><strong>{GENDER_MAP[order.genderRequirement]}</strong></div>
            {(order.ageMin || order.ageMax) && <div className="info-item"><span>Độ tuổi:</span><strong>{order.ageMin || '?'} – {order.ageMax || '?'}</strong></div>}
            {order.requirements && <div className="info-item"><span>Yêu cầu:</span><strong>{order.requirements}</strong></div>}
            {order.deadline && <div className="info-item"><span>Deadline:</span><strong>{new Date(order.deadline).toLocaleDateString('vi-VN')}</strong></div>}
            <div className="info-item"><span>Người tạo:</span><strong>{order.createdBy.fullName}</strong></div>
            <div className="info-item"><span>Sale phụ trách:</span><strong>{order.assignedSale?.fullName || 'Chưa giao'}</strong></div>
          </div>
        </div>

        {/* Hoa hồng */}
        <div className="detail-card">
          <h3>Hoa hồng & Thưởng</h3>
          <div className="info-list">
            <div className="info-item"><span>Hoa hồng/giờ:</span><strong className="text-money">{Number(order.commissionPerHour).toLocaleString('vi-VN')}đ</strong></div>
            {order.specialBonus && <div className="info-item"><span>Thưởng đặc biệt:</span><strong className="text-money">{Number(order.specialBonus).toLocaleString('vi-VN')}đ/CN</strong></div>}
            {order.specialBonusCondition && <div className="info-item"><span>Điều kiện:</span><strong>{order.specialBonusCondition}</strong></div>}
          </div>
          {order.note && (
            <div className="note-box"><strong>Ghi chú:</strong> {order.note}</div>
          )}
        </div>
      </div>

      {/* Danh sách CN đã gắn */}
      <div className="detail-card" style={{ marginTop: '1rem' }}>
        <div className="card-header-row">
          <h3>Công nhân đã cung cấp ({filledCount})</h3>
          {canAssign && order.status !== 'CLOSED' && (
            <button className="btn-sm" onClick={() => navigate(`/orders/${id}/assign`)}>
              <MdAdd /> Gắn CN
            </button>
          )}
        </div>
        {filledCount > 0 ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>CCCD</th>
                  <th>SĐT</th>
                  <th>Trạng thái</th>
                  <th>Ngày gắn</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {order.workerAssignments.map((wa) => (
                  <tr key={wa.id}>
                    <td className="td-name">{wa.worker.fullName}</td>
                    <td>{wa.worker.idCard}</td>
                    <td>{wa.worker.phone || '—'}</td>
                    <td>{wa.worker.status === 'WORKING' ? 'Đang làm' : wa.worker.status}</td>
                    <td>{new Date(wa.assignedDate).toLocaleDateString('vi-VN')}</td>
                    <td>
                      {canAssign && (
                        <button className="btn-icon danger" onClick={() => handleRemoveWorker(wa.id, wa.worker.fullName)}>
                          <MdDelete />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-text">Chưa có công nhân nào</p>
        )}
      </div>

      {/* Modal đổi trạng thái */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <h3>Đổi trạng thái</h3>
            <div className="form-group">
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="NEW">Mới</option>
                <option value="RECRUITING">Đang tuyển</option>
                <option value="FULFILLED">Đã đủ</option>
                <option value="CLOSED">Đóng</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowStatusModal(false)}>Hủy</button>
              <button className="btn-primary" onClick={handleChangeStatus}>Cập nhật</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetail;
