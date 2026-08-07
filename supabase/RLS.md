# VisionFold Supabase RLS — Phase B

## Apply migration

1. Open **Supabase Dashboard → SQL Editor**
2. Paste and run: `supabase/migrations/20260807_phase_b_rls_baseline.sql`
3. Confirm:

```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1;
select policyname, tablename from pg_policies where schemaname = 'public' order by 2, 1;
select id, public from storage.buckets where id = 'visionfold-uploads';
```

Every listed business table must show `rowsecurity = true`.

## Tables covered

| Table | RLS | Client scope | Admin |
|-------|-----|--------------|-------|
| orgs | yes | authenticated select | all |
| users | yes | own row select | all |
| content_blocks | yes | public select | all |
| portfolio | yes | public select | all |
| messages | yes | public insert only | select/update/delete |
| projects | yes | own `client_id` select | all |
| revisions | yes | own select + insert on own projects | all |
| invoices | yes | own select | all |
| expenses | yes | — | all |
| settings | yes | public select (no secrets should be stored here) | all |
| tasks | yes | own client/assignee select | all |
| audit_logs | yes | — | select; insert for authenticated |
| storage `visionfold-uploads` | yes | public read | admin write |

## Service role vs RLS

The Node/Express server uses **`SUPABASE_SERVICE_ROLE_KEY`**, which **bypasses RLS**.

Until Phase C binds browser sessions to Supabase Auth (or issues user-scoped tokens):

- **Do not** rely on RLS alone for API security
- Keep Express checks: `req.user.role`, `clientId === req.user.id`
- Treat RLS as defense-in-depth for anon key misuse and future client-side Supabase access

## Helper functions

- `public.app_user_id()` — maps `auth.uid()` → `users.id` via `supabase_auth_uid`
- `public.app_user_role()` — role from `users` or JWT claim
- `public.is_app_admin()` — `role = admin`

Link a Supabase Auth user later:

```sql
update public.users
set supabase_auth_uid = '<uuid from auth.users>'
where email = 'client@example.com';
```

## New tables (Phase B)

- **orgs** — single org `org_visionfold`
- **tasks** — for future AI → task pipelines
- **audit_logs** — append-oriented; no update/delete policies for non-service roles

## Seeds

Admin/client password seeds remain in the legacy `supabase/schema.sql` if you need a fresh project bootstrap. Phase B migration does **not** re-seed passwords (avoids overwriting production hashes).
