import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MemberDashboard from './pages/MemberDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route element={<ProtectedRoute role="member" />}>
          <Route path="/member/*" element={<MemberDashboard />} />
        </Route>

        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Route>

        <Route path="/" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;
