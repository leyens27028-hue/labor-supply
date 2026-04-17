import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './MainLayout.css';

const PAGE_TITLES = {
  '/': 'Tổng quan',
  '/users': 'Quản lý User',
  '/teams': 'Quản lý Nhóm',
  '/vendors': 'Quản lý Vendor',
  '/orders': 'Đơn tuyển dụng',
  '/orders/new': 'Tạo đơn tuyển mới',
  '/workers': 'Quản lý Công nhân',
  '/collaborators': 'Cộng tác viên',
  '/working-hours': 'Nhập giờ làm',
  '/salaries': 'Bảng lương',
  '/my-salary': 'Lương của tôi',
  '/factories': 'Quản lý Nhà máy',
};

function getTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/vendors/')) return 'Chi tiết Vendor';
  if (pathname.endsWith('/edit')) return 'Sửa đơn tuyển';
  if (pathname.startsWith('/orders/')) return 'Chi tiết đơn tuyển';
  if (pathname.startsWith('/workers/')) return 'Chi tiết Công nhân';
  return 'Tổng quan';
}

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <div className="main-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header title={title} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
