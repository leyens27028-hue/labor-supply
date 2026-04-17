import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import VendorList from './pages/vendor/VendorList';
import VendorDetail from './pages/vendor/VendorDetail';
import OrderList from './pages/recruitment/OrderList';
import OrderForm from './pages/recruitment/OrderForm';
import OrderDetail from './pages/recruitment/OrderDetail';
import WorkerList from './pages/worker/WorkerList';
import WorkerDetail from './pages/worker/WorkerDetail';
import CollaboratorList from './pages/collaborator/CollaboratorList';
import SalaryList from './pages/salary/SalaryList';
import MySalary from './pages/salary/MySalary';
import WorkingHoursPage from './pages/salary/WorkingHoursPage';
import TeamManagement from './pages/team/TeamManagement';
import FactoryList from './pages/factory/FactoryList';

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />

      <Route element={<MainLayout />}>
        {/* Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Admin: Quản lý User */}
        <Route path="/users" element={<ProtectedRoute roles={['ADMIN']}><UserManagement /></ProtectedRoute>} />

        {/* Vendor & Nhà máy */}
        <Route path="/vendors" element={<VendorList />} />
        <Route path="/vendors/:id" element={<VendorDetail />} />
        <Route path="/factories" element={<FactoryList />} />

        {/* Đơn tuyển dụng */}
        <Route path="/orders" element={<OrderList />} />
        <Route path="/orders/new" element={<ProtectedRoute roles={['ADMIN', 'DIRECTOR', 'TEAM_LEAD']}><OrderForm /></ProtectedRoute>} />
        <Route path="/orders/:id/edit" element={<ProtectedRoute roles={['ADMIN', 'DIRECTOR', 'TEAM_LEAD']}><OrderForm /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<OrderDetail />} />

        {/* Công nhân */}
        <Route path="/workers" element={<WorkerList />} />
        <Route path="/workers/:id" element={<WorkerDetail />} />

        {/* CTV */}
        <Route path="/collaborators" element={<CollaboratorList />} />

        {/* Bảng lương */}
        <Route path="/salaries" element={<ProtectedRoute roles={['ADMIN', 'DIRECTOR', 'TEAM_LEAD']}><SalaryList /></ProtectedRoute>} />
        <Route path="/working-hours" element={<ProtectedRoute roles={['ADMIN', 'DIRECTOR', 'TEAM_LEAD', 'SALE']}><WorkingHoursPage /></ProtectedRoute>} />
        <Route path="/my-salary" element={<ProtectedRoute roles={['SALE']}><MySalary /></ProtectedRoute>} />

        {/* Nhóm */}
        <Route path="/teams" element={<ProtectedRoute roles={['ADMIN', 'DIRECTOR']}><TeamManagement /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
