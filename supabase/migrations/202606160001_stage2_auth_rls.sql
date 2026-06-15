create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ip_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  inn text not null,
  ip_full_name text not null,
  region_code text not null default '77',
  registration_date date not null,
  tax_system text not null default 'usn' check (tax_system = 'usn'),
  tax_object text not null default 'income' check (tax_object = 'income'),
  has_employees boolean not null default false check (has_employees = false),
  usn_rate numeric(5,2) not null default 6 check (usn_rate >= 0 and usn_rate <= 6),
  initial_income_current_year numeric(14,2) not null default 0 check (initial_income_current_year >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.income_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  amount numeric(14,2) not null check (amount >= 0),
  counterparty_name text not null,
  counterparty_inn text,
  description text not null,
  operation_type text not null check (operation_type in ('income','not_income','refund','personal_transfer','bank_fee','mistake','other')),
  tax_status text not null check (tax_status in ('taxable','not_taxable','needs_review')),
  source text not null default 'manual',
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_year_settings (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  region_code text not null default 'RU',
  usn_income_rate numeric(5,2) not null,
  fixed_contribution numeric(14,2) not null,
  additional_contribution_rate numeric(5,2) not null,
  additional_contribution_threshold numeric(14,2) not null,
  additional_contribution_max numeric(14,2) not null,
  usn_q1_due_date date not null,
  usn_h1_due_date date not null,
  usn_9m_due_date date not null,
  usn_year_due_date date not null,
  usn_declaration_due_date date not null,
  fixed_contribution_due_date date not null,
  additional_contribution_due_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(year, region_code)
);

create table if not exists public.tax_calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year int not null,
  period text not null check (period in ('q1','h1','m9','year')),
  income_total numeric(14,2) not null default 0,
  usn_rate numeric(5,2) not null,
  usn_before_deduction numeric(14,2) not null default 0,
  fixed_contribution numeric(14,2) not null default 0,
  additional_contribution numeric(14,2) not null default 0,
  deduction_applied numeric(14,2) not null default 0,
  previous_payments numeric(14,2) not null default 0,
  tax_to_pay numeric(14,2) not null default 0,
  calculation_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.calendar_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_key text not null,
  status text not null default 'planned' check (status in ('planned','soon','overdue','done','not_required')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, task_key)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists income_transactions_user_date_idx on public.income_transactions(user_id, date desc);
create index if not exists calendar_tasks_user_status_idx on public.calendar_tasks(user_id, status);
create index if not exists tax_calculations_user_year_idx on public.tax_calculations(user_id, year, period);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists set_ip_profiles_updated_at on public.ip_profiles;
create trigger set_ip_profiles_updated_at before update on public.ip_profiles for each row execute function public.set_updated_at();
drop trigger if exists set_income_transactions_updated_at on public.income_transactions;
create trigger set_income_transactions_updated_at before update on public.income_transactions for each row execute function public.set_updated_at();
drop trigger if exists set_calendar_tasks_updated_at on public.calendar_tasks;
create trigger set_calendar_tasks_updated_at before update on public.calendar_tasks for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.profiles(user_id, email, full_name) values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'full_name', '')) on conflict (user_id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.ip_profiles enable row level security;
alter table public.income_transactions enable row level security;
alter table public.tax_year_settings enable row level security;
alter table public.tax_calculations enable row level security;
alter table public.calendar_tasks enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using (user_id = auth.uid());
create policy profiles_insert_own on public.profiles for insert to authenticated with check (user_id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ip_profiles_select_own on public.ip_profiles for select to authenticated using (user_id = auth.uid());
create policy ip_profiles_insert_own on public.ip_profiles for insert to authenticated with check (user_id = auth.uid());
create policy ip_profiles_update_own on public.ip_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ip_profiles_delete_own on public.ip_profiles for delete to authenticated using (user_id = auth.uid());
create policy income_select_own on public.income_transactions for select to authenticated using (user_id = auth.uid());
create policy income_insert_own on public.income_transactions for insert to authenticated with check (user_id = auth.uid());
create policy income_update_own on public.income_transactions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy income_delete_own on public.income_transactions for delete to authenticated using (user_id = auth.uid());
create policy tax_year_settings_read on public.tax_year_settings for select to authenticated using (true);
create policy tax_calc_select_own on public.tax_calculations for select to authenticated using (user_id = auth.uid());
create policy tax_calc_insert_own on public.tax_calculations for insert to authenticated with check (user_id = auth.uid());
create policy tax_calc_delete_own on public.tax_calculations for delete to authenticated using (user_id = auth.uid());
create policy calendar_select_own on public.calendar_tasks for select to authenticated using (user_id = auth.uid());
create policy calendar_insert_own on public.calendar_tasks for insert to authenticated with check (user_id = auth.uid());
create policy calendar_update_own on public.calendar_tasks for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy calendar_delete_own on public.calendar_tasks for delete to authenticated using (user_id = auth.uid());
create policy audit_select_own on public.audit_logs for select to authenticated using (user_id = auth.uid());
create policy audit_insert_own on public.audit_logs for insert to authenticated with check (user_id = auth.uid());

insert into public.tax_year_settings (year, region_code, usn_income_rate, fixed_contribution, additional_contribution_rate, additional_contribution_threshold, additional_contribution_max, usn_q1_due_date, usn_h1_due_date, usn_9m_due_date, usn_year_due_date, usn_declaration_due_date, fixed_contribution_due_date, additional_contribution_due_date)
values (2026, 'RU', 6, 57390, 1, 300000, 321818, '2026-04-28', '2026-07-28', '2026-10-28', '2027-04-28', '2027-04-25', '2026-12-28', '2027-07-01')
on conflict (year, region_code) do update set usn_income_rate = excluded.usn_income_rate, fixed_contribution = excluded.fixed_contribution, additional_contribution_rate = excluded.additional_contribution_rate, additional_contribution_threshold = excluded.additional_contribution_threshold, additional_contribution_max = excluded.additional_contribution_max, updated_at = now();
