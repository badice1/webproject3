import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { AppEvent } from '../types';
import { Calendar, MapPin, Users, Plus, CheckCircle, XCircle, Edit, Trash } from 'lucide-react';

const EventBoard: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create/Edit Event State
  const [isEditing, setIsEditing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  // Detail Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);

  // My participation status map
  const [myStatus, setMyStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Fetch events with creator info
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          creator:creator_id (full_name, email)
        `)
        .order('event_time', { ascending: true });

      if (eventsError) throw eventsError;
      
      const { data: participantsData, error: participantsError } = await supabase
        .from('event_participants')
        .select('event_id, status, user_id');

      if (participantsError) throw participantsError;

      // Process data
      const eventsWithCounts = eventsData?.map(event => {
        const eventParts = participantsData?.filter(p => p.event_id === event.id && (p.status === 'approved' || p.status === 'pending')) || [];
        return {
          ...event,
          participant_count: eventParts.length
        };
      });

      setEvents(eventsWithCounts || []);

      // Determine my status
      const statusMap: Record<string, string> = {};
      participantsData?.forEach(p => {
        if (p.user_id === user?.id) {
          statusMap[p.event_id] = p.status;
        }
      });
      setMyStatus(statusMap);

    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTime) {
      alert('请选择活动时间');
      return;
    }
    setSubmitting(true);
    try {
      if (isEditing && currentEventId) {
         const { error } = await supabase
          .from('events')
          .update({
            title,
            description,
            location,
            event_time: new Date(eventTime).toISOString(),
            max_participants: maxParticipants
          })
          .eq('id', currentEventId);
         if (error) throw error;
         alert('活动更新成功！');
      } else {
        const { error } = await supabase
          .from('events')
          .insert([
            {
              creator_id: user?.id,
              title,
              description,
              location,
              event_time: new Date(eventTime).toISOString(),
              max_participants: maxParticipants
            }
          ]);
        if (error) throw error;
        alert('活动发布成功！');
      }

      closeModal();
      fetchEvents();
    } catch (err: any) {
      alert((isEditing ? '更新' : '发布') + '失败: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setIsEditing(false);
    setCurrentEventId(null);
    setTitle('');
    setDescription('');
    setLocation('');
    setEventTime('');
    setMaxParticipants(0);
  };

  const openEditModal = (event: AppEvent) => {
    setIsEditing(true);
    setCurrentEventId(event.id);
    setTitle(event.title);
    setDescription(event.description);
    setLocation(event.location);
    // Format date for input datetime-local: YYYY-MM-DDThh:mm
    const date = new Date(event.event_time);
    const dateString = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEventTime(dateString);
    setMaxParticipants(event.max_participants);
    setShowCreateModal(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('确定要删除这个活动吗？此操作无法撤销。')) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      alert('活动已删除');
      fetchEvents();
    } catch (err: any) {
      alert('删除失败: ' + err.message);
    }
  };

  const handleViewDetails = (event: AppEvent) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  const handleJoinEvent = async (event: AppEvent) => {
    if (!confirm(`确定要申请参加 "${event.title}" 吗？`)) return;

    try {
      // 1. Insert participant record
      const { error: partError } = await supabase
        .from('event_participants')
        .insert([
          {
            event_id: event.id,
            user_id: user?.id,
            status: 'pending'
          }
        ]);

      if (partError) throw partError;

      // 2. Send notification message to creator
      const { error: msgError } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: user?.id,
            receiver_id: event.creator_id,
            subject: `活动申请: ${event.title}`,
            content: `用户申请参加活动 "${event.title}"。\n请在“我的活动”或消息中心处理申请。`,
            message_type: 'event_application',
            related_entity_id: event.id
          }
        ]);
        
      if (msgError) console.error('Failed to send notification:', msgError);

      alert('申请已发送，请等待审核。');
      fetchEvents();
    } catch (err: any) {
      alert('申请失败: ' + err.message);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg min-h-[600px] flex flex-col relative">
      <div className="border-b border-gray-200 px-4 py-4 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">活动公告栏</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="mr-2 h-4 w-4" /> 发布活动
        </button>
      </div>

      <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <div key={event.id} className="border border-gray-100 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 bg-white overflow-hidden flex flex-col transform hover:-translate-y-1">
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start">
                <h4 className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleViewDetails(event)}>{event.title}</h4>
                {user?.id === event.creator_id && (
                  <div className="flex space-x-2">
                    <button onClick={() => openEditModal(event)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="编辑">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteEvent(event.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="删除">
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-4 line-clamp-3 cursor-pointer leading-relaxed" onClick={() => handleViewDetails(event)}>{event.description}</p>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2.5 text-indigo-500" />
                  {new Date(event.event_time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2.5 text-indigo-500" />
                  {event.location || '线上'}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2.5 text-indigo-500" />
                  {event.participant_count} / {event.max_participants > 0 ? event.max_participants : '不限'}
                </div>
                <div className="flex items-center mt-2 pt-2 border-t border-gray-50">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">发布者: {event.creator?.full_name}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 border-t flex gap-3">
              <button
                onClick={() => handleViewDetails(event)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none transition-all"
              >
                查看详情
              </button>
              {myStatus[event.id] === 'approved' ? (
                <span className="flex-1 inline-flex justify-center items-center text-green-600 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 mr-1" /> 已参加
                </span>
              ) : myStatus[event.id] === 'pending' ? (
                <span className="flex-1 inline-flex justify-center items-center text-yellow-600 text-sm font-medium">
                  <div className="h-2 w-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div> 审核中
                </span>
              ) : myStatus[event.id] === 'rejected' ? (
                <span className="flex-1 inline-flex justify-center items-center text-red-600 text-sm font-medium">
                  <XCircle className="h-4 w-4 mr-1" /> 已拒绝
                </span>
              ) : (event.max_participants > 0 && (event.participant_count || 0) >= event.max_participants) ? (
                 <button disabled className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-100 cursor-not-allowed">
                   名额已满
                 </button>
              ) : (
                <button
                  onClick={() => handleJoinEvent(event)}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  申请参加
                </button>
              )}
            </div>
          </div>
        ))}
        {events.length === 0 && !loading && (
          <div className="col-span-full text-center py-10 text-gray-500">暂无活动</div>
        )}
      </div>

      {/* View Details Modal */}
      {showDetailModal && selectedEvent && (
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-900">{selectedEvent.title}</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">关闭</span>
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <span className="flex items-center"><Calendar className="h-4 w-4 mr-1"/> {new Date(selectedEvent.event_time).toLocaleString()}</span>
                <span className="flex items-center"><MapPin className="h-4 w-4 mr-1"/> {selectedEvent.location || '线上'}</span>
                <span className="flex items-center"><Users className="h-4 w-4 mr-1"/> {selectedEvent.participant_count} / {selectedEvent.max_participants > 0 ? selectedEvent.max_participants : '不限'}</span>
              </div>
              
              <div className="border-t border-b border-gray-200 py-4">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedEvent.description}</p>
              </div>

              <div className="text-sm text-gray-500">
                <p>发布者: {selectedEvent.creator?.full_name} ({selectedEvent.creator?.email})</p>
              </div>

              <div className="flex justify-end pt-2">
                 <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{isEditing ? '编辑活动' : '发布新活动'}</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">活动标题</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">描述</label>
                <textarea
                  required
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">时间</label>
                <input
                  type="datetime-local"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">地点</label>
                <input
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">人数上限 (0为不限)</label>
                <input
                  type="number"
                  min="0"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? '提交中...' : (isEditing ? '更新' : '发布')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventBoard;
