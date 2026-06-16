create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in ('invoice','act','income_report','kudir','usn_draft','other')),
  title text not null,
  file_name text,
  format text not null check (format in ('pdf','xlsx','html','txt')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_user_created_idx on public.documents(user_id, created_at desc);
create index if not exists documents_user_type_idx on public.documents(user_id, document_type);

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at before update on public.documents for each row execute function public.set_updated_at();

alter table public.documents enable row level security;

create policy documents_select_own on public.documents for select to authenticated using (user_id = auth.uid());
create policy documents_insert_own on public.documents for insert to authenticated with check (user_id = auth.uid());
create policy documents_update_own on public.documents for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy documents_delete_own on public.documents for delete to authenticated using (user_id = auth.uid());
