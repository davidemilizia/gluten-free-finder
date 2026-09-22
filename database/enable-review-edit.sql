-- Gluten Free Finder - allow users to edit their review
-- Run once in Supabase SQL Editor.

begin;

create or replace function public.reset_review_approval_on_edit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.rating is distinct from old.rating
     or new.title is distinct from old.title
     or new.comment is distinct from old.comment then
    new.approved = false;
  end if;

  return new;
end;
$$;

drop trigger if exists reviews_reset_approval_on_edit on public.reviews;

create trigger reviews_reset_approval_on_edit
before update on public.reviews
for each row
execute procedure public.reset_review_approval_on_edit();

commit;
