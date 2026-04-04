-- 工人每日状态表：用于 Worker Panel 的休息标记
create table if not exists public.worker_daily_statuses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  worker_id uuid not null references public.workers(id) on delete cascade,
  status text not null check (status in ('REST')),
  note text,
  unique (date, worker_id)
);

create index if not exists idx_worker_daily_statuses_date on public.worker_daily_statuses(date);
create index if not exists idx_worker_daily_statuses_worker_id on public.worker_daily_statuses(worker_id);
