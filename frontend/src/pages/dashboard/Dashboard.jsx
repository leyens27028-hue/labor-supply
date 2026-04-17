import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../utils/roles';
import dashboardApi from '../../api/dashboardApi';
import {
  MdAssignment,
  MdEngineering,
  MdBusiness,
  MdAccessTime,
  MdPeople,
  MdHandshake,
  MdGroups,
} from 'react-icons/md';
import './Dashboard.css';

// eslint-disable-next-line
const STAT_CARDS = [
  { key: 'openOrders', label: 'Đơn tuyển đang mở', icon: MdAssignment, color: '#1a73e8' },
  { key: 'workingWorkers', label: 'Công nhân đang làm', icon: MdEngineering, color: '#e67e22' },
  { key: 'activeVendors', label: 'Vendor hoạt động', icon: MdBusiness, color: '#2ecc71' },
  { key: 'totalHoursThisMonth', label: 'Tổng giờ tháng này', icon: MdAccessTime, color: '#9b59b6' },
  { key: 'activeSales', label: 'Sale đang hoạt động', icon: MdPeople, color: '#e74c3c' },
  { key: 'activeCollaborators', label: 'CTV', icon: MdHandshake, color: '#00bcd4' },
  { key: 'totalTeams', label: 'Số nhóm', icon: MdGroups, color: '#ff9800' },
];

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardApi.getStats();
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatNumber = (val) => {
    if (loading) return '...';
    if (val == null) return '0';
    return Number(val).toLocaleString('vi-VN');
  };

  return (
    <div className="dashboard">
      <div className="welcome-card">
        <div className="welcome-content">
          <h2>{"Xin chào, "}{user?.fullName}{"!"}</h2>
          <p>{"Vai trò: "}<strong>{ROLE_LABELS[user?.role]}</strong></p>
          {user?.team && <p>{"Nhóm: "}<strong>{user.team.name}</strong></p>}
        </div>
        <div className="welcome-decoration" />
      </div>

      <div className="stats-grid">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              className="stat-card"
              key={card.key}
              style={{ '--accent': card.color }}
            >
              <div className="stat-icon">
                <Icon />
              </div>
              <div className="stat-info">
                <div className="stat-number">{formatNumber(stats?.[card.key])}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;
