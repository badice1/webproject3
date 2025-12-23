import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: '密码重置链接已发送到您的邮箱，请查收。',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || '发送失败，请稍后重试。',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            找回密码
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            请输入您的注册邮箱，我们将发送重置链接给您。
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
          <div className="rounded-md shadow-sm">
            <div>
              <input
                type="email"
                required
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                placeholder="电子邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {loading ? '发送中...' : '发送重置链接'}
            </button>
          </div>

          <div className="text-sm text-center">
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              返回登录
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
