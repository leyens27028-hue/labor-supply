import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MdArrowBack } from 'react-icons/md';
import orderApi from '../../api/orderApi';
import vendorApi from '../../api/vendorApi';
import factoryApi from '../../api/factoryApi';
import userApi from '../../api/userApi';
import './Order.css';

function OrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [vendors, setVendors] = useState([]);
  const [factories, setFactories] = useState([]);
  const [sales, setSales] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [form, setForm] = useState({
    title: '', vendorId: '', factoryId: '', employmentType: 'SEASONAL',
    quantity: '', genderRequirement: 'ANY', ageMin: '', ageMax: '',
    requirements: '', commissionPerHour: '', specialBonus: '',
    specialBonusCondition: '', assignedSaleId: '', deadline: '', note: '',
  });

  useEffect(() => {
    async function init() {
      try {
        const [v, f, s] = await Promise.all([
          vendorApi.getAll({ limit: 100 }),
          factoryApi.getAll({ limit: 100 }),
          userApi.getAll({ role: 'SALE', limit: 100 }),
        ]);
        setVendors(v.data);
        setFactories(f.data);
        setSales(s.data);

        if (isEdit) {
          const res = await orderApi.getById(id);
          const o = res.data;
          setForm({
            title: o.title || '',
            vendorId: o.vendorId || '',
            factoryId: o.factoryId || '',
            employmentType: o.employmentType || 'SEASONAL',
            quantity: o.quantity || '',
            genderRequirement: o.genderRequirement || 'ANY',
            ageMin: o.ageMin || '',
            ageMax: o.ageMax || '',
            requirements: o.requirements || '',
            commissionPerHour: o.commissionPerHour || '',
            specialBonus: o.specialBonus || '',
            specialBonusCondition: o.specialBonusCondition || '',
            assignedSaleId: o.assignedSaleId || '',
            deadline: o.deadline ? o.deadline.substring(0, 10) : '',
            note: o.note || '',
          });
        }
      } catch (error) {
        toast.error('Không thể tải dữ liệu');
      } finally {
        setLoadingData(false);
      }
    }
    init();
  }, [id, isEdit]);

  const set = (key, val) => setForm({ ...form, [key]: val });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (isEdit) {
        await orderApi.update(id, form);
        toast.success('Cập nhật đơn tuyển thành công');
      } else {
        await orderApi.create(form);
        toast.success('Tạo đơn tuyển thành công');
      }
      navigate('/orders');
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  if (loadingData) return <p className="loading-text">Đang tải...</p>;

  return (
    <div className="order-form-page">
      <button className="btn-back" onClick={() => navigate('/orders')}><MdArrowBack /> Quay lại</button>
      <h2>{isEdit ? 'Sửa đơn tuyển' : 'Tạo đơn tuyển mới'}</h2>

      <form className="order-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Thông tin cơ bản</h3>
          <div className="form-group">
            <label>Tiêu đề đơn tuyển *</label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="VD: Tuyển CN nhà máy Samsung — Thời vụ T4/2026" />
          </div>
          <div className="form-row form-row-3">
            <div className="form-group">
              <label>Vendor *</label>
              <select value={form.vendorId} onChange={(e) => set('vendorId', e.target.value)} required>
                <option value="">-- Chọn Vendor --</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Nhà máy *</label>
              <select value={form.factoryId} onChange={(e) => set('factoryId', e.target.value)} required>
                <option value="">-- Chọn nhà máy --</option>
                {factories.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Loại hình *</label>
              <select value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)}>
                <option value="SEASONAL">Thời vụ</option>
                <option value="PERMANENT">Chính thức</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Yêu cầu tuyển</h3>
          <div className="form-row form-row-3">
            <div className="form-group">
              <label>Số lượng CN cần *</label>
              <input type="number" min="1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Giới tính</label>
              <select value={form.genderRequirement} onChange={(e) => set('genderRequirement', e.target.value)}>
                <option value="ANY">Không yêu cầu</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tuổi (từ - đến)</label>
              <div className="age-range">
                <input type="number" placeholder="Từ" value={form.ageMin} onChange={(e) => set('ageMin', e.target.value)} />
                <span>–</span>
                <input type="number" placeholder="Đến" value={form.ageMax} onChange={(e) => set('ageMax', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Yêu cầu khác</label>
            <textarea rows={2} value={form.requirements} onChange={(e) => set('requirements', e.target.value)} placeholder="VD: Biết tiếng Hàn, có kinh nghiệm..." />
          </div>
        </div>

        <div className="form-section">
          <h3>Hoa hồng & Thưởng</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Hoa hồng từ Vendor (đ/CN/giờ) *</label>
              <input type="number" min="0" value={form.commissionPerHour} onChange={(e) => set('commissionPerHour', e.target.value)} required placeholder="VD: 3000" />
            </div>
            <div className="form-group">
              <label>Thưởng đặc biệt (đ/CN)</label>
              <input type="number" min="0" value={form.specialBonus} onChange={(e) => set('specialBonus', e.target.value)} placeholder="VD: 1000000" />
            </div>
          </div>
          <div className="form-group">
            <label>Điều kiện nhận thưởng</label>
            <input value={form.specialBonusCondition} onChange={(e) => set('specialBonusCondition', e.target.value)} placeholder="VD: Làm đủ 7 ngày" />
          </div>
        </div>

        <div className="form-section">
          <h3>Phân công & Hạn</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Sale phụ trách</label>
              <select value={form.assignedSaleId} onChange={(e) => set('assignedSaleId', e.target.value)}>
                <option value="">-- Chưa giao --</option>
                {sales.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Ghi chú</label>
            <textarea rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate('/orders')}>Hủy</button>
          <button type="submit" className="btn-primary">{isEdit ? 'Cập nhật' : 'Tạo đơn tuyển'}</button>
        </div>
      </form>
    </div>
  );
}

export default OrderForm;
