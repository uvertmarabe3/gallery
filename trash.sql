-- Run this once in Supabase -> SQL Editor to enable the "Recently deleted" backup.
alter table public.photos
    add column if not exists deleted_at timestamptz;

create index if not exists photos_deleted_at_idx on public.photos (deleted_at);
