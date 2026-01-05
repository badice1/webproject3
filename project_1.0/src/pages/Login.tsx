// 导入React核心和useState钩子
import React, { useState } from 'react';

// 导入路由相关钩子和组件：useNavigate用于页面跳转，Link用于导航链接
import { useNavigate, Link } from 'react-router-dom';
// 导入Supabase客户端实例，用于登录认证
import { supabase } from '../lib/supabase';

/**
 * 登录页面组件
 * 提供会员和管理员的登录功能
 * 包含邮箱密码输入、表单验证、登录逻辑和错误处理
 */
const Login: React.FC = () => {
  // 邮箱状态
  const [email, setEmail] = useState('');
  // 密码状态
  const [password, setPassword] = useState('');
  // 加载状态，用于控制登录按钮的禁用和文本显示
  const [loading, setLoading] = useState(false);
  // 错误信息状态，用于显示登录失败的原因
  const [error, setError] = useState<string | null>(null);
  // 导航钩子，用于登录成功后的页面跳转
  const navigate = useNavigate();

  /**
   * 登录表单提交处理函数
   * @param e - 表单提交事件
   */
  const handleLogin = async (e: React.FormEvent) => {
    // 阻止表单默认提交行为
    e.preventDefault();
    // 设置加载状态为true
    setLoading(true);
    // 清除之前的错误信息
    setError(null);

    try {
      // 调用Supabase的signInWithPassword方法进行登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email, // 邮箱地址
        password, // 密码
      });

      // 如果登录失败，抛出错误
      if (error) throw error;

      // 登录成功后，手动获取用户角色，用于快速跳转到对应页面
      // 这里没有依赖AuthContext的profile，因为profile可能不会立即加载
      if (data.user) {
         // 从profiles表中查询用户角色
         const { data: profileData } = await supabase
          .from('profiles') // 指定表名
          .select('role') // 只查询role字段，提高查询效率
          .eq('id', data.user.id) // 按用户ID筛选
          .single(); // 只返回一条记录
         
         // 根据用户角色跳转到对应页面
         if (profileData?.role === 'admin') {
           navigate('/admin'); // 管理员跳转到管理员仪表盘
         } else {
           navigate('/member'); // 普通会员跳转到会员仪表盘
         }
      }
    } catch (err: any) {
      // 处理登录错误
      console.error("Login failed:", err);
      // 根据错误类型显示不同的错误信息
      if (err.message === 'Failed to fetch') {
        setError('连接服务器失败。请检查您的网络连接，或确认系统维护状态。');
      } else {
        setError(err.message || '登录发生错误');
      }
    } finally {
      // 无论登录成功还是失败，都设置加载状态为false
      setLoading(false);
    }
  };

  // 渲染登录页面UI
  return (
    // 页面根容器，设置全屏高度、背景色和居中布局
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* 登录表单容器 */}
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg">
        {/* 标题区域 */}
        <div>
          {/* 主标题 */}
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-gray-900">
            广西自动化学会
          </h2>
          {/* 副标题 */}
          <p className="mt-2 text-center text-sm text-gray-600">
            会员管理系统
          </p>
        </div>
        
        {/* 登录表单 */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {/* 表单输入区域 */}
          <div className="space-y-4">
            {/* 邮箱输入字段 */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700"
              >
                电子邮箱
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* 密码输入字段 */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700"
              >
                密码
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 错误信息显示 */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {/* 登录按钮 */}
          <div>
            <button
              type="submit"
              disabled={loading} // 加载状态下禁用按钮
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-colors duration-200"
            >
              {/* 根据加载状态显示不同的文本 */}
              {loading ? '登录中...' : '登录'}
            </button>
          </div>
          
          {/* 注册和忘记密码链接 */}
          <div className="flex items-center justify-between text-sm">
            {/* 注册链接 */}
            <Link 
              to="/register" 
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              还没有账号？去注册
            </Link>
            {/* 忘记密码链接 */}
            <Link 
              to="/forgot-password" 
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              忘记密码？
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
};

// 导出Login组件
export default Login;
