create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  source text not null default 'bank_upload',
  status text not null default 'parsed' check (status in ('parsed','imported','failed')),
  rows_total int not null default 0,
  rows_imported int not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.income_transactions add column if not exists import_batch_id uuid references public.import_batches(id) on delete set null;

create index if not exists import_batches_user_created_idx on public.import_batches(user_id, created_at desc);
create index if not exists income_transactions_import_batch_idx on public.income_transactions(import_batch_id);

drop trigger if exists set_import_batches_updated_at on public.import_batches;
create trigger set_import_batches_updated_at before update on public.import_batches for each row execute function public.set_updated_at();

alter table public.import_batches enable row level security;

create policy import_batches_select_own on public.import_batches for select to authenticated using (user_id = auth.uid());
create policy import_batches_insert_own on public.import_batches for insert to authenticated with check (user_id = auth.uid());
create policy import_batches_update_own on public.import_batches for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy import_batches_delete_own on public.import_batches for delete to authenticated using (user_id = auth.uid());
