# DekSites CRM

Lead pipeline, client roster, employee activity, and MRR tracking for selling
websites to local businesses. Postgres + Supabase backend, React (Vite)
frontend, deploys to Vercel.

```
deksites-crm/
├── index.html, vite.config.js, package.json, vercel.json   # runnable app shell
├── .env.example
├── src/
│   ├── main.jsx            # entry
│   ├── App.jsx             # the live app (real auth + data)
│   ├── supabase.js         # client init
│   └── queries.js          # data layer (RLS does the authz)
├── supabase/
│   ├── schema.sql          # tables, enums, RLS, triggers, auto-conversion
│   ├── seed.sql            # the 2 plans + sample leads
│   └── functions/create-employee/index.ts   # owner-only user creation
└── DekSitesCRM.jsx         # the standalone mock demo (reference only, not used by the app)
```

## Read this first

- Security lives in `supabase/schema.sql`, not the UI. RLS is what stops one rep
  from reading another's pipeline. If a list comes back empty, that is usually
  RLS doing its job (wrong role, or leads not assigned to that user), not a bug.
- The service role key creates auth users. It lives ONLY in the Edge Function,
  never in the frontend. Do not paste it into `.env`.
- This is wired and parses clean, but it has not been run against a live project
  end to end (I can't spin up your Supabase here). Expect one or two small
  first-run fixes. The "common snags" section covers the likely ones.

## Go-live checklist

### 1. Supabase project
Create a project at supabase.com. Copy the Project URL and the anon public key
(Settings > API).

### 2. Run the SQL
SQL Editor > paste `supabase/schema.sql` > Run. Then `supabase/seed.sql` > Run.

### 3. Make yourself the owner
Authentication > Users > Add user (your email + a password, tick auto-confirm).
Then in SQL Editor:
```sql
update public.profiles set role = 'owner', full_name = 'Dek'
where id = (select id from auth.users where email = 'you@deksites.com');
```

### 4. Run the frontend locally
```
npm install
cp .env.example .env.local      # then fill in the two values
npm run dev
```
`.env.local`:
```
VITE_SUPABASE_URL=https://YOURPROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
Sign in with the owner account. You should see the seeded leads.

### 5. Add employees (two options)

Option A, the in-app button (recommended). Deploy the Edge Function once:
```
npm i -g supabase
supabase login
supabase link --project-ref YOURPROJECT
supabase functions deploy create-employee
```
`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically for deployed functions. After that, the Team page "Add employee"
button works.

Option B, manual. Authentication > Users > Add user for each rep (auto-confirm).
They land as `employee` via the `handle_new_user` trigger. Then assign them leads:
```sql
update public.leads
set assigned_to = (select id from auth.users where email = 'rep@deksites.com')
where assigned_to is null;
```

### 6. Deploy to Vercel
Push to GitHub, import the repo into Vercel. Add the two env vars
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in Project Settings. Deploy.
`vercel.json` handles SPA routing so refreshes don't 404.

## Common snags

- **"Invalid login credentials" on a dashboard-created user.** Supabase requires
  email confirmation by default. Either tick auto-confirm when creating the user,
  or turn off Authentication > Providers > Email > "Confirm email". The Edge
  Function already sets `email_confirm: true`, so option A side-steps this.
- **Employee sees zero leads.** They only see leads where `assigned_to` is their
  id (step 5 reassigns the seed leads). Working as intended.
- **Delete does nothing for an employee.** RLS blocks it; the UI hides the button
  for them anyway. Only owners delete.
- **Add employee fails.** The Edge Function isn't deployed yet. Use option B, or
  finish step 5A.

## Roles

| Capability                      | Owner | Employee |
|---------------------------------|:-----:|:--------:|
| See all leads                   | yes   | own only |
| Edit leads                      | all   | own only |
| Delete records                  | yes   | no       |
| See all activity                | yes   | own only |
| View active clients             | yes   | yes      |
| Edit clients (tier + fees)      | yes   | no       |
| Create employees                | yes   | no       |

## Plans
- Tier 01 - Essentials: $250 build + $50/mo
- Tier 02 - Essentials + AI SEO: $500 build + $150/mo

## Auto-conversion
Set a lead to `closed_won` and a DB trigger creates the client row (tier and fees
blank). The owner sets tier + fees on the client to start counting MRR. One client
per lead, enforced at the DB level.
