-- Homemaker: family sharing schema
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

-- Family members. `user_id` is set once that person joins on their own phone.
create table public.members (
  household_id uuid not null references public.households (id) on delete cascade,
  id text not null,
  user_id uuid references auth.users (id) on delete set null,
  name text not null check (char_length(name) between 1 and 40),
  emoji text not null default '🧑',
  color text not null default '#208AEF',
  phone text not null default '',
  created_at timestamptz not null default now(),
  primary key (household_id, id),
  unique (household_id, user_id)
);

create table public.items (
  household_id uuid not null references public.households (id) on delete cascade,
  id text not null,
  name text not null,
  emoji text not null default '📦',
  priority smallint not null check (priority between 1 and 3),
  category text not null default '',
  quantity double precision not null default 0 check (quantity >= 0),
  unit text not null default 'pcs',
  min_quantity double precision not null default 0 check (min_quantity >= 0),
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (household_id, id)
);

create table public.things (
  household_id uuid not null references public.households (id) on delete cascade,
  id text not null,
  name text not null,
  emoji text not null default '📦',
  created_at timestamptz not null default now(),
  primary key (household_id, id)
);

-- Plans: a member using a shared thing, or a personal plan when thing_id is null.
create table public.bookings (
  household_id uuid not null references public.households (id) on delete cascade,
  id text not null,
  thing_id text,
  member_id text not null,
  start_at timestamptz not null,
  end_at timestamptz not null check (end_at > start_at),
  purpose text not null default '',
  returned_at timestamptz,
  primary key (household_id, id),
  foreign key (household_id, thing_id) references public.things (household_id, id) on delete cascade,
  foreign key (household_id, member_id) references public.members (household_id, id) on delete cascade
);

create index bookings_thing_idx on public.bookings (household_id, thing_id);
create index bookings_member_idx on public.bookings (household_id, member_id);
create index members_user_idx on public.members (user_id);

-- ─────────────────────────────────────────────────────────────
-- Access rules (Row Level Security): only members of a family can see or change its data
-- ─────────────────────────────────────────────────────────────

create function public.is_household_member (hid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members
    where household_id = hid and user_id = (select auth.uid())
  );
$$;

alter table public.households enable row level security;
alter table public.members enable row level security;
alter table public.items enable row level security;
alter table public.things enable row level security;
alter table public.bookings enable row level security;

create policy "Members can view their household" on public.households
  for select to authenticated using (public.is_household_member (id));
create policy "Members can rename their household" on public.households
  for update to authenticated using (public.is_household_member (id))
  with check (public.is_household_member (id));

create policy "Household members manage members" on public.members
  for all to authenticated using (public.is_household_member (household_id))
  with check (public.is_household_member (household_id));
create policy "Household members manage items" on public.items
  for all to authenticated using (public.is_household_member (household_id))
  with check (public.is_household_member (household_id));
create policy "Household members manage things" on public.things
  for all to authenticated using (public.is_household_member (household_id))
  with check (public.is_household_member (household_id));
create policy "Household members manage bookings" on public.bookings
  for all to authenticated using (public.is_household_member (household_id))
  with check (public.is_household_member (household_id));

-- Nobody may change who a member is linked to directly; only the join/leave functions can.
revoke insert, update on public.members from authenticated, anon;
grant insert (household_id, id, name, emoji, color, phone) on public.members to authenticated;
-- (Key columns are included because upserts write them; RLS still pins rows to your household.)
grant update (household_id, id, name, emoji, color, phone) on public.members to authenticated;
-- Households are only created through create_household(); only the name can be edited.
revoke insert, update on public.households from authenticated, anon;
grant update (name) on public.households to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Functions
-- ─────────────────────────────────────────────────────────────

create function public.generate_invite_code ()
returns text
language plpgsql
set search_path = ''
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no 0/O/1/I to avoid confusion
  code text := '';
begin
  for i in 1..8 loop
    code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return code;
end;
$$;

-- Creates a family and makes the caller its first member. Returns { id, invite_code }.
create function public.create_household (p_name text, p_member jsonb)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  hid uuid;
  code text;
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in';
  end if;

  loop
    code := public.generate_invite_code();
    exit when not exists (select 1 from public.households where invite_code = code);
  end loop;

  insert into public.households (name, invite_code)
  values (trim(p_name), code)
  returning id into hid;

  insert into public.members (household_id, id, user_id, name, emoji, color, phone)
  values (
    hid,
    p_member ->> 'id',
    (select auth.uid()),
    p_member ->> 'name',
    coalesce(p_member ->> 'emoji', '🧑'),
    coalesce(p_member ->> 'color', '#208AEF'),
    coalesce(p_member ->> 'phone', '')
  );

  return json_build_object('id', hid, 'invite_code', code);
end;
$$;

-- Looks up an invite code so the app can show "Join the Sharma family? Who are you?".
create function public.preview_invite (p_code text)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'household_id', h.id,
    'name', h.name,
    'members', coalesce((
      select json_agg(json_build_object(
        'id', m.id, 'name', m.name, 'emoji', m.emoji, 'color', m.color,
        'claimed', m.user_id is not null
      ) order by m.created_at)
      from public.members m where m.household_id = h.id
    ), '[]'::json)
  )
  from public.households h
  where h.invite_code = upper(trim(p_code));
$$;

-- Joins a family with an invite code, either as an existing member ("I'm Wife")
-- or as a new member. Returns { household_id, member_id }.
create function public.join_household (p_code text, p_member_id text, p_member jsonb)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  hid uuid;
  mid text;
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in';
  end if;

  select id into hid from public.households where invite_code = upper(trim(p_code));
  if hid is null then
    raise exception 'That invite code is not valid';
  end if;

  -- Already in this family on this phone? Just return it.
  select id into mid from public.members where household_id = hid and user_id = (select auth.uid());
  if mid is not null then
    return json_build_object('household_id', hid, 'member_id', mid);
  end if;

  if p_member_id is not null then
    update public.members set user_id = (select auth.uid())
    where household_id = hid and id = p_member_id and user_id is null
    returning id into mid;
    if mid is null then
      raise exception 'That person has already joined on another phone';
    end if;
  else
    insert into public.members (household_id, id, user_id, name, emoji, color, phone)
    values (
      hid,
      p_member ->> 'id',
      (select auth.uid()),
      p_member ->> 'name',
      coalesce(p_member ->> 'emoji', '🧑'),
      coalesce(p_member ->> 'color', '#208AEF'),
      coalesce(p_member ->> 'phone', '')
    )
    returning id into mid;
  end if;

  return json_build_object('household_id', hid, 'member_id', mid);
end;
$$;

-- Unlinks this phone from the family (the member profile stays for the others).
create function public.leave_household (p_household uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.members set user_id = null
  where household_id = p_household and user_id = (select auth.uid());
$$;

-- Adds/subtracts stock atomically so two people tapping + at once both count.
create function public.adjust_item_quantity (p_household uuid, p_id text, p_delta double precision)
returns double precision
language sql
security invoker
set search_path = ''
as $$
  update public.items
  set quantity = greatest(0, quantity + p_delta), updated_at = now()
  where household_id = p_household and id = p_id
  returning quantity;
$$;

revoke execute on function public.generate_invite_code () from public, anon, authenticated;
revoke execute on function public.create_household (text, jsonb) from public, anon;
revoke execute on function public.preview_invite (text) from public, anon;
revoke execute on function public.join_household (text, text, jsonb) from public, anon;
revoke execute on function public.leave_household (uuid) from public, anon;
revoke execute on function public.adjust_item_quantity (uuid, text, double precision) from public, anon;
grant execute on function public.create_household (text, jsonb) to authenticated;
grant execute on function public.preview_invite (text) to authenticated;
grant execute on function public.join_household (text, text, jsonb) to authenticated;
grant execute on function public.leave_household (uuid) to authenticated;
grant execute on function public.adjust_item_quantity (uuid, text, double precision) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Live updates (Realtime)
-- ─────────────────────────────────────────────────────────────

-- Full row data on delete so the app can filter deletes by household.
alter table public.households replica identity full;
alter table public.members replica identity full;
alter table public.items replica identity full;
alter table public.things replica identity full;
alter table public.bookings replica identity full;

alter publication supabase_realtime add table
  public.households, public.members, public.items, public.things, public.bookings;
