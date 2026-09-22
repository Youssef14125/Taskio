-- Run this whole file in the Supabase SQL Editor for a fresh project.
-- (If you already ran these statements individually while building this
-- with Claude, your database already has all of this — no need to re-run.)

-- Tables
create table if not exists boards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users not null,
  created_at timestamp with time zone default now()
);

create table if not exists lists (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards on delete cascade not null,
  title text not null,
  position float not null,
  created_at timestamp with time zone default now()
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references lists on delete cascade not null,
  title text not null,
  description text,
  position float not null,
  created_at timestamp with time zone default now()
);

-- Row Level Security
alter table boards enable row level security;
alter table lists enable row level security;
alter table cards enable row level security;

-- Boards: only the owner can see/change their own boards
create policy "Users can view own boards"
on boards for select
using (auth.uid() = owner_id);

create policy "Users can create own boards"
on boards for insert
with check (auth.uid() = owner_id);

create policy "Users can update own boards"
on boards for update
using (auth.uid() = owner_id);

create policy "Users can delete own boards"
on boards for delete
using (auth.uid() = owner_id);

-- Lists: ownership checked through the parent board
create policy "Users can view lists on own boards"
on lists for select
using (exists (select 1 from boards where boards.id = lists.board_id and boards.owner_id = auth.uid()));

create policy "Users can create lists on own boards"
on lists for insert
with check (exists (select 1 from boards where boards.id = lists.board_id and boards.owner_id = auth.uid()));

create policy "Users can update lists on own boards"
on lists for update
using (exists (select 1 from boards where boards.id = lists.board_id and boards.owner_id = auth.uid()));

create policy "Users can delete lists on own boards"
on lists for delete
using (exists (select 1 from boards where boards.id = lists.board_id and boards.owner_id = auth.uid()));

-- Cards: ownership checked through list -> board
create policy "Users can view cards on own boards"
on cards for select
using (exists (select 1 from lists join boards on boards.id = lists.board_id where lists.id = cards.list_id and boards.owner_id = auth.uid()));

create policy "Users can create cards on own boards"
on cards for insert
with check (exists (select 1 from lists join boards on boards.id = lists.board_id where lists.id = cards.list_id and boards.owner_id = auth.uid()));

create policy "Users can update cards on own boards"
on cards for update
using (exists (select 1 from lists join boards on boards.id = lists.board_id where lists.id = cards.list_id and boards.owner_id = auth.uid()));

create policy "Users can delete cards on own boards"
on cards for delete
using (exists (select 1 from lists join boards on boards.id = lists.board_id where lists.id = cards.list_id and boards.owner_id = auth.uid()));

-- Realtime: let Supabase broadcast changes on these tables so open tabs sync live
alter publication supabase_realtime add table lists;
alter publication supabase_realtime add table cards;
