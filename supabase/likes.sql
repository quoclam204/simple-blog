create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (post_id, user_id)
);

alter table public.likes enable row level security;

create policy "Likes are viewable by everyone" on public.likes
  for select
  using (true);

create policy "Users can like posts" on public.likes
  for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike their likes" on public.likes
  for delete
  using (auth.uid() = user_id);
