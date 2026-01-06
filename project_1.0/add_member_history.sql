-- 1. 创建会员历年数据表
CREATE TABLE IF NOT EXISTS public.member_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  membership_level TEXT DEFAULT 'General',
  membership_status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'unpaid',
  membership_duration_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, year)
);

-- 2. 创建自动记录会员历史的函数
CREATE OR REPLACE FUNCTION public.record_member_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 检查是否已存在当前年份的记录
  PERFORM 1 FROM public.member_history 
  WHERE member_id = NEW.id AND year = EXTRACT(YEAR FROM NOW())::INTEGER;
  
  -- 如果不存在，则创建新记录
  IF NOT FOUND THEN
    INSERT INTO public.member_history (
      member_id, 
      year, 
      membership_level, 
      membership_status, 
      payment_status,
      membership_duration_days
    ) VALUES (
      NEW.id, 
      EXTRACT(YEAR FROM NOW())::INTEGER, 
      NEW.membership_level, 
      NEW.membership_status, 
      NEW.payment_status,
      NEW.membership_duration_days
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. 创建触发器
DROP TRIGGER IF EXISTS after_profile_update ON public.profiles;

CREATE TRIGGER after_profile_update
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.record_member_history();

-- 4. 初始化现有会员的历史记录
INSERT INTO public.member_history (
  member_id, 
  year, 
  membership_level, 
  membership_status, 
  payment_status,
  membership_duration_days
)
SELECT 
  id, 
  EXTRACT(YEAR FROM NOW())::INTEGER,
  membership_level,
  membership_status,
  payment_status,
  membership_duration_days
FROM public.profiles
ON CONFLICT (member_id, year) DO NOTHING;
