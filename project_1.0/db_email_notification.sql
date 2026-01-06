-- 添加邮件通知功能：当新消息插入时发送邮件给收件人

-- 1. 确保 pg_net 扩展已启用（用于发送HTTP请求，Supabase Email API依赖）
-- 如果扩展不存在，先创建它
create extension if not exists pg_net with schema extensions;

-- 2. 创建发送新消息通知邮件的函数
create or replace function public.send_new_message_email()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- 获取收件人的邮箱和姓名
  select email, full_name into @recipient_email, @recipient_name
  from public.profiles
  where id = new.receiver_id;

  -- 获取发件人的姓名
  select full_name into @sender_name
  from public.profiles
  where id = new.sender_id;

  -- 构建邮件内容
  @subject := '您收到了新消息 - 广西自动化学会';
  @html_content := '<!DOCTYPE html>
<html>
<head>
    <title>新消息通知</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { background-color: #4f46e5; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
        .button { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>新消息通知</h2>
        </div>
        <div class="content">
            <p>您好，' || @recipient_name || '：</p>
            <p>您收到了一条来自 <strong>' || @sender_name || '</strong> 的新消息：</p>
            <h3>主题：' || new.subject || '</h3>
            <p>' || new.content || '</p>
            <p>请登录系统查看完整消息：</p>
            <p><a href="https://auto-association-example.netlify.app" class="button">登录系统</a></p>
            <p>如果您没有注册过我们的系统，可能是他人误发，请忽略此邮件。</p>
        </div>
        <div class="footer">
            <p>广西自动化学会会员管理系统</p>
            <p>&copy; 2026 广西自动化学会. 保留所有权利.</p>
        </div>
    </div>
</body>
</html>';

  -- 调用 Supabase Email API 发送邮件
  perform extensions.http_post(
    url := 'https://aawgprtzvgiigtnvnipw.supabase.co/functions/v1/send-email',
    body := jsonb_build_object(
      'to', @recipient_email,
      'subject', @subject,
      'html', @html_content
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.functions.api_key')
    )
  );

  return new;
end;
$$;

-- 3. 创建触发器，在新消息插入后触发邮件发送
-- 如果触发器已存在，先删除（避免重复报错）
drop trigger if exists on_new_message on public.messages;

create trigger on_new_message
  after insert on public.messages
  for each row execute procedure public.send_new_message_email();

-- 4. 授予必要的权限（确保触发器可以执行）
grant execute on function public.send_new_message_email() to authenticated;
grant usage on schema extensions to authenticated;
