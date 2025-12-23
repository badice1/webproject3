import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a session (user clicked the email link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setMessage({ type: 'error', text: '无效或过期的链接，请重新申请重置密码。' });
      }
    });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的密码不一致' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setMessage({ type: 'success', text: '密码修改成功！正在跳转登录页...' });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '密码修改失败' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            重置密码
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            请输入您的新密码
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleUpdatePassword}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <input
                type="password"
                required
                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                placeholder="新密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                placeholder="确认新密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {message && (
            <div className={`text-sm text-center ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
              {message.text}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {loading ? '提交中...' : '确认修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
