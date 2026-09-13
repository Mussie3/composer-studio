-- Composer Studio :: local development seed
--
-- Runs on `supabase db reset` against the LOCAL stack only. It creates a demo
-- account so the app is usable immediately after a reset, without clicking
-- through signup.
--
--   email:    demo@composer.studio
--   password: composer123
--
-- Never apply this to a hosted project.

do $$
declare
  demo_id uuid := '00000000-0000-4000-a000-000000000001';
begin
  if exists (select 1 from auth.users where id = demo_id) then
    return;
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  )
  values (
    demo_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'demo@composer.studio',
    extensions.crypt('composer123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Composer Demo"}'::jsonb,
    now(), now()
  );

  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  )
  values (
    gen_random_uuid(), demo_id, demo_id::text, 'email',
    jsonb_build_object('sub', demo_id::text, 'email', 'demo@composer.studio', 'email_verified', true),
    now(), now(), now()
  );

  -- handle_new_user() already created both profile rows; fill in the details
  -- the Settings page would otherwise show empty.
  update public.sender_profiles
     set sender_name = 'Composer Studio',
         sender_email = 'hello@composer.studio',
         reply_to_email = 'hello@composer.studio',
         is_verified = true
   where user_id = demo_id;

  update public.business_profiles
     set business_name = 'Composer Studio Inc.',
         business_address = '123 Builder Lane, Demo City',
         website_url = 'https://composer.studio'
   where user_id = demo_id;

  -- One draft, so the list page is not empty on first load. The document is the
  -- minimum shape document_shape will accept; the app replaces it on first edit.
  insert into public.mails (owner_id, title, subject, preheader, document, sender_name, sender_email, reply_to_email)
  values (
    demo_id,
    'Welcome email',
    'Welcome to {{businessName}}',
    'Glad you are here',
    jsonb_build_object(
      'blocks', '[]'::jsonb,
      'footer', jsonb_build_object(
        'showUnsubscribe', true,
        'unsubscribeLabel', 'Unsubscribe',
        'helperText', 'You are receiving this because you signed up.',
        'businessName', 'Composer Studio Inc.',
        'businessAddress', '123 Builder Lane, Demo City',
        'textColor', '#6b7280',
        'background', '#f3f4f6'
      ),
      'styles', jsonb_build_object(
        'backgroundColor', '#f3f4f6',
        'contentBackground', '#ffffff',
        'contentWidth', 600,
        'fontFamily', 'Inter, Arial, sans-serif'
      )
    ),
    'Composer Studio', 'hello@composer.studio', 'hello@composer.studio'
  );
end
$$;
