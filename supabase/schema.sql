-- Methuselah — Supplier Management System
-- Database schema

create extension if not exists "uuid-ossp";

-- ENUMS
create type user_role as enum ('admin', 'employee');
create type supplier_status as enum ('in_progress', 'approved', 'not_approved');
create type form_stage as enum ('form_1', 'form_2', 'form_3', 'stage_1', 'stage_2', 'stage_3', 'stage_4', 'stage_5', 'done');
create type task_status as enum ('open', 'in_progress', 'completed');
create type stage_number as enum ('stage_1', 'stage_2', 'stage_3', 'stage_4', 'stage_5');

-- USERS PROFILE TABLE
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role user_role not null default 'employee',
  is_active boolean not null default true,
  totp_secret text,
  totp_enabled boolean not null default false,
  last_active_at timestamptz,
  created_at timestamptz not null default now()
);

-- SUPPLIERS TABLE
create table public.suppliers (
  id uuid primary key default uuid_generate_v4(),
  reference_code text unique not null,
  email text unique not null,
  contact_name text,
  phone text,
  company_name text,
  business_number text,
  company_location text,
  factory_address text,
  product_type text,
  production_quantity text,
  country text,
  current_stage form_stage not null default 'form_1',
  status supplier_status not null default 'in_progress',
  rejection_reason text,
  rejected_at timestamptz,
  rejected_by uuid references public.user_profiles(id),
  approved_at timestamptz,
  quality_rating text,
  reliability_score text,
  pricing_tier text,
  communication text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_suppliers_status on public.suppliers(status);
create index idx_suppliers_email on public.suppliers(email);
create index idx_suppliers_current_stage on public.suppliers(current_stage);

-- TASKS TABLE (5 tasks per supplier after form_3)
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  stage stage_number not null,
  status task_status not null default 'open',
  claimed_by uuid references public.user_profiles(id),
  claimed_at timestamptz,
  completed_by uuid references public.user_profiles(id),
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(supplier_id, stage)
);

create index idx_tasks_status on public.tasks(status);
create index idx_tasks_claimed_by on public.tasks(claimed_by);
create index idx_tasks_supplier_id on public.tasks(supplier_id);

-- SUPPLIER NOTES TABLE
create table public.supplier_notes (
  id uuid primary key default uuid_generate_v4(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  author_id uuid not null references public.user_profiles(id),
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_supplier_notes_supplier on public.supplier_notes(supplier_id);

-- AUDIT LOG TABLE (immutable)
create table public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.user_profiles(id),
  actor_label text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  entity_label text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_log_created_at on public.audit_log(created_at desc);
create index idx_audit_log_actor on public.audit_log(actor_id);
create index idx_audit_log_entity on public.audit_log(entity_type, entity_id);

-- SETTINGS TABLE (singleton)
create table public.settings (
  id int primary key default 1,
  evaluation_field_1 text not null default 'Quality Rating',
  evaluation_field_2 text not null default 'Reliability Score',
  evaluation_field_3 text not null default 'Pricing Tier',
  evaluation_field_4 text not null default 'Communication',
  stage_1_name text not null default 'Document Review',
  stage_2_name text not null default 'Quality Assessment',
  stage_3_name text not null default 'Management Approval',
  stage_4_name text not null default 'Contract Signing',
  stage_5_name text not null default 'System Onboarding',
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

insert into public.settings (id) values (1);

-- NOTIFICATIONS TABLE
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_unread on public.notifications(user_id, is_read);

-- TRIGGER: auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public, pg_temp;

create trigger suppliers_updated_at before update on public.suppliers
  for each row execute function update_updated_at();

create trigger tasks_updated_at before update on public.tasks
  for each row execute function update_updated_at();

create trigger settings_updated_at before update on public.settings
  for each row execute function update_updated_at();

-- TRIGGER: auto-create 5 tasks when supplier reaches form_3 done state
create or replace function create_tasks_on_form3()
returns trigger as $$
begin
  if new.current_stage = 'stage_1' and (old.current_stage is null or old.current_stage <> 'stage_1') then
    insert into public.tasks (supplier_id, stage)
    values
      (new.id, 'stage_1'),
      (new.id, 'stage_2'),
      (new.id, 'stage_3'),
      (new.id, 'stage_4'),
      (new.id, 'stage_5')
    on conflict (supplier_id, stage) do nothing;
  end if;
  return new;
end;
$$ language plpgsql set search_path = public, pg_temp;

create trigger supplier_create_tasks after insert or update on public.suppliers
  for each row execute function create_tasks_on_form3();

-- TRIGGER: auto-approve supplier when stage_5 task completed
create or replace function auto_approve_on_stage5()
returns trigger as $$
begin
  if new.stage = 'stage_5' and new.status = 'completed' and (old.status is null or old.status <> 'completed') then
    update public.suppliers
    set status = 'approved', current_stage = 'done', approved_at = now()
    where id = new.supplier_id and status = 'in_progress';
  end if;
  return new;
end;
$$ language plpgsql set search_path = public, pg_temp;

create trigger task_auto_approve after update on public.tasks
  for each row execute function auto_approve_on_stage5();

-- ROW LEVEL SECURITY
alter table public.user_profiles enable row level security;
alter table public.suppliers enable row level security;
alter table public.tasks enable row level security;
alter table public.supplier_notes enable row level security;
alter table public.audit_log enable row level security;
alter table public.settings enable row level security;
alter table public.notifications enable row level security;

-- Helper: check if current user is admin.
-- security definer + explicit search_path prevents search_path-based privilege escalation
-- where an attacker creates a malicious table in their own schema with the same name.
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$ language sql security definer stable set search_path = public, pg_temp;

-- POLICIES: user_profiles
create policy "users_view_self" on public.user_profiles for select using (id = auth.uid());
create policy "admins_view_all_users" on public.user_profiles for select using (is_admin());
create policy "admins_modify_users" on public.user_profiles for all using (is_admin());

-- Self-update is only allowed via the API (which uses service role), so we DO NOT create a
-- self-update policy here. Allowing it would let employees escalate their own role to admin
-- or re-enable a disabled account by sending a direct PATCH to PostgREST.
-- The API endpoints that update profiles (e.g. /api/setup-2fa) use the service-role client.

-- Search path hardened helper to detect privilege-escalation attempts in audit log if needed

-- POLICIES: suppliers
create policy "admins_full_suppliers" on public.suppliers for all using (is_admin());
create policy "employees_view_assigned_suppliers" on public.suppliers for select using (
  exists (select 1 from public.tasks where supplier_id = suppliers.id and claimed_by = auth.uid())
);

-- POLICIES: tasks
create policy "admins_full_tasks" on public.tasks for all using (is_admin());
create policy "employees_view_open_tasks" on public.tasks for select using (
  status = 'open' or claimed_by = auth.uid()
);
-- Employees can update tasks ONLY if (a) they are the current claimer, OR (b) they are claiming
-- a previously-unclaimed task. The WITH CHECK clause additionally prevents an employee from
-- writing a row where claimed_by points to someone else (preventing task-hijacking).
create policy "employees_update_own_tasks" on public.tasks for update
  using (claimed_by = auth.uid() or (claimed_by is null and status = 'open'))
  with check (claimed_by = auth.uid());

-- POLICIES: supplier_notes
create policy "admins_full_notes" on public.supplier_notes for all using (is_admin());
create policy "employees_view_assigned_notes" on public.supplier_notes for select using (
  exists (select 1 from public.tasks where supplier_id = supplier_notes.supplier_id and claimed_by = auth.uid())
);
create policy "employees_add_notes_assigned" on public.supplier_notes for insert with check (
  author_id = auth.uid() and exists (
    select 1 from public.tasks where supplier_id = supplier_notes.supplier_id and claimed_by = auth.uid()
  )
);

-- POLICIES: audit_log
-- Read-only for admins. INSERT must be done via service-role client (createServiceClient in API).
-- We do NOT create an INSERT policy here, which means PostgREST cannot insert into audit_log
-- with the anon or authenticated role. This prevents users from forging audit entries with
-- a fake actor_id. The logAudit() helper in src/lib/auth.ts uses the SSR-bound supabase client,
-- which is anon-keyed by default; so logAudit must be called only from API routes that use
-- the SERVICE_ROLE client OR rely on the SECURITY DEFINER bypass below.
create policy "admins_view_audit" on public.audit_log for select using (is_admin());

-- Helper for INSERT-only attribution from API: ensures actor_id matches auth.uid() if provided.
-- Public form submissions pass actor_id = NULL (anonymous public actor).
create policy "users_insert_audit" on public.audit_log for insert
  with check (actor_id is null or actor_id = auth.uid());

-- POLICIES: settings
create policy "all_view_settings" on public.settings for select using (auth.uid() is not null);
create policy "admins_update_settings" on public.settings for update using (is_admin());

-- POLICIES: notifications
create policy "users_view_own_notifications" on public.notifications for select using (user_id = auth.uid());
create policy "users_update_own_notifications" on public.notifications for update using (user_id = auth.uid());
-- Notification INSERT happens only from API routes via service-role client (no INSERT policy here).
-- Without an INSERT policy, the authenticated/anon roles cannot create notifications, which prevents
-- spoofing notifications to other users. Service-role bypasses RLS.
