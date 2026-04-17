import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MdAdd, MdSearch, MdVisibility, MdAssignment, MdEdit, MdDelete, MdToggleOn, MdToggleOff } from 'react-icons/md';
import orderApi from '../../api/orderApi';
import { useAuth } from '../../contexts/AuthContext';
import './Order.css';

const STATUS_MAP = {
  NEW: { label: 'Mới', color: '#6366f1' },
  RECRUITING: { label: 'Đang tuyển', color: '#f59e0b' },
  FULFILLED: { label: 'Đã đủ', color: '#10b981' },
  CLOSED: { label: 'Đóng', color: '#6b7280' },
};
const TYPE_MAP = { SEASONAL: 'Thời vụ', PERMANENT: 'Chính thức' };

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const canCreate = ['ADMIN', 'DIRECTOR', 'TEAM_LEAD'].includes(user?.role);
  const canManage = ['ADMIN', 'DIRECTOR', 'TEAM_LEAD'].includes(user?.role);

  useEffect(() => { loadOrders(); }, [search, filterStatus, filterType]);

  async function loadOrders() {
    try {
      setLoading(true);
      const res = await orderApi.getAll({
        search: search || undefined,
        status: filterStatus || undefined,
        employmentType: filterType || undefined,
        limit: 50,
      });
      setOrders(res.data);
    } catch { toast.error('Không thể tải danh sách đơn tuyển'); }
    finally { setLoading(false); }
  }

  async function handleDelete(o) {
    if (!window.confirm(`Bạn có chắc muốn đóng đơn tuyển "${o.title}"?`)) return;
    try {
      await orderApi.remove(o.id);
      toast.success('Đã đóng đơn tuyển');
      loadOrders();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  async function handleToggleStatus(o) {
    const newStatus = o.status === 'CLOSED' ? 'NEW' : 'CLOSED';
    const msg = o.status === 'CLOSED' ? 'Kích hoạt lại' : 'Đóng';
    if (!window.confirm(`${msg} đơn tuyển "${o.title}"?`)) return;
    try {
      await orderApi.changeStatus(o.id, newStatus);
      toast.success(`Đã ${msg.toLowerCase()} đơn tuyển`);
      loadOrders();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  return (
    <div className="order-page">
      <div className="page-header">
        <h2><MdAssignment /> Đơn tuyển dụng</h2>
        {canCreate && (
          <button className="btn-primary" onClick={() => navigate('/orders/new')}>
            <MdAdd /> Tạo đơn
          </button>
        )}
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <MdSearch />
          <input placeholder="Tìm theo tiêu đề..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="NEW">Mới</option>
          <option value="RECRUITING">Đang tuyển</option>
          <option value="FULFILLED">Đã đủ</option>
          <option value="CLOSED">Đóng</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Tất cả loại hình</option>
          <option value="SEASONAL">Thời vụ</option>
          <option value="PERMANENT">Chính thức</option>
        </select>
      </div>

      {loading ? <p className="loading-text">Đang tải...</p> : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Vendor</th>
                <th>Nhà máy</th>
                <th>Loại hình</th>
                <th>SL cần</th>
                <th>Đã có</th>
                <th>Hoa hồng/giờ</th>
                <th>Sale phụ trách</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className={o.status === 'CLOSED' ? 'row-inactive' : ''}>
                  <td className="td-name" data-label="Tiêu đề">{o.title}</td>
                  <td data-label="Vendor">{o.vendor.name}</td>
                  <td data-label="Nhà máy">{o.factory.name}</td>
                  <td data-label="Loại hình"><span className={`type-badge ${o.employmentType.toLowerCase()}`}>{TYPE_MAP[o.employmentType]}</span></td>
                  <td data-label="SL cần">{o.quantity}</td>
                  <td data-label="Đã có"><strong>{o._count.workerAssignments}</strong>/{o.quantity}</td>
                  <td className="td-money" data-label="Hoa hồng/giờ">{Number(o.commissionPerHour).toLocaleString('vi-VN')}đ</td>
                  <td data-label="Sale" className="td-hide-mobile">{o.assignedSale?.fullName || '—'}</td>
                  <td data-label="Trạng thái">
                    <span className="status-badge" style={{ background: STATUS_MAP[o.status]?.color }}>
                      {STATUS_MAP[o.status]?.label}
                    </span>
                  </td>
                  <td className="td-actions" data-label="">
                    <button className="btn-sm btn-view" onClick={() => navigate(`/orders/${o.id}`)} title="Xem"><MdVisibility /></button>
                    {canManage && (
                      <>
                        <button className="btn-sm btn-edit" onClick={() => navigate(`/orders/${o.id}/edit`)} title="Sửa"><MdEdit /></button>
                        <button className="btn-sm btn-toggle" onClick={() => handleToggleStatus(o)} title={o.status === 'CLOSED' ? 'Kích hoạt' : 'Đóng'}>
                          {o.status === 'CLOSED' ? <MdToggleOff /> : <MdToggleOn />}
                        </button>
                        <button className="btn-sm btn-delete" onClick={() => handleDelete(o)} title="Xóa"><MdDelete /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan="10" className="empty-text">Chưa có đơn tuyển nào</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default OrderList;
