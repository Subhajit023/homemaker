-- Homemaker: surprises (hidden items/plans), profile pictures and the family board.
-- Run after 0001_family_sharing.sql: Dashboard → SQL Editor → New query → paste → Run.

-- ─────────────────────────────────────────────────────────────
-- Who am I in this household?
-- ─────────────────────────────────────────────────────────────

create function public.current_member_id (hid uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.members
  where household_id = hid and user_id = (select auth.uid())
  limit 1;
$$;

revoke execute on function public.current_member_id (uuid) from public, anon;
grant execute on function public.current_member_id (uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Surprises: rows hidden from some members are never sent to their phones
-- ─────────────────────────────────────────────────────────────

alter table public.items add column hidden_from text[] not null default '{}';
alter table public.bookings add column hidden_from text[] not null default '{}';

drop policy "Household members manage items" on public.items;
drop policy "Household members manage bookings" on public.bookings;

create policy "Members see items not hidden from them" on public.items
  for select to authenticated
  using (
    public.is_household_member (household_id)
    and not (coalesce(public.current_member_id (household_id), '') = any (hidden_from))
  );
create policy "Members add items" on public.items
  for insert to authenticated
  with check (public.is_household_member (household_id));
create policy "Members change items not hidden from them" on public.items
  for update to authenticated
  using (
    public.is_household_member (household_id)
    and not (coalesce(public.current_member_id (household_id), '') = any (hidden_from))
  )
  with check (public.is_household_member (household_id));
create policy "Members delete items not hidden from them" on public.items
  for delete to authenticated
  using (
    public.is_household_member (household_id)
    and not (coalesce(public.current_member_id (household_id), '') = any (hidden_from))
  );

create policy "Members see plans not hidden from them" on public.bookings
  for select to authenticated
  using (
    public.is_household_member (household_id)
    and not (coalesce(public.current_member_id (household_id), '') = any (hidden_from))
  );
create policy "Members add plans" on public.bookings
  for insert to authenticated
  with check (public.is_household_member (household_id));
create policy "Members change plans not hidden from them" on public.bookings
  for update to authenticated
  using (
    public.is_household_member (household_id)
    and not (coalesce(public.current_member_id (household_id), '') = any (hidden_from))
  )
  with check (public.is_household_member (household_id));
create policy "Members delete plans not hidden from them" on public.bookings
  for delete to authenticated
  using (
    public.is_household_member (household_id)
    and not (coalesce(public.current_member_id (household_id), '') = any (hidden_from))
  );

-- ─────────────────────────────────────────────────────────────
-- Profile pictures (small JPEG stored as a data URI)
-- ─────────────────────────────────────────────────────────────

alter table public.members
  add column photo text not null default '' check (char_length(photo) < 400000);

grant insert (photo) on public.members to authenticated;
grant update (photo) on public.members to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Family board
-- ─────────────────────────────────────────────────────────────

create table public.posts (
  household_id uuid not null references public.households (id) on delete cascade,
  id text not null,
  member_id text not null,
  text text not null default '' check (char_length(text) <= 2000),
  photo text not null default '' check (char_length(photo) < 800000),
  -- { "❤️": ["member-id", ...], "😂": [...] }
  reactions jsonb not null default '{}'::jsonb,
  hidden_from text[] not null default '{}',
  created_at timestamptz not null default now(),
  primary key (household_id, id),
  foreign key (household_id, member_id) references public.members (household_id, id) on delete cascade
);

create index posts_household_created_idx on public.posts (household_id, created_at desc);

alter table public.posts enable row level security;

create policy "Members see posts not hidden from them" on public.posts
  for select to authenticated
  using (
    public.is_household_member (household_id)
    and not (coalesce(public.current_member_id (household_id), '') = any (hidden_from))
  );
-- You can only post as yourself.
create policy "Members post as themselves" on public.posts
  for insert to authenticated
  with check (member_id = public.current_member_id (household_id));
-- Only the author can delete a post.
create policy "Authors delete their posts" on public.posts
  for delete to authenticated
  using (member_id = public.current_member_id (household_id));
-- No direct updates: reactions go through toggle_reaction().
revoke update on public.posts from authenticated, anon;

-- Adds or removes the caller's reaction on a post. Returns the new reactions.
create function public.toggle_reaction (p_household uuid, p_post text, p_emoji text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  mid text := public.current_member_id (p_household);
  result jsonb;
begin
  if mid is null then
    raise exception 'Not a member of this family';
  end if;
  if char_length(p_emoji) > 16 then
    raise exception 'Invalid reaction';
  end if;

  update public.posts p
  set reactions = case
    when coalesce(p.reactions -> p_emoji, '[]'::jsonb) ? mid
      then jsonb_set(p.reactions, array[p_emoji], (p.reactions -> p_emoji) - mid)
    else jsonb_set(p.reactions, array[p_emoji], coalesce(p.reactions -> p_emoji, '[]'::jsonb) || to_jsonb(mid))
  end
  where p.household_id = p_household
    and p.id = p_post
    and not (mid = any (p.hidden_from))
  returning p.reactions into result;

  return result;
end;
$$;

revoke execute on function public.toggle_reaction (uuid, text, text) from public, anon;
grant execute on function public.toggle_reaction (uuid, text, text) to authenticated;

alter table public.posts replica identity full;
alter publication supabase_realtime add table public.posts;

-- Show profile pictures on the "Who are you?" step when joining.
create or replace function public.preview_invite (p_code text)
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
        'id', m.id, 'name', m.name, 'emoji', m.emoji, 'color', m.color, 'photo', m.photo,
        'claimed', m.user_id is not null
      ) order by m.created_at)
      from public.members m where m.household_id = h.id
    ), '[]'::json)
  )
  from public.households h
  where h.invite_code = upper(trim(p_code));
$$;
