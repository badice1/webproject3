// 导入React Router的核心组件，用于定义路由
import { Routes, Route } from 'react-router-dom';

// 导入所有页面组件
import Login from './pages/Login'; // 登录页面
import Register from './pages/Register'; // 注册页面
import ForgotPassword from './pages/ForgotPassword'; // 忘记密码页面
import ResetPassword from './pages/ResetPassword'; // 重置密码页面
import MemberDashboard from './pages/MemberDashboard'; // 会员仪表盘
import AdminDashboard from './pages/AdminDashboard'; // 管理员仪表盘
import ProtectedRoute from './components/ProtectedRoute'; // 路由保护组件

/**
 * 应用的根组件，定义了所有路由配置
 * 负责将不同的URL路径映射到对应的页面组件
 */
function App() {
  return (
    // 应用的根容器，设置最小高度和背景色
    <div className="min-h-screen bg-gray-50">
      {/* 路由配置容器 */}
      <Routes>
        {/* 公开路由 - 无需登录即可访问 */}
        <Route path="/login" element={<Login />} /> {/* 登录页面路由 */}
        <Route path="/register" element={<Register />} /> {/* 注册页面路由 */}
        <Route path="/forgot-password" element={<ForgotPassword />} /> {/* 忘记密码页面路由 */}
        <Route path="/reset-password" element={<ResetPassword />} /> {/* 重置密码页面路由 */}
        
        {/* 受保护路由 - 只有会员可以访问 */}
        <Route 
          element={<ProtectedRoute role="member" />} // 使用ProtectedRoute组件保护，指定角色为member
        >
          {/* 会员仪表盘路由，使用通配符*允许子路由 */}
          <Route path="/member/*" element={<MemberDashboard />} />
        </Route>

        {/* 受保护路由 - 只有管理员可以访问 */}
        <Route 
          element={<ProtectedRoute role="admin" />} // 使用ProtectedRoute组件保护，指定角色为admin
        >
          {/* 管理员仪表盘路由，使用通配符*允许子路由 */}
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Route>

        {/* 默认路由 - 访问根路径时重定向到登录页面 */}
        <Route path="/" element={<Login />} />
      </Routes>
    </div>
  );
}

// 导出App组件，作为应用的根组件
export default App;
