// Nhãn tiếng Việt cho role
export const ROLE_LABELS = {
  ADMIN: 'Quản trị viên',
  DIRECTOR: 'Giám đốc',
  TEAM_LEAD: 'Trưởng nhóm',
  SALE: 'Nhân viên Sale',
};

// Màu badge cho role
export const ROLE_COLORS = {
  ADMIN: '#e74c3c',
  DIRECTOR: '#8e44ad',
  TEAM_LEAD: '#2980b9',
  SALE: '#27ae60',
};

// Menu theo role
export const MENU_CONFIG = {
  ADMIN: [
    { key: 'dashboard', label: 'Tổng quan', path: '/', icon: 'MdDashboard' },
    { key: 'users', label: 'Quản lý User', path: '/users', icon: 'MdPeople' },
    { key: 'teams', label: 'Quản lý Nhóm', path: '/teams', icon: 'MdGroups' },
    { key: 'vendors', label: 'Vendor', path: '/vendors', icon: 'MdBusiness' },
    { key: 'factories', label: 'Nhà máy', path: '/factories', icon: 'MdFactory' },
    { key: 'orders', label: 'Đơn tuyển', path: '/orders', icon: 'MdAssignment' },
    { key: 'workers', label: 'Công nhân', path: '/workers', icon: 'MdEngineering' },
    { key: 'collaborators', label: 'CTV', path: '/collaborators', icon: 'MdHandshake' },
    { key: 'working-hours', label: 'Nhập giờ', path: '/working-hours', icon: 'MdAccessTime' },
    { key: 'salaries', label: 'Bảng lương', path: '/salaries', icon: 'MdPayments' },
  ],
  DIRECTOR: [
    { key: 'dashboard', label: 'Tổng quan', path: '/', icon: 'MdDashboard' },
    { key: 'vendors', label: 'Vendor', path: '/vendors', icon: 'MdBusiness' },
    { key: 'factories', label: 'Nhà máy', path: '/factories', icon: 'MdFactory' },
    { key: 'orders', label: 'Đơn tuyển', path: '/orders', icon: 'MdAssignment' },
    { key: 'workers', label: 'Công nhân', path: '/workers', icon: 'MdEngineering' },
    { key: 'working-hours', label: 'Nhập giờ', path: '/working-hours', icon: 'MdAccessTime' },
    { key: 'salaries', label: 'Bảng lương', path: '/salaries', icon: 'MdPayments' },
    { key: 'teams', label: 'Nhóm Sale', path: '/teams', icon: 'MdGroups' },
  ],
  TEAM_LEAD: [
    { key: 'dashboard', label: 'Tổng quan', path: '/', icon: 'MdDashboard' },
    { key: 'orders', label: 'Đơn tuyển', path: '/orders', icon: 'MdAssignment' },
    { key: 'workers', label: 'Công nhân', path: '/workers', icon: 'MdEngineering' },
    { key: 'collaborators', label: 'CTV', path: '/collaborators', icon: 'MdHandshake' },
    { key: 'working-hours', label: 'Nhập giờ', path: '/working-hours', icon: 'MdAccessTime' },
    { key: 'salaries', label: 'Bảng lương', path: '/salaries', icon: 'MdPayments' },
  ],
  SALE: [
    { key: 'dashboard', label: 'Tổng quan', path: '/', icon: 'MdDashboard' },
    { key: 'orders', label: 'Đơn tuyển', path: '/orders', icon: 'MdAssignment' },
    { key: 'workers', label: 'Công nhân', path: '/workers', icon: 'MdEngineering' },
    { key: 'collaborators', label: 'CTV của tôi', path: '/collaborators', icon: 'MdHandshake' },
    { key: 'working-hours', label: 'Nhập giờ', path: '/working-hours', icon: 'MdAccessTime' },
    { key: 'salary', label: 'Lương của tôi', path: '/my-salary', icon: 'MdPayments' },
  ],
};
