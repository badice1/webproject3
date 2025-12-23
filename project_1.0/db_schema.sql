-- 1. Create Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  role text check (role in ('member', 'admin')) default 'member',
  membership_level text default 'General',
  membership_status text default 'pending', -- pending, active, inactive
  payment_status text default 'unpaid',
  join_date date default current_date,
  phone text,
  institution text,
  created_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. Create Policies
create policy "Public profiles are viewable by everyone." on public.profiles for select using ( true );
create policy "Users can insert their own profile." on public.profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on public.profiles for update using ( auth.uid() = id );
create policy "Admins can update all profiles." on public.profiles for update using ( 
  exists ( select 1 from profiles where id = auth.uid() and role = 'admin' )
);

-- 4. Create Applications Table
create table if not exists public.applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  full_name text,
  content jsonb,
  status text default 'pending',
  created_at timestamptz default now()
);

-- 5. Enable RLS for Applications
alter table public.applications enable row level security;

create policy "Users can view own applications" on public.applications for select using ( auth.uid() = user_id );
create policy "Users can create applications" on public.applications for insert with check ( auth.uid() = user_id );
create policy "Admins can view all applications" on public.applications for select using ( 
  exists ( select 1 from profiles where id = auth.uid() and role = 'admin' )
);
create policy "Admins can update applications" on public.applications for update using (
  exists ( select 1 from profiles where id = auth.uid() and role = 'admin' )
);

-- 6. Insert a default Admin (You need to sign up first via UI, then update role manually or use this trigger)
-- For now, run this manually in SQL editor after signing up to make yourself admin:
-- update profiles set role = 'admin' where email = 'your_admin_email@example.com';
