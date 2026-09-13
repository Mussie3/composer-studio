-- Composer Studio :: image storage
--
-- The mock backend returned a data: URL, which is fine for localStorage and
-- fatal for real email -- Gmail strips data: URIs and the image renders as a
-- broken box. Images must live at a plain public https URL that any mail client
-- can fetch with no credentials.
--
-- Hence: a PUBLIC bucket. Reads are open by design. Writes are locked to the
-- owning user's folder, so "public" means "publicly readable", never
-- "publicly writable".

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'composer-assets',
  'composer-assets',
  true,
  5 * 1024 * 1024,   -- 5 MB: past this, most clients clip the message anyway
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Object paths are "<user_id>/<uuid>.<ext>", so the first path segment is the
-- ownership check.
drop policy if exists composer_assets_read on storage.objects;
create policy composer_assets_read on storage.objects
  for select to public
  using (bucket_id = 'composer-assets');

drop policy if exists composer_assets_insert_own on storage.objects;
create policy composer_assets_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'composer-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists composer_assets_update_own on storage.objects;
create policy composer_assets_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'composer-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists composer_assets_delete_own on storage.objects;
create policy composer_assets_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'composer-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
