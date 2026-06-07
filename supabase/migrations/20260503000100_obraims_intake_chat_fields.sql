alter table public.loan_applications
  add column if not exists address_line1 text null,
  add column if not exists address_line2 text null,
  add column if not exists district_city text null,
  add column if not exists province_state text null,
  add column if not exists postal_code text null,
  add column if not exists country text not null default 'Mongolia',
  add column if not exists has_collateral boolean not null default false,
  add column if not exists collateral_type text null,
  add column if not exists collateral_description text null,
  add column if not exists collateral_estimated_value numeric(18,2) null,
  add column if not exists collateral_ownership_status text null,
  add column if not exists collateral_location text null,
  add column if not exists documents jsonb not null default '[]'::jsonb;

create index if not exists loan_applications_source_idx
  on public.loan_applications(source);

create index if not exists loan_applications_has_collateral_idx
  on public.loan_applications(has_collateral);

notify pgrst, 'reload schema';
