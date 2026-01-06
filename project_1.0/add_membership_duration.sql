-- 添加会员剩余时长字段到profiles表
ALTER TABLE public.profiles 
ADD COLUMN membership_duration_days INTEGER DEFAULT 0;

-- 更新RLS策略（确保管理员可以访问这个新字段）
-- 原有的策略已经覆盖了管理员更新所有字段的权限，所以不需要额外修改
