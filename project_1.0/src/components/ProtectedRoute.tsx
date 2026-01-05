// 导入React核心
import React from 'react';
// 导入路由相关组件：Navigate用于重定向，Outlet用于渲染子路由
import { Navigate, Outlet } from 'react-router-dom';
// 导入自定义的useAuth钩子，用于获取用户认证状态
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute组件的属性接口
 * @property role - 可选，指定允许访问的角色，可以是'member'或'admin'
 */
interface ProtectedRouteProps {
  role?: 'member' | 'admin';
}

/**
 * 路由保护组件，用于控制页面访问权限
 * 根据用户的登录状态和角色来决定是否允许访问受保护的路由
 * @param props - 组件属性，包含可选的role
 * @returns 允许访问时渲染子路由，否则重定向到相应页面
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ role }) => {
  // 使用useAuth钩子获取用户状态：user(用户对象)、profile(用户资料)、loading(加载状态)
  const { user, profile, loading } = useAuth();

  // 如果用户信息正在加载中，显示加载提示
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // 如果用户未登录，重定向到登录页面
  // replace属性表示替换当前历史记录，而不是添加新的记录
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 如果指定了角色，并且获取到了用户profile，进行角色验证
  if (role && profile) {
    // 如果需要管理员角色，但用户不是管理员，重定向到会员页面
    if (role === 'admin' && profile.role !== 'admin') {
       return <Navigate to="/member" replace />;
    }
    // 注意：如果角色是member，所有登录用户都可以访问，因为admin角色也属于member权限范围
  }

  // 如果所有条件都满足，渲染子路由（通过Outlet组件）
  return <Outlet />;
};

// 导出ProtectedRoute组件，供其他文件使用
export default ProtectedRoute;
