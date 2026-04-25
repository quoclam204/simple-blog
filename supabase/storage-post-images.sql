insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "Public read post images" on storage.objects
  for select
  using (bucket_id = 'post-images');

create policy "Authenticated users can upload post images" on storage.objects
  for insert
  with check (
    bucket_id = 'post-images'
    and auth.role() = 'authenticated'
  );

create policy "Users can update their post images" on storage.objects
  for update
  using (
    bucket_id = 'post-images'
    and auth.uid() = owner
  )
  with check (
    bucket_id = 'post-images'
    and auth.uid() = owner
  );

create policy "Users can delete their post images" on storage.objects
  for delete
  using (
    bucket_id = 'post-images'
    and auth.uid() = owner
  );
