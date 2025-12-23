import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, Menu, X } from 'lucide-react';
import MessageCenter from './MessageCenter';
import EventBoard from './EventBoard';

const MemberProfile: React.FC = () => {
  const { profile, loading, user } = useAuth();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setLoadingEmail(true);
    try {
        const { error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) throw error;
        alert('验证邮件已发送！请查收您的原邮箱和新邮箱进行确认。');
        setShowEmailModal(false);
        setNewEmail('');
    } catch (err: any) {
        alert('发送失败: ' + err.message);
    } finally {
        setLoadingEmail(false);
    }
  };

  if (loading) return <div>系统加载中...</div>;
  
  if (!profile) {
      return (
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-lg font-medium text-red-600">无法加载会员资料</h3>
            <p className="mt-2 text-gray-500">
              可能是因为您的账号刚刚注册，资料尚未同步。请尝试刷新页面。
            </p>
            <p className="mt-1 text-xs text-gray-400">User ID: {user?.id}</p>
          </div>
      );
  }

  const getLevelName = (level: string | undefined) => {
    switch(level) {
      case 'General': return '普通会员';
      case 'Student': return '学生会员';
      case 'Director': return '理事';
      case 'Chairman': return '理事长';
      case 'Vice Chairman': return '副理事长';
      case 'Secretary': return '秘书长';
      default: return level || '普通会员';
    }
  };

  const getPaymentStatus = (status: string | undefined) => {
      // Assuming 'paid', 'unpaid' or similar. 
      // If it's just arbitrary string, we might need more logic.
      // Let's assume default English values and translate them.
      if (!status) return '未缴费';
      if (status.toLowerCase() === 'paid') return '已缴费';
      if (status.toLowerCase() === 'unpaid') return '未缴费';
      return status;
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">会员信息</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">个人详情与会员状态</p>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">姓名</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.full_name}</dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">电子邮箱</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.email}</dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">会员等级</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{getLevelName(profile.membership_level)}</dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">会员状态</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                profile.membership_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {profile.membership_status === 'active' ? '活跃' : '待定/不活跃'}
              </span>
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">缴费状态</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{getPaymentStatus(profile.payment_status)}</dd>
          </div>
           <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">单位 / 学校</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.institution}</dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">操作</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <button 
                  onClick={() => setShowEmailModal(true)}
                  className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
                >
                  更换绑定邮箱
                </button>
            </dd>
          </div>
        </dl>
      </div>

      {/* Change Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">更换绑定邮箱</h3>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">关闭</span>
                <X className="h-6 w-6" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              为了保障账号安全，更换邮箱需要进行双重验证：<br/>
              1. 系统将发送一封<b>解绑确认邮件</b>到您的原邮箱。<br/>
              2. 确认解绑后，系统将发送一封<b>绑定确认邮件</b>到您的新邮箱。<br/>
              3. 您需要点击两封邮件中的链接才能完成更改。
            </p>
            <form onSubmit={handleEmailChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">新邮箱地址</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="请输入新邮箱"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loadingEmail}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loadingEmail ? '发送请求中...' : '发送验证邮件'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const MemberApplication: React.FC = () => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('applications')
        .insert([
          {
            user_id: user.id,
            content: JSON.stringify({ reason: content }),
            full_name: user.email, // Just a placeholder, ideally fetch profile name
            status: 'pending'
          }
        ]);

      if (error) throw error;
      setMessage({ type: 'success', text: '申请已提交（模拟邮件发送系统）。' });
      setContent('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">入会 / 升级申请</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>请填写以下表格向委员会提交您的申请。</p>
        </div>
        <form className="mt-5 sm:flex sm:items-center" onSubmit={handleSubmit}>
          <div className="w-full sm:max-w-xs">
            <label htmlFor="content" className="sr-only">申请理由</label>
            <textarea
              id="content"
              name="content"
              rows={3}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              placeholder="您为何想加入或升级会员？"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:mt-0 sm:w-auto transition-colors duration-200"
          >
            {loading ? '发送中...' : '发送申请'}
          </button>
        </form>
        {message && (
          <div className={`mt-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

const MemberDashboard: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Default redirect logic
  useEffect(() => {
      // If we are at the root path of the dashboard (/member or /member/), 
      // we don't need to do anything because the Route index handles it.
      // But if the user is asking for "auto select", visual highlighting is already handled by isActive.
      // The issue might be that when they login, they go to /member, and if the index route wasn't working, it would be blank.
      // We fixed the index route in the previous step. 
      // Let's add a safety check: if we are at /member/ (trailing slash), replace to /member
      if (location.pathname === '/member/') {
          navigate('/member', { replace: true });
      }
  }, [location.pathname, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/member') {
      return location.pathname === '/member' || location.pathname === '/member/';
    }
    return location.pathname.startsWith(path);
  };

  const linkClass = (path: string) => 
    `inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors duration-200 ${
      isActive(path)
        ? 'border-indigo-500 text-gray-900'
        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    }`;

  const mobileLinkClass = (path: string) =>
    `block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 ${
      isActive(path)
        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <span className="font-bold text-xl text-indigo-600 tracking-tight">会员中心</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link to="/member" className={linkClass('/member')}>
                  个人资料
                </Link>
                <Link to="/member/apply" className={linkClass('/member/apply')}>
                  申请入会
                </Link>
                <Link to="/member/messages" className={linkClass('/member/messages')}>
                  消息中心
                </Link>
                <Link to="/member/events" className={linkClass('/member/events')}>
                  活动公告
                </Link>
              </div>
            </div>
            <div className="hidden sm:flex sm:items-center">
              <button
                onClick={handleSignOut}
                className="relative inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="-ml-0.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                退出登录
              </button>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                <span className="sr-only">打开菜单</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-white border-t border-gray-200">
            <div className="space-y-1 pt-2 pb-3">
              <Link
                to="/member"
                className={mobileLinkClass('/member')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                个人资料
              </Link>
              <Link
                to="/member/apply"
                className={mobileLinkClass('/member/apply')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                申请入会
              </Link>
              <Link
                to="/member/messages"
                className={mobileLinkClass('/member/messages')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                消息中心
              </Link>
              <Link
                to="/member/events"
                className={mobileLinkClass('/member/events')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                活动公告
              </Link>
            </div>
            <div className="border-t border-gray-200 pt-4 pb-4">
              <div className="flex items-center px-4">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-x-2 rounded-md bg-red-50 px-3 py-2 text-base font-medium text-red-700 hover:bg-red-100"
                >
                  <LogOut className="h-5 w-5" />
                  退出登录
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="py-6 sm:py-10">
        <header>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">仪表盘</h1>
          </div>
        </header>
        <main>
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 mt-8">
             <Routes>
               <Route index element={<MemberProfile />} />
               <Route path="apply" element={<MemberApplication />} />
               <Route path="messages" element={<MessageCenter />} />
               <Route path="events" element={<EventBoard />} />
             </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MemberDashboard;
