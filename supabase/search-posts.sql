-- Full-text search setup for posts
-- Uses the simple configuration for better multilingual support.

alter table public.posts
  add column if not exists search_vector tsvector;

create or replace function public.posts_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector := to_tsvector(
    'simple',
    coalesce(new.title, '') || ' ' ||
    coalesce(new.excerpt, '') || ' ' ||
    coalesce(new.content, '')
  );
  return new;
end;
$$;

drop trigger if exists posts_search_vector_trigger on public.posts;
create trigger posts_search_vector_trigger
before insert or update of title, excerpt, content
on public.posts
for each row
execute function public.posts_search_vector_update();

update public.posts
set search_vector = to_tsvector(
  'simple',
  coalesce(title, '') || ' ' ||
  coalesce(excerpt, '') || ' ' ||
  coalesce(content, '')
);

create index if not exists posts_search_vector_idx
on public.posts
using gin (search_vector);

create or replace function public.search_posts(
  search_query text,
  limit_count int default 20,
  offset_count int default 0
)
returns table (
  id uuid,
  title text,
  slug text,
  excerpt text,
  content text,
  published_at timestamptz,
  author_id uuid,
  display_name text,
  avatar_url text,
  rank real
)
language sql
stable
as $$
  select
    p.id,
    p.title,
    p.slug,
    p.excerpt,
    p.content,
    p.published_at,
    p.author_id,
    pr.display_name,
    pr.avatar_url,
    ts_rank(p.search_vector, websearch_to_tsquery('simple', search_query)) as rank
  from public.posts p
  left join public.profiles pr on pr.id = p.author_id
  where p.status = 'published'
    and p.search_vector @@ websearch_to_tsquery('simple', search_query)
  order by rank desc, p.published_at desc
  limit limit_count offset offset_count;
$$;
