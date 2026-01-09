// 导入React核心和相关钩子
import React, { createContext, useContext, useEffect, useState } from 'react';
// 导入Supabase的User和Session类型
import type { User, Session } from '@supabase/supabase-js';
// 导入Supabase客户端实例
import { supabase } from '../lib/supabase';
// 导入自定义的Profile类型
import type { Profile } from '../types';

/**
 * 认证上下文的类型定义
 * 包含用户信息、会话、个人资料、加载状态、管理员标识和登出方法
 */
interface AuthContextType {
  user: User | null; // 用户对象，未登录时为null
  session: Session | null; // 会话对象，包含认证信息
  profile: Profile | null; // 用户个人资料，从profiles表获取
  loading: boolean; // 加载状态，用于控制UI显示
  isAdmin: boolean; // 是否为管理员角色
  signOut: () => Promise<void>; // 登出方法
}

/**
 * 创建认证上下文
 * 设置默认值，用于未提供Provider时的 fallback
 */
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {}, // 默认空函数
});

/**
 * 自定义Hook，用于在组件中访问认证上下文
 * @returns 认证上下文对象
 */
export const useAuth = () => useContext(AuthContext);

/**
 * 认证上下文提供者组件
 * 负责管理用户状态、会话和个人资料
 * @param children - 子组件，将共享认证上下文
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 用户状态
  const [user, setUser] = useState<User | null>(null);
  // 会话状态
  const [session, setSession] = useState<Session | null>(null);
  // 个人资料状态
  const [profile, setProfile] = useState<Profile | null>(null);
  // 加载状态
  const [loading, setLoading] = useState(true);

  // 初始化和监听认证状态变化
  useEffect(() => {
    // 1. 获取初始会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      // 设置会话和用户状态
      setSession(session);
      setUser(session?.user ?? null);
      
      // 如果用户已登录，获取个人资料
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        // 未登录，结束加载状态
        setLoading(false);
      }
    }).catch(err => {
      // 处理获取会话失败的情况
      console.error("Failed to get session:", err);
      setLoading(false);
    });

    // 2. 监听认证状态变化
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // 更新会话和用户状态
      setSession(session);
      setUser(session?.user ?? null);
      
      // 如果用户已登录，获取个人资料
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        // 未登录，清除个人资料，结束加载状态
        setProfile(null);
        setLoading(false);
      }
    });

    // 3. 组件卸载时取消订阅
    return () => {
      authSubscription.unsubscribe();
    };
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // 监听profile数据变化
  useEffect(() => {
    if (!user) return;

    // 监听当前用户profile的变化
    const profileChannel = supabase
      .channel(`profile:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        // 更新profile数据
        if (payload.new) {
          setProfile(payload.new as Profile);
        }
      })
      .subscribe();

    return () => {
      profileChannel.unsubscribe();
    };
  }, [user]); // 当user变化时重新订阅

  /**
   * 获取用户个人资料
   * @param userId - 用户ID
   * @param retries - 重试次数，默认为3次
   */
  const fetchProfile = async (userId: string, retries = 3) => {
    try {
      // 从profiles表中查询用户资料
      const { data, error } = await supabase
        .from('profiles') // 指定表名
        .select('*') // 查询所有字段
        .eq('id', userId) // 按ID筛选
        .single(); // 只返回一条记录

      if (error) {
        // PGRST116错误表示没有找到记录（可能profile尚未创建）
        if (error.code === 'PGRST116' && retries > 0) {
          // 记录重试信息
          console.log(`Profile not found, retrying... (${retries} attempts left)`);
          // 延迟1秒后重试，减少服务器压力
          setTimeout(() => fetchProfile(userId, retries - 1), 1000);
          return; // 不结束加载状态，继续等待
        }
        // 其他错误或重试次数用完，记录错误并结束加载
        console.error('Error fetching profile:', error);
        setLoading(false);
      } else {
        // 成功获取资料，更新状态并结束加载
        setProfile(data);
        setLoading(false);
      }
    } catch (err) {
      // 处理意外错误
      console.error('Unexpected error fetching profile:', err);
      setLoading(false);
    }
  };

  /**
   * 登出方法
   * 调用Supabase的signOut方法，并清除本地状态
   */
  const signOut = async () => {
    await supabase.auth.signOut(); // 调用Supabase登出API
    // 清除本地状态
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  /**
   * 计算是否为管理员
   * 根据profile的role字段判断
   */
  const isAdmin = profile?.role === 'admin';

  return (
    // 提供认证上下文给子组件
    <AuthContext.Provider value={{ user, session, profile, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
