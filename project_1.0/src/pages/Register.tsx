import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign up with metadata
      // Supabase Trigger will handle profile creation automatically
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            institution: institution,
          }
        }
      });

      if (authError) throw authError;

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.identities?.length === 0) {
            alert('注册成功！该邮箱已被注册，请直接登录。');
            navigate('/login');
        } else if (!data.session) { 
            // If session is null, it usually means email confirmation is required
            alert('注册成功！请前往您的邮箱查收验证邮件以激活账号。');
            navigate('/login');
        } else {
            alert('注册成功！');
            navigate('/login');
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
            注册新会员
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            加入广西自动化学会
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
             <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">姓名</label>
              <div className="mt-1">
                <input
                  id="fullName"
                  type="text"
                  required
                  className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">电子邮箱</label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  required
                  className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">密码</label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  required
                  className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">手机号码</label>
              <div className="mt-1">
                <input
                  id="phone"
                  type="tel"
                  className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="institution" className="block text-sm font-medium text-gray-700">单位 / 学校</label>
              <div className="mt-1">
                <input
                  id="institution"
                  type="text"
                  className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
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
              {loading ? '注册中...' : '注册'}
            </button>
          </div>
           <div className="text-sm text-center">
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
              已有账号？去登录
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
