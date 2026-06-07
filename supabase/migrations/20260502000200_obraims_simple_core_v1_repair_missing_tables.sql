create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.decision_reasons (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  code text not null,
  title text not null,
  description text null,
  severity text not null default 'info',
  created_at timestamptz not null default now()
);

create table if not exists public.loan_offers (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid not null references public.loan_applications(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  decision_id uuid null references public.decisions(id) on delete set null,
  amount numeric(18,2) not null,
  term_months int not null,
  annual_interest_rate numeric(8,4) not null,
  monthly_payment numeric(18,2) null,
  status text not null default 'pending',
  expires_at timestamptz null,
  accepted_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loan_offers_status_check check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  constraint loan_offers_amount_check check (amount > 0),
  constraint loan_offers_term_check check (term_months > 0)
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid null references public.customers(id) on delete set null,
  loan_application_id uuid null references public.loan_applications(id) on delete set null,
  channel text not null default 'web',
  title text null,
  summary text null,
  transcript jsonb not null default '[]'::jsonb,
  extracted_intent text null,
  extracted_entities jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null,
  actor_id uuid null,
  object_type text not null,
  object_id uuid not null,
  action text not null,
  old_value jsonb null,
  new_value jsonb null,
  ip_address inet null,
  user_agent text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

drop trigger if exists set_loan_offers_updated_at on public.loan_offers;
create trigger set_loan_offers_updated_at
before update on public.loan_offers
for each row execute function public.set_updated_at();

drop trigger if exists set_ai_conversations_updated_at on public.ai_conversations;
create trigger set_ai_conversations_updated_at
before update on public.ai_conversations
for each row execute function public.set_updated_at();

create index if not exists decision_reasons_decision_id_idx on public.decision_reasons(decision_id);
create index if not exists decision_reasons_created_at_idx on public.decision_reasons(created_at desc);

create index if not exists loan_offers_customer_id_idx on public.loan_offers(customer_id);
create index if not exists loan_offers_loan_application_id_idx on public.loan_offers(loan_application_id);
create index if not exists loan_offers_status_idx on public.loan_offers(status);
create index if not exists loan_offers_created_at_idx on public.loan_offers(created_at desc);

create index if not exists ai_conversations_customer_id_idx on public.ai_conversations(customer_id);
create index if not exists ai_conversations_loan_application_id_idx on public.ai_conversations(loan_application_id);
create index if not exists ai_conversations_created_at_idx on public.ai_conversations(created_at desc);

create index if not exists audit_events_actor_id_idx on public.audit_events(actor_id);
create index if not exists audit_events_object_idx on public.audit_events(object_type, object_id);
create index if not exists audit_events_created_at_idx on public.audit_events(created_at desc);

alter table public.decision_reasons enable row level security;
alter table public.loan_offers enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "Customers can view decision reasons for their own decisions" on public.decision_reasons;
create policy "Customers can view decision reasons for their own decisions"
on public.decision_reasons for select
to authenticated
using (
  decision_id in (
    select d.id
    from public.decisions as d
    join public.customers as c on c.id = d.customer_id
    where c.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Customers can view their own offers" on public.loan_offers;
create policy "Customers can view their own offers"
on public.loan_offers for select
to authenticated
using (
  exists (
    select 1
    from public.customers as c
    where c.id = loan_offers.customer_id
      and c.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Customers can view their own AI conversations" on public.ai_conversations;
create policy "Customers can view their own AI conversations"
on public.ai_conversations for select
to authenticated
using (
  exists (
    select 1
    from public.customers as c
    where c.id = ai_conversations.customer_id
      and c.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Customers can create their own AI conversations" on public.ai_conversations;
create policy "Customers can create their own AI conversations"
on public.ai_conversations for insert
to authenticated
with check (
  customer_id is null or exists (
    select 1
    from public.customers as c
    where c.id = ai_conversations.customer_id
      and c.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Customers can update their own AI conversations" on public.ai_conversations;
create policy "Customers can update their own AI conversations"
on public.ai_conversations for update
to authenticated
using (
  exists (
    select 1
    from public.customers as c
    where c.id = ai_conversations.customer_id
      and c.auth_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.customers as c
    where c.id = ai_conversations.customer_id
      and c.auth_user_id = (select auth.uid())
  )
);

notify pgrst, 'reload schema';
