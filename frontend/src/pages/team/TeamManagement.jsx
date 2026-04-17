import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MdAdd, MdEdit, MdSearch, MdGroup, MdDelete, MdToggleOn, MdToggleOff } from 'react-icons/md';
import teamApi from '../../api/teamApi';
import userApi from '../../api/userApi';
import './TeamManagement.css';

function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [form, setForm] = useState({ name: '', leadId: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [teamsRes, usersRes] = await Promise.all([
        teamApi.getAll(),
        userApi.getAll({ limit: 200 }),
      ]);
      setTeams(teamsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  // Filter teams by search keyword
  const filteredTeams = teams.filter((t) => {
    if (!search) return true;
    const keyword = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(keyword) ||
      t.lead?.fullName?.toLowerCase().includes(keyword)
    );
  });

  // Get users eligible to be team lead (active users, not already leading another team)
  function getAvailableLeads() {
    const currentLeadIds = teams
      .filter((t) => !editTeam || t.id !== editTeam.id)
      .map((t) => t.leadId);
    return users.filter(
      (u) => u.isActive && !currentLeadIds.includes(u.id)
    );
  }

  function openCreate() {
    setEditTeam(null);
    setForm({ name: '', leadId: '' });
    setShowModal(true);
  }

  function openEdit(team) {
    setEditTeam(team);
    setForm({
      name: team.name,
      leadId: team.leadId || '',
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên nhóm');
      return;
    }
    if (!form.leadId) {
      toast.error('Vui lòng chọn trưởng nhóm');
      return;
    }
    try {
      if (editTeam) {
        await teamApi.update(editTeam.id, form);
        toast.success('Cập nhật nhóm thành công');
      } else {
        await teamApi.create(form);
        toast.success('Tạo nhóm thành công');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error(error?.message || 'Có lỗi xảy ra');
    }
  }

  async function handleDelete(team) {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nhóm "${team.name}"? Thành viên trong nhóm sẽ bị gỡ khỏi nhóm.`)) {
      return;
    }
    try {
      await teamApi.remove(team.id);
      toast.success('Xóa nhóm thành công');
      loadData();
    } catch (error) {
      toast.error(error?.message || 'Không thể xóa nhóm');
    }
  }

  async function handleToggleActive(team) {
    const action = team.isActive ? 'vô hiệu hóa' : 'kích hoạt';
    if (!window.confirm(`Bạn có chắc chắn muốn ${action} nhóm "${team.name}"?`)) {
      return;
    }
    try {
      await teamApi.toggleActive(team.id);
      toast.success(`${team.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'} nhóm thành công`);
      loadData();
    } catch (error) {
      toast.error(error?.message || 'Có lỗi xảy ra');
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  }

  return (
    <div className="team-management">
      <div className="page-header">
        <h2>Quản lý Nhóm</h2>
        <button className="btn-primary" onClick={openCreate}>
          <MdAdd /> Tạo nhóm
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <MdSearch />
          <input
            type="text"
            placeholder="Tìm theo tên nhóm, trưởng nhóm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Đang tải...</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên nhóm</th>
                <th>Trưởng nhóm</th>
                <th>Số thành viên</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((t) => (
                <tr key={t.id} className={t.isActive === false ? 'row-inactive' : ''}>
                  <td className="td-name">
                    <MdGroup className="team-icon" />
                    {t.name}
                  </td>
                  <td>{t.lead?.fullName || '—'}</td>
                  <td>
                    <span className="member-count">{t._count?.members ?? t.members?.length ?? 0}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${t.isActive === false ? 'status-inactive' : 'status-active'}`}>
                      {t.isActive === false ? 'Vô hiệu' : 'Hoạt động'}
                    </span>
                  </td>
                  <td>{formatDate(t.createdAt)}</td>
                  <td className="td-actions">
                    <button className="btn-icon" title="Sửa" onClick={() => openEdit(t)}>
                      <MdEdit />
                    </button>
                    <button
                      className={`btn-icon ${t.isActive === false ? 'btn-activate' : 'btn-deactivate'}`}
                      title={t.isActive === false ? 'Kích hoạt' : 'Vô hiệu hóa'}
                      onClick={() => handleToggleActive(t)}
                    >
                      {t.isActive === false ? <MdToggleOff /> : <MdToggleOn />}
                    </button>
                    <button className="btn-icon btn-delete" title="Xóa" onClick={() => handleDelete(t)}>
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTeams.length === 0 && (
                <tr><td colSpan="6" className="empty-text">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal tạo/sửa nhóm */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editTeam ? 'Cập nhật nhóm' : 'Tạo nhóm mới'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên nhóm *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nhập tên nhóm"
                  required
                />
              </div>
              <div className="form-group">
                <label>Trưởng nhóm *</label>
                <select
                  value={form.leadId}
                  onChange={(e) => setForm({ ...form, leadId: e.target.value })}
                  required
                >
                  <option value="">-- Chọn trưởng nhóm --</option>
                  {getAvailableLeads().map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                  {/* Keep current lead visible in edit mode */}
                  {editTeam && editTeam.lead && !getAvailableLeads().find((u) => u.id === editTeam.leadId) && (
                    <option value={editTeam.leadId}>
                      {editTeam.lead.fullName} ({editTeam.lead.email})
                    </option>
                  )}
                </select>
              </div>

              {/* Show current members in edit mode */}
              {editTeam && editTeam.members && editTeam.members.length > 0 && (
                <div className="form-group">
                  <label>Thành viên hiện tại</label>
                  <div className="member-list">
                    {editTeam.members.map((m) => (
                      <span key={m.id} className="member-tag">
                        {m.fullName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {editTeam ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamManagement;
