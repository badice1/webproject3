-- 1. 创建处理新用户的函数
-- 该函数会在 auth.users 表插入新记录时触发
-- 使用 security definer 确保有权限写入 profiles 表
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, institution, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'institution',
    'member'
  );
  return new;
end;
$$;

-- 2. 创建触发器
-- 如果触发器已存在，先删除（避免重复报错）
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
