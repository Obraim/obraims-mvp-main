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

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid null references auth.users(id) on delete set null,
  full_name text null,
  phone text null,
  email text null,
  register_number text null,
  customer_type text not null default 'individual',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.loan_applications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  requested_amount numeric(18,2) not null,
  requested_term_months int not null,
  loan_purpose text null,
  monthly_income numeric(18,2) null,
  employment_status text null,
  status text not null default 'draft',
  channel text not null default 'web',
  source text null,
  submitted_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loan_applications_status_check check (
    status in (
      'draft',
      'submitted',
      'under_review',
      'approved',
      'rejected',
      'offer_generated',
      'offer_accepted',
      'cancelled'
    )
  ),
  constraint loan_applications_requested_amount_check check (requested_amount > 0),
  constraint loan_applications_requested_term_check check (requested_term_months > 0)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  loan_application_id uuid null references public.loan_applications(id) on delete set null,
  document_type text not null,
  file_path text not null,
  file_name text null,
  mime_type text null,
  file_size_bytes bigint null,
  status text not null default 'uploaded',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  loan_application_id uuid null references public.loan_applications(id) on delete set null,
  consent_type text not null,
  consent_version text not null default 'v1',
  granted boolean not null default true,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz null,
  ip_address inet null,
  user_agent text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid not null references public.loan_applications(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  decision text not null,
  decided_by text not null default 'system',
  decided_by_id uuid null,
  summary text null,
  approved_amount numeric(18,2) null,
  approved_term_months int null,
  annual_interest_rate numeric(8,4) null,
  created_at timestamptz not null default now(),
  constraint decisions_decision_check check (decision in ('approved', 'rejected', 'referred', 'counteroffer'))
);

create table public.decision_reasons (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  code text not null,
  title text not null,
  description text null,
  severity text not null default 'info',
  created_at timestamptz not null default now()
);

create table public.loan_offers (
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

create table public.ai_conversations (
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

create table public.audit_events (
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

create trigger set_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create trigger set_loan_applications_updated_at
before update on public.loan_applications
for each row execute function public.set_updated_at();

create trigger set_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

create trigger set_loan_offers_updated_at
before update on public.loan_offers
for each row execute function public.set_updated_at();

create trigger set_ai_conversations_updated_at
before update on public.ai_conversations
for each row execute function public.set_updated_at();

create index customers_auth_user_id_idx on public.customers(auth_user_id);
create index customers_email_idx on public.customers(email);
create index customers_phone_idx on public.customers(phone);
create index customers_register_number_idx on public.customers(register_number);
create index customers_created_at_idx on public.customers(created_at desc);

create index loan_applications_customer_id_idx on public.loan_applications(customer_id);
create index loan_applications_status_idx on public.loan_applications(status);
create index loan_applications_created_at_idx on public.loan_applications(created_at desc);

create index documents_customer_id_idx on public.documents(customer_id);
create index documents_loan_application_id_idx on public.documents(loan_application_id);
create index documents_status_idx on public.documents(status);
create index documents_created_at_idx on public.documents(created_at desc);

create index consents_customer_id_idx on public.consents(customer_id);
create index consents_loan_application_id_idx on public.consents(loan_application_id);
create index consents_created_at_idx on public.consents(created_at desc);

create index decisions_customer_id_idx on public.decisions(customer_id);
create index decisions_loan_application_id_idx on public.decisions(loan_application_id);
create index decisions_decision_idx on public.decisions(decision);
create index decisions_created_at_idx on public.decisions(created_at desc);

create index decision_reasons_decision_id_idx on public.decision_reasons(decision_id);
create index decision_reasons_created_at_idx on public.decision_reasons(created_at desc);

create index loan_offers_customer_id_idx on public.loan_offers(customer_id);
create index loan_offers_loan_application_id_idx on public.loan_offers(loan_application_id);
create index loan_offers_status_idx on public.loan_offers(status);
create index loan_offers_created_at_idx on public.loan_offers(created_at desc);

create index ai_conversations_customer_id_idx on public.ai_conversations(customer_id);
create index ai_conversations_loan_application_id_idx on public.ai_conversations(loan_application_id);
create index ai_conversations_created_at_idx on public.ai_conversations(created_at desc);

create index audit_events_actor_id_idx on public.audit_events(actor_id);
create index audit_events_object_idx on public.audit_events(object_type, object_id);
create index audit_events_created_at_idx on public.audit_events(created_at desc);

alter table public.customers enable row level security;
alter table public.loan_applications enable row level security;
alter table public.documents enable row level security;
alter table public.consents enable row level security;
alter table public.decisions enable row level security;
alter table public.decision_reasons enable row level security;
alter table public.loan_offers enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.audit_events enable row level security;

create policy "Customers can view their own profile"
on public.customers for select
to authenticated
using ((select auth.uid()) is not null and auth_user_id = (select auth.uid()));

create policy "Customers can create their own profile"
on public.customers for insert
to authenticated
with check ((select auth.uid()) is not null and auth_user_id = (select auth.uid()));

create policy "Customers can update their own profile"
on public.customers for update
to authenticated
using ((select auth.uid()) is not null and auth_user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and auth_user_id = (select auth.uid()));

create policy "Customers can view their own applications"
on public.loan_applications for select
to authenticated
using (
  exists (
    select 1 from public.customers
    where customers.id = loan_applications.customer_id
      and customers.auth_user_id = (select auth.uid())
  )
);

create policy "Customers can create their own applications"
on public.loan_applications for insert
to authenticated
with check (
  exists (
    select 1 from public.customers
    where customers.id = loan_applications.customer_id
      and customers.auth_user_id = (select auth.uid())
  )
);

create policy "Customers can view their own documents"
on public.documents for select
to authenticated
using (
  exists (
    select 1 from public.customers
    where customers.id = documents.customer_id
      and customers.auth_user_id = (select auth.uid())
  )
);

create policy "Customers can create document records for themselves"
on public.documents for insert
to authenticated
with check (
  exists (
    select 1 from public.customers
    where customers.id = documents.customer_id
      and customers.auth_user_id = (select auth.uid())
  )
);

create policy "Customers can view their own consents"
on public.consents for select
to authenticated
using (
  exists (
    select 1 from public.customers
    where customers.id = consents.customer_id
      and customers.auth_user_id = (select auth.uid())
  )
);

create policy "Customers can grant their own consents"
on public.consents for insert
to authenticated
with check (
  exists (
    select 1 from public.customers
    where customers.id = consents.customer_id
      and customers.auth_user_id = (select auth.uid())
  )
);

create policy "Customers can view their own decisions"
on public.decisions for select
to authenticated
using (
  exists (
    select 1 from public.customers
    where customers.id = decisions.customer_id
      and customers.auth_user_id = (select auth.uid())
  )
);

create policy "Customers can view decision reasons for their own decisions"
on public.decision_reasons for select
to authenticated
using (
  exists (
    select 1
    from public.decisions
    join public.customers on customers.id = decisions.customer_id
    where decisions.id = decision_reasons.decision_id
      and customers.auth_user_id = (select auth.uid())
  )
);

create policy "Customers can view their own offers"
on public.loan_offers for select
to authenticated
using (
  exists (
    select 1 from public.customers
    where customers.id = loan_offers.customer_id
      and customers.auth_user_id = (select auth.uid())
  )
);

create policy "Customers can view their own AI conversations"
on public.ai_conversations for select
to authenticated
using (
  exists (
    select 1 from public.customers
    where customers.id = ai_conversations.customer_id
      and customers.auth_user_id = (select auth.uid())
  )
);

create policy "Customers can create their own AI conversations"
on public.ai_conversations for insert
to authenticated
with check (
  customer_id is null or exists (
    select 1 from public.customers
    where customers.id = ai_conversations.customer_id
      and customers.auth_user_id = (select auth.uid())
  )
);

create policy "Customers can update their own AI conversations"
on public.ai_conversations for update
to authenticated
using (
  exists (
    select 1 from public.customers
    where customers.id = ai_conversations.customer_id
      and customers.auth_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.customers
    where customers.id = ai_conversations.customer_id
      and customers.auth_user_id = (select auth.uid())
  )
);
