import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MdArrowBack } from 'react-icons/md';
import workerApi from '../../api/workerApi';
import './Worker.css';

const STATUS_MAP = { AVAILABLE: 'Chờ việc', WORKING: 'Đang làm', RESIGNED: 'Đã nghỉ' };
const TYPE_MAP = { SEASONAL: 'Thời vụ', PERMANENT: 'Chính thức' };
const GENDER_MAP = { MALE: 'Nam', FEMALE: 'Nữ', ANY: 'Không xác định' };

function WorkerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workerApi.getById(id)
      .then((res) => setWorker(res.data))
      .catch(() => { toast.error('Không thể tải'); navigate('/workers'); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="loading-text">Đang tải...</p>;
  if (!worker) return null;

  const totalHours = worker.workingHours.reduce((sum, wh) => sum + Number(wh.totalHours), 0);

  return (
    <div className="worker-detail">
      <button className="btn-back" onClick={() => navigate('/workers')}><MdArrowBack /> Quay lại</button>
      <h2>{worker.fullName}</h2>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Thông tin cá nhân</h3>
          <div className="info-list">
            <div className="info-item"><span>CCCD:</span><strong>{worker.idCard}</strong></div>
            <div className="info-item"><span>SĐT:</span><strong>{worker.phone || '—'}</strong></div>
            <div className="info-item"><span>Giới tính:</span><strong>{GENDER_MAP[worker.gender]}</strong></div>
            {worker.dateOfBirth && <div className="info-item"><span>Ngày sinh:</span><strong>{new Date(worker.dateOfBirth).toLocaleDateString('vi-VN')}</strong></div>}
            <div className="info-item"><span>Địa chỉ:</span><strong>{worker.address || '—'}</strong></div>
            <div className="info-item"><span>Loại hình:</span><strong>{worker.employmentType ? TYPE_MAP[worker.employmentType] : '—'}</strong></div>
            <div className="info-item"><span>Trạng thái:</span><strong>{STATUS_MAP[worker.status]}</strong></div>
          </div>
        </div>

        <div className="detail-card">
          <h3>Phân công & Quản lý</h3>
          <div className="info-list">
            <div className="info-item"><span>Nhà máy:</span><strong>{worker.factory?.name || 'Chưa phân công'}</strong></div>
            {worker.startDate && <div className="info-item"><span>Ngày vào:</span><strong>{new Date(worker.startDate).toLocaleDateString('vi-VN')}</strong></div>}
            <div className="info-item"><span>Sale:</span><strong>{worker.sale?.fullName || '—'}</strong></div>
            <div className="info-item"><span>CTV giới thiệu:</span><strong>{worker.collaborator?.fullName || 'Không'}</strong></div>
            <div className="info-item"><span>Tổng giờ làm:</span><strong className="text-money">{totalHours.toLocaleString('vi-VN')}h</strong></div>
          </div>
        </div>
      </div>

      {/* Giờ làm */}
      {worker.workingHours.length > 0 && (
        <div className="detail-card" style={{ marginTop: '1rem' }}>
          <h3>Giờ làm gần đây</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Tháng/Năm</th><th>Tổng giờ</th><th>Người nhập</th></tr></thead>
              <tbody>
                {worker.workingHours.map((wh) => (
                  <tr key={wh.id}>
                    <td>T{wh.month}/{wh.year}</td>
                    <td className="td-money">{Number(wh.totalHours).toLocaleString('vi-VN')}h</td>
                    <td>{wh.enteredBy?.fullName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Đơn tuyển */}
      {worker.assignments.length > 0 && (
        <div className="detail-card" style={{ marginTop: '1rem' }}>
          <h3>Lịch sử đơn tuyển ({worker.assignments.length})</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Đơn tuyển</th><th>Nhà máy</th><th>Trạng thái</th><th>Ngày gắn</th></tr></thead>
              <tbody>
                {worker.assignments.map((a) => (
                  <tr key={a.id}>
                    <td className="td-name">{a.recruitmentOrder.title}</td>
                    <td>{a.recruitmentOrder.factory.name}</td>
                    <td>{a.recruitmentOrder.status}</td>
                    <td>{new Date(a.assignedDate).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkerDetail;
