-- Run once in a NEW Supabase project's SQL Editor. Re-running is safe.
begin;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null check (char_length(trim(name)) between 1 and 60),
 bio text not null default '' check(char_length(bio)<=300),
 city text not null default '' check(char_length(city)<=60)
);
create table if not exists public.posts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(trim(body)) between 1 and 5000),
 kind text not null check(kind in ('פאנץ׳','רעיון','חומר')), image_path text check(image_path is null or split_part(image_path,'/',1)=user_id::text),
 created_at timestamptz not null default now()
);
create table if not exists public.comments (
 id uuid primary key default gen_random_uuid(),post_id uuid not null references public.posts(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(trim(body)) between 1 and 2000),created_at timestamptz not null default now()
);
create table if not exists public.reactions (
 post_id uuid not null references public.posts(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,primary key(post_id,user_id)
);
create table if not exists public.reports (
 id uuid primary key default gen_random_uuid(),post_id uuid not null references public.posts(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 reason text not null check(char_length(trim(reason)) between 5 and 2000),created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts(created_at desc);
create index if not exists posts_user_idx on public.posts(user_id);
create index if not exists comments_post_idx on public.comments(post_id);
create or replace function public.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,name) values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''),'קומיקאי חדש'),60));
 return new;
end;$$;
drop trigger if exists on_user_created on auth.users;
create trigger on_user_created after insert on auth.users for each row execute procedure public.create_profile();
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.reports enable row level security;
do $$ declare t text; begin
 foreach t in array array['profiles','posts','comments','reactions'] loop
 execute format('drop policy if exists community_read on public.%I',t);
 execute format('create policy community_read on public.%I for select to authenticated using (true)',t);
 end loop;
 foreach t in array array['posts','comments','reactions','reports'] loop
 execute format('drop policy if exists own_insert on public.%I',t);
 execute format('create policy own_insert on public.%I for insert to authenticated with check ((select auth.uid())=user_id)',t);
 end loop;
 foreach t in array array['posts','comments','reactions'] loop
 execute format('drop policy if exists own_delete on public.%I',t);
 execute format('create policy own_delete on public.%I for delete to authenticated using ((select auth.uid())=user_id)',t);
 end loop;
end $$;
drop policy if exists own_update on public.profiles;
create policy own_update on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
-- Reports are visible only via Supabase administration, never to community clients.
revoke all on public.reports from anon,authenticated;
grant insert on public.reports to authenticated;
grant select on public.profiles,public.posts,public.comments,public.reactions to authenticated;
grant update(name,bio,city) on public.profiles to authenticated;
grant insert,delete on public.posts,public.comments,public.reactions to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('post-images','post-images',false,5242880,array['image/jpeg','image/png','image/webp'])
 on conflict(id) do nothing;
drop policy if exists community_image_read on storage.objects;
create policy community_image_read on storage.objects for select to authenticated using(bucket_id='post-images');
drop policy if exists own_image_insert on storage.objects;
create policy own_image_insert on storage.objects for insert to authenticated with check(bucket_id='post-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists own_image_delete on storage.objects;
create policy own_image_delete on storage.objects for delete to authenticated using(bucket_id='post-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
-- Images are private; authenticated members receive signed URLs valid for one hour.
-- Enable CAPTCHA and email verification in Auth before inviting a public audience.
