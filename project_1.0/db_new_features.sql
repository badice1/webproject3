-- 1. 更新 Profiles 权限 (允许所有登录用户查看，以便发送消息和查看通讯录)
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users" on public.profiles for select to authenticated using (true);

-- 2. 消息表
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) not null,
  receiver_id uuid references public.profiles(id) not null,
  subject text,
  content text,
  message_type text default 'text', -- 'text', 'event_application'
  related_entity_id uuid, -- 关联的ID (例如 event_id)
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

-- 消息策略
create policy "Users can view their own received messages" on public.messages for select using (auth.uid() = receiver_id);
create policy "Users can view their own sent messages" on public.messages for select using (auth.uid() = sender_id);
create policy "Users can send messages" on public.messages for insert with check (auth.uid() = sender_id);
create policy "Users can update received messages" on public.messages for update using (auth.uid() = receiver_id); -- 比如标记已读

-- 3. 活动表
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  location text,
  event_time timestamptz not null,
  max_participants int default 0,
  created_at timestamptz default now()
);

alter table public.events enable row level security;

-- 活动策略
create policy "Events are viewable by everyone" on public.events for select to authenticated using (true);
create policy "Users can create events" on public.events for insert with check (auth.uid() = creator_id);
create policy "Creators can update their events" on public.events for update using (auth.uid() = creator_id);
create policy "Creators can delete their events" on public.events for delete using (auth.uid() = creator_id);

-- 4. 活动参与者表
create table if not exists public.event_participants (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  status text default 'pending', -- pending, approved, rejected
  created_at timestamptz default now(),
  unique(event_id, user_id)
);

alter table public.event_participants enable row level security;

-- 参与者策略
create policy "Authenticated can view participants" on public.event_participants for select to authenticated using (true);
create policy "Users can join events" on public.event_participants for insert with check (auth.uid() = user_id);
create policy "Creators can update status" on public.event_participants for update using (
  exists (select 1 from public.events where id = event_id and creator_id = auth.uid())
);
