-- 修复管理员更新会员数据的RLS策略
-- 原策略缺少with check子句，导致管理员无法更新会员数据

-- 删除原策略
DROP POLICY IF EXISTS "Admins can update all profiles." ON public.profiles;

-- 创建修复后的策略，包含using和with check子句
CREATE POLICY "Admins can update all profiles." ON public.profiles 
FOR UPDATE 
USING ( 
  EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' )
) 
WITH CHECK ( 
  EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' )
);

-- 确保membership_duration_days字段存在
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS membership_duration_days INTEGER DEFAULT 0;

-- 为applications表添加类似的修复
-- 虽然applications的更新策略看起来有using子句，但为了一致性，确保有with check子句
DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;

CREATE POLICY "Admins can update applications" ON public.applications 
FOR UPDATE 
USING ( 
  EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' )
) 
WITH CHECK ( 
  EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' )
);
