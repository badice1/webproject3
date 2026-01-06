import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Profile, Application } from '../types';
import * as XLSX from 'xlsx';
import { LogOut, Download, Mail, Edit, Check, X, Menu } from 'lucide-react';

const MemberList: React.FC = () => {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error(error);
    else setMembers(data || []);
    setLoading(false);
  };

  const handleExport = () => {
    const dataToExport = members.map(m => ({
      "姓名": m.full_name,
      "邮箱": m.email,
      "角色": m.role === 'admin' ? '管理员' : '会员',
      "会员等级": m.membership_level,
      "状态": m.membership_status,
      "剩余时长": m.membership_duration_days,
      "电话": m.phone,
      "单位": m.institution,
      "加入时间": m.join_date
    }));
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, "members_list.xlsx");
  };

  const startEdit = (member: Profile) => {
    setEditingId(member.id);
    setEditForm({ 
      membership_level: member.membership_level, 
      role: member.role,
      membership_duration_days: member.membership_duration_days || 0
    });
  };

  const saveEdit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(editForm)
        .eq('id', id);
      
      if (error) throw error;
      
      setMembers(members.map(m => m.id === id ? { ...m, ...editForm } : m));
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert('更新会员失败');
    }
  };

  const sendEmail = (email: string) => {
    window.location.href = `mailto:${email}?subject=通知&body=请查看门户网站上的最新通知。`;
  };

  const getLevelName = (level: string) => {
    const levelMap: Record<string, string> = {
      General: '普通会员',
      Student: '学生会员',
      Director: '理事',
      Chairman: '理事长',
      'Vice Chairman': '副理事长',
      Secretary: '秘书长'
    };
    return levelMap[level] || level;
  };

  const getStatusName = (status: string) => {
    const statusMap: Record<string, string> = {
      active: '正常',
      pending: '待审核',
      rejected: '已拒绝'
    };
    return statusMap[status] || status;
  };

  if (loading) return <div>加载会员中...</div>;

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">会员管理</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">查看并管理所有会员信息。</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
        >
          <Download className="mr-2 h-4 w-4" /> 导出 Excel
        </button>
      </div>
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名 / 邮箱</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单位 / 电话</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">等级 / 角色</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">剩余时长</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">操作</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{member.full_name}</div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{member.institution || '-'}</div>
                        <div className="text-sm text-gray-500">{member.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === member.id ? (
                          <div className="flex flex-col gap-2">
                             <select 
                              className="text-sm border rounded"
                              value={editForm.membership_level}
                              onChange={e => setEditForm({...editForm, membership_level: e.target.value})}
                             >
                               <option value="General">普通会员</option>
                               <option value="Student">学生会员</option>
                               <option value="Director">理事</option>
                               <option value="Chairman">理事长</option>
                               <option value="Vice Chairman">副理事长</option>
                               <option value="Secretary">秘书长</option>
                             </select>
                             <select 
                              className="text-sm border rounded"
                              value={editForm.role}
                              onChange={e => setEditForm({...editForm, role: e.target.value as 'admin' | 'member'})}
                             >
                               <option value="member">会员</option>
                               <option value="admin">管理员</option>
                             </select>
                          </div>
                        ) : (
                          <>
                             <div className="text-sm text-gray-900">{getLevelName(member.membership_level || '')}</div>
                             <div className="text-xs text-gray-500 capitalize">{member.role === 'admin' ? '管理员' : '会员'}</div>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.membership_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {getStatusName(member.membership_status || '')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === member.id ? (
                          <input
                            type="number"
                            min="0"
                            className="text-sm border rounded px-2 py-1"
                            value={editForm.membership_duration_days}
                            onChange={e => setEditForm({...editForm, membership_duration_days: parseInt(e.target.value) || 0})}
                          />
                        ) : (
                          <div className="text-sm text-gray-900">
                            {member.membership_duration_days || 0} 天
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingId === member.id ? (
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => saveEdit(member.id)} className="text-green-600 hover:text-green-900"><Check className="h-5 w-5"/></button>
                            <button onClick={() => setEditingId(null)} className="text-red-600 hover:text-red-900"><X className="h-5 w-5"/></button>
                          </div>
                        ) : (
                          <div className="flex gap-4 justify-end">
                            <button onClick={() => startEdit(member)} className="text-indigo-600 hover:text-indigo-900"><Edit className="h-5 w-5"/></button>
                            <button onClick={() => sendEmail(member.email)} className="text-gray-600 hover:text-gray-900"><Mail className="h-5 w-5"/></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ApplicationList: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  
  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error(error);
    else setApplications(data || []);
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', id);
    
    if (!error) {
      setApplications(applications.map(a => a.id === id ? { ...a, status } : a));
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
         <h3 className="text-lg leading-6 font-medium text-gray-900">入会申请列表</h3>
      </div>
      <ul className="divide-y divide-gray-200">
        {applications.map((app) => (
          <li key={app.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                 <p className="text-sm font-medium text-indigo-600 truncate">{app.full_name}</p>
                 <p className="text-sm text-gray-500">申请内容: {app.content}</p>
                 <p className="text-xs text-gray-400">日期: {new Date(app.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                {app.status === 'pending' ? (
                  <>
                    <button onClick={() => updateStatus(app.id, 'approved')} className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700">
                      批准
                    </button>
                    <button onClick={() => updateStatus(app.id, 'rejected')} className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700">
                      拒绝
                    </button>
                  </>
                ) : (
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    app.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {app.status === 'approved' ? '已批准' : '已拒绝'}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
        {applications.length === 0 && <li className="px-4 py-4 text-center text-gray-500">暂无申请记录。</li>}
      </ul>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  useEffect(() => {
    if (location.pathname === '/admin/') {
      navigate('/admin', { replace: true });
    }
  }, [location.pathname, navigate]);

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
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
                <span className="font-bold text-xl text-indigo-600 tracking-tight">管理后台</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link to="/admin" className={linkClass('/admin')}>
                  会员列表
                </Link>
                <Link to="/admin/applications" className={linkClass('/admin/applications')}>
                  申请审核
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
                to="/admin"
                className={mobileLinkClass('/admin')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                会员列表
              </Link>
              <Link
                to="/admin/applications"
                className={mobileLinkClass('/admin/applications')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                申请审核
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
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">管理员仪表盘</h1>
          </div>
        </header>
        <main>
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 mt-8">
            <Routes>
               <Route index element={<MemberList />} />
               <Route path="applications" element={<ApplicationList />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
