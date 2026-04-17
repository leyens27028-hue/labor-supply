import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdPayments } from 'react-icons/md';
import salaryApi from '../../api/salaryApi';
import { useAuth } from '../../contexts/AuthContext';
import './Salary.css';

function MySalary() {
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [previewRes, historyRes] = await Promise.all([
        salaryApi.getMyPreview(),
        salaryApi.getAll({ limit: 12 }),
      ]);
      setPreview(previewRes.data);
      setHistory(historyRes.data);
    } catch { toast.error('Không thể tải dữ liệu'); }
    finally { setLoading(false); }
  }

  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');

  if (loading) return <p className="loading-text">Đang tải...</p>;

  return (
    <div className="my-salary-page">
      <h2><MdPayments /> Lương của tôi</h2>

      {/* Lương dự kiến tháng hiện tại */}
      {preview && (
        <div className="salary-preview-card">
          <div className="preview-header">
            <h3>Lương dự kiến — T{preview.month}/{preview.year}</h3>
            <span className={`status-badge ${preview.status === 'PREVIEW' ? '' : ''}`} style={{ background: preview.status === 'PREVIEW' ? '#6366f1' : '#10b981' }}>
              {preview.status === 'PREVIEW' ? 'Dự kiến' : preview.status}
            </span>
          </div>

          <div className="salary-breakdown">
            <div className="salary-row">
              <span>Lương cơ bản</span>
              <strong>{fmt(preview.baseSalary)}đ</strong>
            </div>
            <div className="salary-row">
              <span>Tổng giờ CN phụ trách</span>
              <strong>{fmt(preview.totalHours)}h</strong>
            </div>
            <div className="salary-row">
              <span>Mức hoa hồng/giờ</span>
              <strong className="text-money">{fmt(preview.commissionRate)}đ</strong>
            </div>
            <div className="salary-row">
              <span>Tổng hoa hồng</span>
              <strong className="text-money">{fmt(preview.commissionAmount)}đ</strong>
            </div>
            <div className="salary-row">
              <span>Thưởng khác</span>
              <strong>{fmt(preview.totalBonus)}đ</strong>
            </div>
            <div className="salary-row total">
              <span>TỔNG LƯƠNG</span>
              <strong className="text-money">{fmt(preview.totalSalary)}đ</strong>
            </div>
          </div>

          {preview.bonuses?.length > 0 && (
            <div className="bonus-list">
              <h4>Chi tiết thưởng:</h4>
              {preview.bonuses.map((b) => (
                <div key={b.id} className="bonus-item">
                  <span>{b.description}</span>
                  <strong>{fmt(b.amount)}đ</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lịch sử lương */}
      {history.length > 0 && (
        <div className="detail-card" style={{ marginTop: '1.5rem' }}>
          <h3>Lịch sử lương</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tháng/Năm</th>
                  <th>Tổng giờ</th>
                  <th>HH/giờ</th>
                  <th>Hoa hồng</th>
                  <th>Thưởng</th>
                  <th>Tổng lương</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {history.map((s) => (
                  <tr key={s.id}>
                    <td>T{s.month}/{s.year}</td>
                    <td>{fmt(s.totalHours)}h</td>
                    <td>{fmt(s.commissionRate)}đ</td>
                    <td>{fmt(s.commissionAmount)}đ</td>
                    <td>{fmt(s.totalBonus)}đ</td>
                    <td><strong className="td-money">{fmt(s.totalSalary)}đ</strong></td>
                    <td>
                      <span className="status-badge" style={{ background: { DRAFT: '#6366f1', CONFIRMED: '#f59e0b', PAID: '#10b981' }[s.status] }}>
                        {{ DRAFT: 'Nháp', CONFIRMED: 'Xác nhận', PAID: 'Đã trả' }[s.status]}
                      </span>
                    </td>
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

export default MySalary;
