-- Migration: Add supplier_follow_up_tasks table
-- Run this in Supabase SQL Editor

-- Create the table
create table if not exists public.supplier_follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  title text not null,
  status text not null default 'open' check (status in ('open', 'completed')),
  created_by uuid references public.user_profiles(id),
  created_by_label text,
  created_at timestamptz default now(),
  completed_by uuid references public.user_profiles(id),
  completed_at timestamptz
);

-- Indexes for performance
create index if not exists idx_followup_supplier on public.supplier_follow_up_tasks(supplier_id);
create index if not exists idx_followup_status on public.supplier_follow_up_tasks(status);
create index if not exists idx_followup_created on public.supplier_follow_up_tasks(created_at desc);

-- Enable Row Level Security
alter table public.supplier_follow_up_tasks enable row level security;

-- Policy: Admins can see all follow-up tasks
drop policy if exists "Admins can view follow-ups" on public.supplier_follow_up_tasks;
create policy "Admins can view follow-ups"
  on public.supplier_follow_up_tasks for select
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin' and is_active = true
    )
  );

-- Policy: Admins can insert follow-up tasks
drop policy if exists "Admins can create follow-ups" on public.supplier_follow_up_tasks;
create policy "Admins can create follow-ups"
  on public.supplier_follow_up_tasks for insert
  with check (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin' and is_active = true
    )
  );

-- Policy: Admins can update follow-up tasks (mark as completed)
drop policy if exists "Admins can update follow-ups" on public.supplier_follow_up_tasks;
create policy "Admins can update follow-ups"
  on public.supplier_follow_up_tasks for update
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin' and is_active = true
    )
  );

-- Policy: Admins can delete follow-up tasks
drop policy if exists "Admins can delete follow-ups" on public.supplier_follow_up_tasks;
create policy "Admins can delete follow-ups"
  on public.supplier_follow_up_tasks for delete
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin' and is_active = true
    )
  );

-- Grant access
grant all on public.supplier_follow_up_tasks to authenticated;
grant all on public.supplier_follow_up_tasks to service_role;
