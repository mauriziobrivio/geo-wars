-- Kontinue? Games — community SUGGESTION BOX backend
-- Mirrors the hardened authless pattern used by the score boards (§4 of CLAUDE.md):
--   * public table, RLS lets anon SELECT *only approved rows*
--   * direct writes bounce off RLS; the edge function inserts with the service role
--   * a deny-all ledger table powers per-IP rate limiting
--
-- Apply with the Supabase MCP `apply_migration`, or `supabase db push` on project
-- ref artypnnxsdovgmsznlbg.

-- ---------------------------------------------------------------------------
-- suggestions: one player idea. approved defaults false -> hidden until Maurizio
-- flips it true (curated public feed). Nothing user-typed shows up unreviewed.
-- ---------------------------------------------------------------------------
create table if not exists public.suggestions (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  tag         text,                       -- optional 3-letter arcade initials, A-Z
  category    text not null default 'GAME',-- GAME | FEATURE | FIX | OTHER
  body        text not null,              -- the idea (4..280 chars, enforced in fn + check)
  approved    boolean not null default false,
  pinned      boolean not null default false,
  constraint suggestions_body_len  check (char_length(body) between 1 and 400),
  constraint suggestions_tag_shape check (tag is null or tag ~ '^[A-Z]{3}$'),
  constraint suggestions_category  check (category in ('GAME','FEATURE','FIX','OTHER'))
);

-- Public feed reads: newest approved first. pinned-first is done client-side / via the
-- curated query; an index on the common filter keeps it cheap.
create index if not exists suggestions_approved_idx
  on public.suggestions (approved, pinned desc, created_at desc);

alter table public.suggestions enable row level security;

-- anon (and authenticated) may read ONLY approved rows. No insert/update/delete policy
-- exists, so every direct write from the anon key is denied -> only the service-role
-- edge function can insert.
drop policy if exists "approved suggestions are public" on public.suggestions;
create policy "approved suggestions are public"
  on public.suggestions for select
  using (approved = true);

-- ---------------------------------------------------------------------------
-- suggestion_submissions: per-IP rate-limit ledger. RLS enabled, NO policies ->
-- deny-all to anon (the "RLS Enabled No Policy" advisor INFO here is intentional,
-- same as the *_submissions tables). Only the service role touches it.
-- ---------------------------------------------------------------------------
create table if not exists public.suggestion_submissions (
  id         bigint generated always as identity primary key,
  ip_hash    text not null,
  created_at timestamptz not null default now()
);

create index if not exists suggestion_submissions_ip_time_idx
  on public.suggestion_submissions (ip_hash, created_at desc);

alter table public.suggestion_submissions enable row level security;
