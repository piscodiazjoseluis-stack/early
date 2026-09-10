create extension if not exists pgcrypto;

create type public.app_role as enum ('COLLABORATOR', 'TEAM_LEADER', 'PORTFOLIO_MANAGER', 'ADMIN');
create type public.request_status as enum (
  'DRAFT', 'PENDING_TEAM_LEADER', 'RETURNED_FOR_CORRECTION',
  'APPROVED_BY_TEAM_LEADER', 'PENDING_PORTFOLIO',
  'REJECTED_BY_TEAM_LEADER', 'REJECTED_BY_PORTFOLIO',
  'FINAL_APPROVED', 'CANCELLATION_REQUESTED', 'CANCELLED',
  'USED', 'NOT_USED', 'EXPIRED'
);
create type public.approval_level as enum ('NONE', 'TEAM_LEADER', 'PORTFOLIO', 'COMPLETED');
create type public.approval_decision as enum (
  'APPROVED', 'REJECTED', 'RETURNED_FOR_CORRECTION',
  'CANCELLATION_REQUESTED', 'CANCELLATION_APPROVED'
);
create type public.usage_status as enum ('USED', 'NOT_USED');
create type public.availability_type as enum (
  'VACATION', 'MEDICAL_LEAVE', 'LEAVE', 'ABSENCE',
  'OPERATIONAL_RESTRICTION', 'OPT_OUT'
);
create type public.blocked_date_type as enum (
  'HOLIDAY', 'CRITICAL_DELIVERABLE', 'MONTH_END',
  'CORPORATE_EVENT', 'OPERATIONAL_RESTRICTION'
);
create type public.notification_type as enum (
  'REQUEST_CREATED', 'REQUEST_UPDATED', 'APPROVAL_REQUIRED',
  'REQUEST_APPROVED', 'REQUEST_REJECTED', 'REQUEST_RETURNED',
  'CANCELLATION', 'USAGE_CONFIRMATION', 'SYSTEM'
);
create type public.ai_feedback_type as enum (
  'USEFUL', 'NOT_USEFUL', 'APPLIED', 'REJECTED', 'MODIFIED'
);
create type public.ai_scope_type as enum ('TEAM', 'GLOBAL');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  full_name text not null check (length(trim(full_name)) between 2 and 160),
  job_title text not null check (length(trim(job_title)) between 2 and 160),
  avatar_url text,
  employee_code text unique,
  is_active boolean not null default true,
  timezone text not null default 'America/Lima',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code public.app_role not null unique,
  display_name text not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  assigned_by uuid references public.profiles(id) on delete set null,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, role_id, valid_from),
  check (valid_until is null or valid_until > valid_from)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code)),
  name text not null unique,
  description text,
  leader_user_id uuid references public.profiles(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  is_eligible boolean not null default true,
  participates_in_rotation boolean not null default true,
  valid_from date not null default current_date,
  valid_until date,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_until >= valid_from)
);

create unique index team_members_one_current_team_per_user
  on public.team_members (user_id)
  where valid_until is null;
create unique index team_members_unique_membership_period
  on public.team_members (team_id, user_id, valid_from);

create table public.early_friday_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  starts_on date not null,
  ends_on date not null,
  request_deadline_interval interval not null default interval '2 days',
  cancellation_deadline_interval interval not null default interval '1 day',
  default_start_time time not null default time '13:00',
  default_end_time time not null default time '15:30',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  check (default_end_time > default_start_time)
);

create table public.early_friday_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references public.profiles(id) on delete restrict,
  team_id uuid not null references public.teams(id) on delete restrict,
  period_id uuid not null references public.early_friday_periods(id) on delete restrict,
  requested_date date not null check (extract(isodow from requested_date) = 5),
  requested_start_time time not null,
  requested_end_time time not null,
  reason text,
  status public.request_status not null default 'DRAFT',
  current_approval_level public.approval_level not null default 'NONE',
  rotation_priority integer,
  priority_explanation jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  final_decided_at timestamptz,
  cancellation_reason text,
  usage_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (requested_end_time > requested_start_time),
  check (
    (status = 'DRAFT' and submitted_at is null)
    or status <> 'DRAFT'
  )
);

create unique index requests_one_active_per_user_friday
  on public.early_friday_requests (requester_user_id, requested_date)
  where status not in (
    'REJECTED_BY_TEAM_LEADER', 'REJECTED_BY_PORTFOLIO',
    'CANCELLED', 'EXPIRED'
  ) and deleted_at is null;
create unique index requests_one_final_approved_per_team_friday
  on public.early_friday_requests (team_id, requested_date)
  where status in ('FINAL_APPROVED', 'USED', 'NOT_USED')
    and deleted_at is null;
create index requests_team_date_idx on public.early_friday_requests (team_id, requested_date);
create index requests_status_idx on public.early_friday_requests (status, requested_date);
create index requests_requester_idx on public.early_friday_requests (requester_user_id, created_at desc);

create table public.request_approvals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.early_friday_requests(id) on delete restrict,
  approver_user_id uuid not null references public.profiles(id) on delete restrict,
  requester_user_id uuid not null references public.profiles(id) on delete restrict,
  level public.approval_level not null,
  decision public.approval_decision not null,
  reason_code text,
  comment text,
  decided_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (approver_user_id <> requester_user_id),
  check (
    decision not in ('REJECTED', 'RETURNED_FOR_CORRECTION')
    or (reason_code is not null and length(trim(reason_code)) > 0
        and comment is not null and length(trim(comment)) > 0)
  )
);
create index request_approvals_request_idx
  on public.request_approvals (request_id, decided_at);

create table public.rotation_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.early_friday_requests(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  team_id uuid not null references public.teams(id) on delete restrict,
  benefit_date date not null check (extract(isodow from benefit_date) = 5),
  usage public.usage_status not null,
  confirmed_by uuid not null references public.profiles(id) on delete restrict,
  confirmed_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);
create index rotation_history_team_date_idx
  on public.rotation_history (team_id, benefit_date desc);
create index rotation_history_user_date_idx
  on public.rotation_history (user_id, benefit_date desc);

create table public.availability_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  type public.availability_type not null,
  starts_on date not null,
  ends_on date not null,
  reason_summary text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (ends_on >= starts_on)
);
create index availability_user_dates_idx
  on public.availability_periods (user_id, starts_on, ends_on);

create table public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null unique check (extract(isodow from blocked_date) = 5),
  type public.blocked_date_type not null,
  title text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.exception_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code)),
  name text not null,
  description text not null,
  requires_evidence boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.request_exceptions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.early_friday_requests(id) on delete restrict,
  exception_type_id uuid not null references public.exception_types(id) on delete restrict,
  violated_rule text not null,
  justification text not null check (length(trim(justification)) >= 10),
  authorized_by uuid not null references public.profiles(id) on delete restrict,
  evidence_path text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  request_id uuid references public.early_friday_requests(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_schema text not null default 'public',
  entity_table text not null,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  request_id uuid,
  occurred_at timestamptz not null default now()
);
create index audit_logs_entity_idx
  on public.audit_logs (entity_table, entity_id, occurred_at desc);
create index audit_logs_actor_idx
  on public.audit_logs (actor_user_id, occurred_at desc);

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  description text not null,
  is_public boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  scope public.ai_scope_type not null,
  team_id uuid references public.teams(id) on delete restrict,
  target_date date,
  title text not null,
  summary text not null,
  confidence numeric(5,2) not null check (confidence between 0 and 100),
  evidence jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  suggested_action text not null,
  deterministic_inputs jsonb not null default '{}'::jsonb,
  model_provider text,
  model_name text,
  generated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  check (
    (scope = 'TEAM' and team_id is not null)
    or (scope = 'GLOBAL' and team_id is null)
  )
);

create table public.ai_feedback (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.ai_recommendations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  feedback public.ai_feedback_type not null,
  comment text,
  created_at timestamptz not null default now(),
  unique (recommendation_id, user_id)
);

create index user_roles_active_idx on public.user_roles (user_id, valid_until);
create index team_members_team_active_idx on public.team_members (team_id, valid_until);
create index ai_recommendations_scope_idx on public.ai_recommendations (scope, team_id, created_at desc);
