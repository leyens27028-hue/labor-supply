import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdPayments, MdCalculate, MdAdd, MdDelete, MdFileDownload, MdSettings, MdEdit, MdToggleOn, MdToggleOff } from 'react-icons/md';
import salaryApi from '../../api/salaryApi';
import commissionApi from '../../api/commissionApi';
import { useAuth } from '../../contexts/AuthContext';
import './Salary.css';

const STATUS_MAP = { DRAFT: { label: 'Nháp', color: '#6366f1' }, CONFIRMED: { label: 'Xác nhận', color: '#f59e0b' }, PAID: { label: 'Đã trả', color: '#10b981' } };

function SalaryList() {
  const now = new Date();
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [calculating, setCalculating] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [bonusForm, setBonusForm] = useState({ description: '', amount: '' });
  const { user } = useAuth();
  const canConfirm = ['ADMIN', 'DIRECTOR'].includes(user?.role);
  const canDelete = ['ADMIN', 'DIRECTOR'].includes(user?.role);
  const isAdmin = user?.role === 'ADMIN';

  // Tab state
  const [activeTab, setActiveTab] = useState('salary');

  // Commission config state
  const [tiers, setTiers] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [baseSalary, setBaseSalary] = useState('');
  const [baseSalaryNote, setBaseSalaryNote] = useState('');
  const [savingBaseSalary, setSavingBaseSalary] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [tierForm, setTierForm] = useState({ minHours: '', maxHours: '', rate: '', note: '' });

  useEffect(() => { loadSalaries(); }, [month, year]);

  useEffect(() => {
    if (activeTab === 'commission' && isAdmin) {
      loadCommissionData();
    }
  }, [activeTab]);

  // Load tiers for reference table (all users)
  useEffect(() => { loadTiersForReference(); }, []);

  async function loadTiersForReference() {
    try {
      const res = await commissionApi.getTiers();
      setTiers(res.data || []);
    } catch { /* ignore */ }
  }

  async function loadSalaries() {
    try {
      setLoading(true);
      const res = await salaryApi.getAll({ month, year, limit: 50 });
      setSalaries(res.data);
    } catch { toast.error('Không thể tải bảng lương'); }
    finally { setLoading(false); }
  }

  async function loadCommissionData() {
    try {
      setTiersLoading(true);
      const [tiersRes, configsRes] = await Promise.all([
        commissionApi.getTiers(),
        commissionApi.getConfigs(),
      ]);
      setTiers(tiersRes.data || []);
      const cfgs = configsRes.data || [];
      setConfigs(cfgs);
      const bs = cfgs.find((c) => c.key === 'BASE_SALARY');
      if (bs) {
        setBaseSalary(bs.value);
        setBaseSalaryNote(bs.note || '');
      }
    } catch { toast.error('Không thể tải cấu hình hoa hồng'); }
    finally { setTiersLoading(false); }
  }

  async function handleCalculate() {
    if (!window.confirm(`Tính lương tháng ${month}/${year} cho tất cả Sale?`)) return;
    setCalculating(true);
    try {
      const res = await salaryApi.calculate({ month, year });
      toast.success(res.message);
      loadSalaries();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
    finally { setCalculating(false); }
  }

  async function handleAddBonus(e) {
    e.preventDefault();
    try {
      await salaryApi.addBonus(selectedSalary.id, bonusForm);
      toast.success('Thêm thưởng thành công');
      setShowBonusModal(false);
      loadSalaries();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  async function handleStatusChange(salaryId, newStatus) {
    try {
      await salaryApi.updateStatus(salaryId, { status: newStatus });
      toast.success('Cập nhật trạng thái thành công');
      loadSalaries();
    } catch (error) { toast.error(error?.message || 'Có lỗi'); }
  }

  async function handleDelete(s) {
    if (!window.confirm(`Xóa bảng lương của "${s.user.fullName}" tháng ${month}/${year}?`)) return;
    try {
      await salaryApi.remove(s.id);
      toast.success('Đã xóa bảng lương');
      loadSalaries();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  async function handleExport() {
    try {
      const res = await salaryApi.exportCSV({ month, year });
      const url = window.URL.createObjectURL(new Blob([res]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `bang-luong-T${month}-${year}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Đã xuất file CSV');
    } catch (error) { toast.error('Không thể xuất file'); }
  }

  // Commission config handlers
  async function handleSaveBaseSalary() {
    setSavingBaseSalary(true);
    try {
      await commissionApi.updateConfig('BASE_SALARY', { value: baseSalary, note: baseSalaryNote });
      toast.success('Đã cập nhật lương cơ bản');
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
    finally { setSavingBaseSalary(false); }
  }

  function openCreateTierModal() {
    setEditingTier(null);
    setTierForm({ minHours: '', maxHours: '', rate: '', note: '' });
    setShowTierModal(true);
  }

  function openEditTierModal(tier) {
    setEditingTier(tier);
    setTierForm({
      minHours: tier.minHours,
      maxHours: tier.maxHours === 999999 ? 999999 : tier.maxHours,
      rate: tier.rate,
      note: tier.note || '',
    });
    setShowTierModal(true);
  }

  async function handleTierSubmit(e) {
    e.preventDefault();
    const data = {
      minHours: Number(tierForm.minHours),
      maxHours: Number(tierForm.maxHours),
      rate: Number(tierForm.rate),
      note: tierForm.note,
    };
    try {
      if (editingTier) {
        await commissionApi.updateTier(editingTier.id, data);
        toast.success('Đã cập nhật bậc hoa hồng');
      } else {
        await commissionApi.createTier(data);
        toast.success('Đã thêm bậc hoa hồng');
      }
      setShowTierModal(false);
      loadCommissionData();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  async function handleDeleteTier(tier) {
    if (!window.confirm(`Xóa bậc ${fmt(tier.minHours)} – ${tier.maxHours === 999999 ? '∞' : fmt(tier.maxHours)} giờ?`)) return;
    try {
      await commissionApi.removeTier(tier.id);
      toast.success('Đã xóa bậc hoa hồng');
      loadCommissionData();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  async function handleToggleTier(tier) {
    try {
      await commissionApi.toggleTierActive(tier.id);
      toast.success(tier.isActive ? 'Đã tắt bậc hoa hồng' : 'Đã bật bậc hoa hồng');
      loadCommissionData();
    } catch (error) { toast.error(error?.message || 'Có lỗi xảy ra'); }
  }

  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const fmtHours = (n) => (n === 999999 ? '∞' : fmt(n));
  const totalAll = salaries.reduce((sum, s) => sum + Number(s.totalSalary), 0);

  return (
    <div className="salary-page">
      <div className="page-header">
        <h2><MdPayments /> Bảng lương Sale</h2>
        <div className="header-actions">
          {activeTab === 'salary' && salaries.length > 0 && (
            <button className="btn-secondary" onClick={handleExport}>
              <MdFileDownload /> Xuất Excel
            </button>
          )}
          {activeTab === 'salary' && (
            <button className="btn-primary" onClick={handleCalculate} disabled={calculating}>
              <MdCalculate /> {calculating ? 'Đang tính...' : 'Tính lương'}
            </button>
          )}
        </div>
      </div>

      {/* Tab navigation - only show if admin */}
      {isAdmin && (
        <div className="salary-tabs">
          <button
            className={`salary-tab ${activeTab === 'salary' ? 'active' : ''}`}
            onClick={() => setActiveTab('salary')}
          >
            <MdPayments /> Bảng lương
          </button>
          <button
            className={`salary-tab ${activeTab === 'commission' ? 'active' : ''}`}
            onClick={() => setActiveTab('commission')}
          >
            <MdSettings /> Cấu hình hoa hồng
          </button>
        </div>
      )}

      {/* ===== SALARY TAB ===== */}
      {activeTab === 'salary' && (
        <>
          <div className="filter-bar">
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {salaries.length > 0 && (
              <div className="total-hours-badge">Tổng chi: <strong className="text-money">{fmt(totalAll)}đ</strong> ({salaries.length} Sale)</div>
            )}
          </div>

          {loading ? <p className="loading-text">Đang tải...</p> : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nhân viên</th>
                    <th>Tổng giờ</th>
                    <th>Mức HH/giờ</th>
                    <th>Lương CB</th>
                    <th>Hoa hồng</th>
                    <th>Thưởng khác</th>
                    <th>Tổng lương</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {salaries.map((s) => (
                    <tr key={s.id}>
                      <td className="td-name" data-label="Nhân viên">{s.user.fullName}</td>
                      <td data-label="Tổng giờ">{fmt(s.totalHours)}h</td>
                      <td className="td-money td-hide-mobile" data-label="HH/giờ">{fmt(s.commissionRate)}đ</td>
                      <td data-label="Lương CB" className="td-hide-mobile">{fmt(s.baseSalary)}đ</td>
                      <td className="td-money" data-label="Hoa hồng">{fmt(s.commissionAmount)}đ</td>
                      <td data-label="Thưởng" className="td-hide-mobile">{fmt(s.totalBonus)}đ</td>
                      <td data-label="Tổng lương"><strong className="td-money">{fmt(s.totalSalary)}đ</strong></td>
                      <td data-label="Trạng thái"><span className="status-badge" style={{ background: STATUS_MAP[s.status]?.color }}>{STATUS_MAP[s.status]?.label}</span></td>
                      <td className="td-actions" data-label="">
                        <button className="btn-sm btn-edit" title="Thêm thưởng" onClick={() => { setSelectedSalary(s); setBonusForm({ description: '', amount: '' }); setShowBonusModal(true); }}>
                          <MdAdd />
                        </button>
                        {canConfirm && s.status === 'DRAFT' && (
                          <button className="btn-toggle success" onClick={() => handleStatusChange(s.id, 'CONFIRMED')}>Xác nhận</button>
                        )}
                        {canConfirm && s.status === 'CONFIRMED' && (
                          <button className="btn-toggle success" onClick={() => handleStatusChange(s.id, 'PAID')}>Đã trả</button>
                        )}
                        {canDelete && s.status === 'DRAFT' && (
                          <button className="btn-sm btn-delete" title="Xóa" onClick={() => handleDelete(s)}><MdDelete /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {salaries.length === 0 && <tr><td colSpan="9" className="empty-text">Chưa có bảng lương. Nhấn "Tính lương" để tạo.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* Bảng hoa hồng tham khảo (dynamic) */}
          {tiers.length > 0 && (
            <div className="commission-reference">
              <h4>Bảng hoa hồng tham khảo</h4>
              <table className="data-table compact">
                <thead><tr><th>Tổng giờ</th><th>Hoa hồng / giờ</th></tr></thead>
                <tbody>
                  {tiers.filter(t => t.isActive).map((t) => (
                    <tr key={t.id}>
                      <td>{fmt(t.minHours)} – {fmtHours(t.maxHours)}h</td>
                      <td className={Number(t.rate) > 0 ? 'td-money' : ''}>{fmt(t.rate)}đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ===== COMMISSION CONFIG TAB ===== */}
      {activeTab === 'commission' && isAdmin && (
        <div className="commission-config">
          {tiersLoading ? <p className="loading-text">Đang tải cấu hình...</p> : (
            <>
              {/* Base salary config */}
              <div className="config-section">
                <h3>Lương cơ bản</h3>
                <div className="base-salary-form">
                  <div className="form-group">
                    <label>Mức lương cơ bản (đ/tháng)</label>
                    <input
                      type="number"
                      min="0"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(e.target.value)}
                      placeholder="VD: 5000000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Ghi chú</label>
                    <input
                      type="text"
                      value={baseSalaryNote}
                      onChange={(e) => setBaseSalaryNote(e.target.value)}
                      placeholder="Ghi chú (tùy chọn)"
                    />
                  </div>
                  <button
                    className="btn-primary"
                    onClick={handleSaveBaseSalary}
                    disabled={savingBaseSalary}
                  >
                    {savingBaseSalary ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
                {baseSalary && (
                  <p className="config-preview">
                    Hiện tại: <strong className="text-money">{fmt(baseSalary)}đ</strong> / tháng
                  </p>
                )}
              </div>

              {/* Commission tiers */}
              <div className="config-section">
                <div className="config-section-header">
                  <h3>Bảng bậc hoa hồng</h3>
                  <button className="btn-primary" onClick={openCreateTierModal}>
                    <MdAdd /> Thêm bậc
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Từ (giờ)</th>
                        <th>Đến (giờ)</th>
                        <th>Hoa hồng (đ/giờ)</th>
                        <th>Trạng thái</th>
                        <th>Ghi chú</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tiers.map((tier, idx) => (
                        <tr key={tier.id} className={!tier.isActive ? 'row-inactive' : ''}>
                          <td data-label="STT" className="td-hide-mobile">{idx + 1}</td>
                          <td data-label="Từ (giờ)">{fmt(tier.minHours)}</td>
                          <td data-label="Đến (giờ)">{fmtHours(tier.maxHours)}</td>
                          <td className="td-money" data-label="Hoa hồng">{fmt(tier.rate)}đ</td>
                          <td data-label="Trạng thái">
                            <span className={`status-badge ${tier.isActive ? 'active' : 'inactive'}`}>
                              {tier.isActive ? 'Đang bật' : 'Đã tắt'}
                            </span>
                          </td>
                          <td data-label="Ghi chú" className="td-hide-mobile">{tier.note || '—'}</td>
                          <td className="td-actions" data-label="">
                            <button className="btn-sm btn-edit" title="Sửa" onClick={() => openEditTierModal(tier)}>
                              <MdEdit />
                            </button>
                            <button
                              className="btn-sm btn-toggle-tier"
                              title={tier.isActive ? 'Tắt' : 'Bật'}
                              onClick={() => handleToggleTier(tier)}
                            >
                              {tier.isActive ? <MdToggleOn className="toggle-on" /> : <MdToggleOff className="toggle-off" />}
                            </button>
                            <button className="btn-sm btn-delete" title="Xóa" onClick={() => handleDeleteTier(tier)}>
                              <MdDelete />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {tiers.length === 0 && (
                        <tr><td colSpan="7" className="empty-text">Chưa có bậc hoa hồng nào.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal thêm thưởng */}
      {showBonusModal && (
        <div className="modal-overlay" onClick={() => setShowBonusModal(false)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <h3>Thêm thưởng cho {selectedSalary?.user?.fullName}</h3>
            <form onSubmit={handleAddBonus}>
              <div className="form-group"><label>Mô tả *</label><input value={bonusForm.description} onChange={(e) => setBonusForm({ ...bonusForm, description: e.target.value })} required placeholder="VD: Thưởng doanh số" /></div>
              <div className="form-group"><label>Số tiền (đ) *</label><input type="number" min="0" value={bonusForm.amount} onChange={(e) => setBonusForm({ ...bonusForm, amount: e.target.value })} required /></div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowBonusModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Thêm</button>
              </div>
            </form>
            {selectedSalary?.bonuses?.length > 0 && (
              <div className="bonus-list">
                <h4>Thưởng đã thêm:</h4>
                {selectedSalary.bonuses.map((b) => (
                  <div key={b.id} className="bonus-item">
                    <span>{b.description}</span>
                    <strong className="text-money">{fmt(b.amount)}đ</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal thêm/sửa bậc hoa hồng */}
      {showTierModal && (
        <div className="modal-overlay" onClick={() => setShowTierModal(false)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <h3>{editingTier ? 'Sửa bậc hoa hồng' : 'Thêm bậc hoa hồng'}</h3>
            <form onSubmit={handleTierSubmit}>
              <div className="form-group">
                <label>Từ (giờ) *</label>
                <input
                  type="number"
                  min="0"
                  value={tierForm.minHours}
                  onChange={(e) => setTierForm({ ...tierForm, minHours: e.target.value })}
                  required
                  placeholder="VD: 0"
                />
              </div>
              <div className="form-group">
                <label>Đến (giờ) *</label>
                <input
                  type="number"
                  min="0"
                  value={tierForm.maxHours}
                  onChange={(e) => setTierForm({ ...tierForm, maxHours: e.target.value })}
                  required
                  placeholder="VD: 800 (999999 = vô hạn)"
                />
                <small className="form-hint">Nhập 999999 cho giá trị vô hạn (∞)</small>
              </div>
              <div className="form-group">
                <label>Hoa hồng (đ/giờ) *</label>
                <input
                  type="number"
                  min="0"
                  value={tierForm.rate}
                  onChange={(e) => setTierForm({ ...tierForm, rate: e.target.value })}
                  required
                  placeholder="VD: 2500"
                />
              </div>
              <div className="form-group">
                <label>Ghi chú</label>
                <input
                  type="text"
                  value={tierForm.note}
                  onChange={(e) => setTierForm({ ...tierForm, note: e.target.value })}
                  placeholder="Ghi chú (tùy chọn)"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowTierModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">{editingTier ? 'Cập nhật' : 'Thêm'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalaryList;
