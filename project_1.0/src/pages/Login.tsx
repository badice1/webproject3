import React, { useState } from 'react';

import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Profile might not be loaded instantly in context, so we fetch it manually to decide redirect or wait for AuthContext update
      // But for better UX, we can just fetch it here or rely on the redirect logic in a useEffect.
      // Let's fetch the role directly here to speed up redirect.
      if (data.user) {
         const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
         
         if (profileData?.role === 'admin') {
           navigate('/admin');
         } else {
           navigate('/member');
         }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-gray-900">
            广西自动化学会
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            会员管理系统
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-colors duration-200"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
              还没有账号？去注册
            </Link>
            <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
              忘记密码？
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
