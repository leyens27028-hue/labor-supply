import { NavLink } from 'react-router-dom';
import {
  MdDashboard, MdPeople, MdGroups, MdBusiness, MdAssignment,
  MdEngineering, MdHandshake, MdPayments, MdLogout, MdAccessTime,
  MdFactory,
} from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import { MENU_CONFIG, ROLE_LABELS } from '../../utils/roles';
import './Sidebar.css';

const ICON_MAP = {
  MdDashboard: <MdDashboard />,
  MdPeople: <MdPeople />,
  MdGroups: <MdGroups />,
  MdBusiness: <MdBusiness />,
  MdAssignment: <MdAssignment />,
  MdEngineering: <MdEngineering />,
  MdHandshake: <MdHandshake />,
  MdPayments: <MdPayments />,
  MdAccessTime: <MdAccessTime />,
  MdFactory: <MdFactory />,
};

function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const menuItems = MENU_CONFIG[user?.role] || [];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Cung Ứng LĐ</h2>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{user?.fullName?.[0]}</div>
          <div className="user-info">
            <span className="user-name">{user?.fullName}</span>
            <span className="user-role">{ROLE_LABELS[user?.role]}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="nav-icon">{ICON_MAP[item.icon]}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>
            <MdLogout /> Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
