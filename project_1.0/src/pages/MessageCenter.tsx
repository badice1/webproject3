import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { AppMessage, Profile } from '../types';
import { Mail, Send } from 'lucide-react';

const MessageCenter: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose' | 'members'>('inbox');
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Profile[]>([]);
  
  // Compose state
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const [processedMap, setProcessedMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activeTab === 'inbox' || activeTab === 'sent') {
      fetchMessages();
    } else if (activeTab === 'members') {
      fetchMembers();
    }
  }, [activeTab]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (email, full_name),
          receiver:receiver_id (email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (activeTab === 'inbox') {
        query = query.eq('receiver_id', user?.id);
      } else {
        query = query.eq('sender_id', user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setMessages(data || []);

      // Fetch statuses for event applications
      const applicationMessages = data?.filter(m => m.message_type === 'event_application' && m.related_entity_id) || [];
      if (applicationMessages.length > 0) {
        const statusUpdates: Record<string, string> = {};
        await Promise.all(applicationMessages.map(async (msg) => {
          if (!msg.related_entity_id) return;
          const { data: part } = await supabase
            .from('event_participants')
            .select('status')
            .eq('event_id', msg.related_entity_id)
            .eq('user_id', msg.sender_id)
            .single();
          
          if (part) {
            statusUpdates[msg.id] = part.status;
          }
        }));
        setProcessedMap(statusUpdates);
      }

    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      // 1. Find recipient by email
      const { data: recipients, error: recipientError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', recipientEmail)
        .single();

      if (recipientError || !recipients) {
        alert('未找到该邮箱对应的用户');
        setSending(false);
        return;
      }

      // 2. Send message
      const { error: sendError } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: user?.id,
            receiver_id: recipients.id,
            subject,
            content,
            message_type: 'text'
          }
        ]);

      if (sendError) throw sendError;

      alert('消息发送成功');
      setRecipientEmail('');
      setSubject('');
      setContent('');
      setActiveTab('sent');
    } catch (err: any) {
      alert('发送失败: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleProcessApplication = async (msg: AppMessage, status: 'approved' | 'rejected') => {
    if (!msg.related_entity_id) return;
    try {
      // 1. Update participant status
      const { error: updateError } = await supabase
        .from('event_participants')
        .update({ status })
        .eq('event_id', msg.related_entity_id)
        .eq('user_id', msg.sender_id);

      if (updateError) throw updateError;

      // 2. Mark message as handled (optional, or just delete it)
      // For now, let's just send a reply
      const { error: replyError } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: user?.id,
            receiver_id: msg.sender_id,
            subject: `活动申请结果: ${status === 'approved' ? '通过' : '拒绝'}`,
            content: `您对活动的申请已被${status === 'approved' ? '批准' : '拒绝'}。`,
            message_type: 'text'
          }
        ]);
      
      if (replyError) throw replyError;

      alert('处理成功');
      fetchMessages();
    } catch (err: any) {
      alert('处理失败: ' + err.message);
    }
  };

  const startComposeTo = (email: string) => {
    setRecipientEmail(email);
    setActiveTab('compose');
  };

  return (
    <div className="bg-white shadow sm:rounded-lg min-h-[600px] flex flex-col">
      <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">消息中心</h3>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {['inbox', 'sent', 'members'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab === 'inbox' ? '收件箱' : tab === 'sent' ? '发件箱' : '通讯录'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setActiveTab('compose')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Send className="mr-2 h-4 w-4" /> 写信
          </button>
        </div>
      </div>

      <div className="flex-1 p-6">
        {loading ? (
          <div className="text-center py-10 text-gray-500">加载中...</div>
        ) : (
          <>
            {(activeTab === 'inbox' || activeTab === 'sent') && (
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">暂无消息</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {messages.map((msg) => (
                      <li key={msg.id} className="py-4 hover:bg-gray-50 rounded-md px-2">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              {activeTab === 'inbox' ? `来自: ${msg.sender?.full_name} (${msg.sender?.email})` : `发送给: ${msg.receiver?.full_name} (${msg.receiver?.email})`}
                            </p>
                            <p className="text-sm font-bold text-gray-900 mt-1">{msg.subject}</p>
                            <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{msg.content}</p>
                            {msg.message_type === 'event_application' && activeTab === 'inbox' && (
                              <div className="mt-2">
                                {processedMap[msg.id] && processedMap[msg.id] !== 'pending' ? (
                                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                                    processedMap[msg.id] === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    已处理: {processedMap[msg.id] === 'approved' ? '已通过' : '已拒绝'}
                                  </span>
                                ) : (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleProcessApplication(msg, 'approved')}
                                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                                    >
                                      通过申请
                                    </button>
                                    <button
                                      onClick={() => handleProcessApplication(msg, 'rejected')}
                                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                                    >
                                      拒绝申请
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex-shrink-0 text-xs text-gray-400">
                            {new Date(msg.created_at).toLocaleString()}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邮箱</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单位</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.map((m) => (
                      <tr key={m.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.full_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.institution || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => startComposeTo(m.email)}
                            className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                          >
                            <Mail className="h-4 w-4 mr-1" /> 发消息
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'compose' && (
              <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto space-y-6">
                <div>
                  <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">收件人邮箱</label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="recipient"
                      id="recipient"
                      required
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      placeholder="user@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">主题</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="subject"
                      id="subject"
                      required
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700">内容</label>
                  <div className="mt-1">
                    <textarea
                      id="content"
                      name="content"
                      rows={5}
                      required
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {sending ? '发送中...' : '发送'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MessageCenter;
