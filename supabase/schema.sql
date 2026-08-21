-- ============================================
-- Our Space - Supabase Database Schema
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 1. 用户信息表
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  couple_name text,
  anniversary_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. 状态动态表
create table public.statuses (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  mood text,
  image_url text,
  created_at timestamptz default now()
);

-- 3. 日志表
create table public.journals (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  mood text,
  cover_image text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. 菜谱分类表
create table public.categories (
  id bigserial primary key,
  name text not null,
  sort_order int default 0
);

-- 5. 菜谱表
create table public.dishes (
  id bigserial primary key,
  name text not null,
  description text,
  category_id int references public.categories(id) on delete set null,
  ingredients text,
  difficulty int default 1 check (difficulty between 1 and 5),
  image_url text,
  available boolean default true,
  created_at timestamptz default now()
);

-- 6. 点菜订单表
create table public.orders (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  dish_id int references public.dishes(id) on delete cascade not null,
  note text,
  status text default 'pending' check (status in ('pending', 'cooking', 'done', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. 旅行计划表
create table public.travels (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  destination text not null,
  start_date date,
  end_date date,
  status text default 'planning' check (status in ('planning', 'ongoing', 'completed')),
  notes text,
  cover_image text,
  created_at timestamptz default now()
);

-- 8. 备忘录表
create table public.memos (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  color text default '#fef5f6',
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. 相册表
create table public.photos (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  image_url text not null,
  caption text,
  taken_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- RLS (Row Level Security) 策略
-- ============================================

alter table public.profiles enable row level security;
alter table public.statuses enable row level security;
alter table public.journals enable row level security;
alter table public.categories enable row level security;
alter table public.dishes enable row level security;
alter table public.orders enable row level security;
alter table public.travels enable row level security;
alter table public.memos enable row level security;
alter table public.photos enable row level security;

-- profiles: 所有人可读，本人可写
create policy "profiles select" on public.profiles for select using (true);
create policy "profiles insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update" on public.profiles for update using (auth.uid() = id);

-- statuses: 所有人可读，登录用户可写自己的
create policy "statuses select" on public.statuses for select using (true);
create policy "statuses insert" on public.statuses for insert with check (auth.uid() = user_id);
create policy "statuses delete" on public.statuses for delete using (auth.uid() = user_id);

-- journals
create policy "journals select" on public.journals for select using (true);
create policy "journals insert" on public.journals for insert with check (auth.uid() = user_id);
create policy "journals update" on public.journals for update using (auth.uid() = user_id);
create policy "journals delete" on public.journals for delete using (auth.uid() = user_id);

-- categories: 所有人可读可写（共享）
create policy "categories select" on public.categories for select using (true);
create policy "categories insert" on public.categories for insert with check (true);

-- dishes
create policy "dishes select" on public.dishes for select using (true);
create policy "dishes insert" on public.dishes for insert with check (true);
create policy "dishes update" on public.dishes for update using (true);
create policy "dishes delete" on public.dishes for delete using (true);

-- orders
create policy "orders select" on public.orders for select using (true);
create policy "orders insert" on public.orders for insert with check (auth.uid() = user_id);
create policy "orders update" on public.orders for update using (auth.uid() = user_id);
create policy "orders delete" on public.orders for delete using (auth.uid() = user_id);

-- travels
create policy "travels select" on public.travels for select using (true);
create policy "travels insert" on public.travels for insert with check (auth.uid() = user_id);
create policy "travels update" on public.travels for update using (auth.uid() = user_id);
create policy "travels delete" on public.travels for delete using (auth.uid() = user_id);

-- memos
create policy "memos select" on public.memos for select using (true);
create policy "memos insert" on public.memos for insert with check (auth.uid() = user_id);
create policy "memos update" on public.memos for update using (auth.uid() = user_id);
create policy "memos delete" on public.memos for delete using (auth.uid() = user_id);

-- photos
create policy "photos select" on public.photos for select using (true);
create policy "photos insert" on public.photos for insert with check (auth.uid() = user_id);
create policy "photos delete" on public.photos for delete using (auth.uid() = user_id);

-- ============================================
-- Storage Bucket (在 Supabase Dashboard 创建)
-- ============================================
-- 在 Supabase Dashboard > Storage 中创建名为 "images" 的 public bucket
-- 或者执行以下 SQL:

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Storage policies
create policy "images select" on storage.objects for select using (bucket_id = 'images');
create policy "images insert" on storage.objects for insert with check (bucket_id = 'images');
create policy "images delete" on storage.objects for delete using (bucket_id = 'images');
