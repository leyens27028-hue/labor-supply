import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdAdd, MdEdit, MdLockReset, MdSearch } from 'react-icons/md';
import userApi from '../../api/userApi';
import teamApi from '../../api/teamApi';
import { ROLE_LABELS, ROLE_COLORS } from '../../utils/roles';
import './UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({
    email: '', password: '', fullName: '', phone: '', role: 'SALE', teamId: '',
  });

  useEffect(() => {
    loadData();
  }, [search, filterRole]);

  async function loadData() {
    try {
      setLoading(true);
      const [usersRes, teamsRes] = await Promise.all([
        userApi.getAll({ search: search || undefined, role: filterRole || undefined, limit: 50 }),
        teamApi.getAll(),
      ]);
      setUsers(usersRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditUser(null);
    setForm({ email: '', password: '', fullName: '', phone: '', role: 'SALE', teamId: '' });
    setShowModal(true);
  }

  function openEdit(user) {
    setEditUser(user);
    setForm({
      email: user.email,
      password: '',
      fullName: user.fullName,
      phone: user.phone || '',
      role: user.role,
      teamId: user.teamId || '',
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editUser) {
        const { password, email, ...updateData } = form;
        await userApi.update(editUser.id, updateData);
        toast.success('Cập nhật thành công');
      } else {
        if (!form.password) {
          toast.error('Vui lòng nhập mật khẩu');
          return;
        }
        await userApi.create(form);
        toast.success('Tạo tài khoản thành công');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error(error?.message || 'Có lỗi xảy ra');
    }
  }

  async function handleResetPassword(user) {
    const newPassword = prompt(`Nhập mật khẩu mới cho ${user.fullName}:`);
    if (!newPassword) return;
    try {
      await userApi.resetPassword(user.id, { newPassword });
      toast.success(`Đã reset mật khẩu cho ${user.fullName}`);
    } catch (error) {
      toast.error(error?.message || 'Có lỗi xảy ra');
    }
  }

  async function handleToggleActive(user) {
    try {
      await userApi.update(user.id, { isActive: !user.isActive });
      toast.success(user.isActive ? 'Đã vô hiệu hóa' : 'Đã kích hoạt lại');
      loadData();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  }

  return (
    <div className="user-management">
      <div className="page-header">
        <h2>Quản lý Tài khoản</h2>
        <button className="btn-primary" onClick={openCreate}>
          <MdAdd /> Tạo mới
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <MdSearch />
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="">Tất cả vai trò</option>
          <option value="ADMIN">Quản trị viên</option>
          <option value="DIRECTOR">Giám đốc</option>
          <option value="TEAM_LEAD">Trưởng nhóm</option>
          <option value="SALE">Nhân viên Sale</option>
        </select>
      </div>

      {loading ? (
        <p className="loading-text">Đang tải...</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Vai trò</th>
                <th>Nhóm</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={!u.isActive ? 'inactive-row' : ''}>
                  <td className="td-name">{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td>
                    <span className="role-badge" style={{ background: ROLE_COLORS[u.role] }}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td>{u.team?.name || '—'}</td>
                  <td>
                    <span className={`status-dot ${u.isActive ? 'active' : 'inactive'}`}>
                      {u.isActive ? 'Hoạt động' : 'Vô hiệu'}
                    </span>
                  </td>
                  <td className="td-actions">
                    <button className="btn-icon" title="Sửa" onClick={() => openEdit(u)}>
                      <MdEdit />
                    </button>
                    <button className="btn-icon" title="Reset mật khẩu" onClick={() => handleResetPassword(u)}>
                      <MdLockReset />
                    </button>
                    <button
                      className={`btn-toggle ${u.isActive ? 'danger' : 'success'}`}
                      onClick={() => handleToggleActive(u)}
                    >
                      {u.isActive ? 'Vô hiệu' : 'Kích hoạt'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="7" className="empty-text">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal tạo/sửa user */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editUser ? 'Cập nhật tài khoản' : 'Tạo tài khoản mới'}</h3>
            <form onSubmit={handleSubmit}>
              {!editUser && (
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              )}
              {!editUser && (
                <div className="form-group">
                  <label>Mật khẩu *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    minLength={6}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Họ tên *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Vai trò *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="SALE">Nhân viên Sale</option>
                    <option value="TEAM_LEAD">Trưởng nhóm</option>
                    <option value="DIRECTOR">Giám đốc</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Nhóm</label>
                  <select
                    value={form.teamId}
                    onChange={(e) => setForm({ ...form, teamId: e.target.value })}
                  >
                    <option value="">Không thuộc nhóm</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {editUser ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
