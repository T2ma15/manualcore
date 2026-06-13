-- ============================================================
-- ManualCore V0 — Migración 0001: tablas
-- Fuente de verdad del schema (el Excel de matrices es visión).
-- Decisiones aplicadas: tenant_id universal, sop_admin como
-- template distinto, bilingüe es/en, 5 estados (Released se
-- queda), numeración atómica, firmas por revisión.
-- ============================================================

-- ---------- TENANCY ----------

create table public.tenants (
  id                uuid primary key default gen_random_uuid(),
  name              varchar(200) not null,
  slug              varchar(80) not null unique,
  subscription      text not null default 'pyme'
                    check (subscription in ('pyme','professional','enterprise')),
  industry_profile  text not null default 'manufacturing'
                    check (industry_profile in
                      ('manufacturing','admin_services','food_beverage',
                       'field_service','logistics','healthcare')),
  locale            text not null default 'es' check (locale in ('es','en')),
  logo_url          text,
  brand_colors      jsonb,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.users (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id),
  auth_user_id  uuid unique references auth.users(id) on delete set null,
  email         varchar(320) not null unique,
  full_name     varchar(200) not null,
  position      varchar(200),
  role          text not null default 'process_owner'
                check (role in ('platform_owner','admin','process_owner',
                                'approver','qa','operator','viewer')),
  print_auth    boolean not null default false,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index users_tenant_idx on public.users(tenant_id);

create table public.departments (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id),
  code       varchar(10) not null,
  name       varchar(200) not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, code)
);

-- ---------- TEMPLATES (catálogo global, sin tenant_id) ----------

create table public.document_templates (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,          -- sop_mfg | sop_admin | flowchart | ...
  doc_type      text not null,
  name_es       varchar(200) not null,
  name_en       varchar(200) not null,
  output_format text not null check (output_format in ('docx','xlsx','html_svg','pdf')),
  norm_version  text not null default '9001:2015',
  version       integer not null default 1,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Contador atómico para numeración [DEPT]-[SECC][####]
create table public.doc_number_counters (
  tenant_id    uuid not null references public.tenants(id),
  dept_code    varchar(10) not null,
  section_code varchar(10) not null,
  last_seq     integer not null default 0,
  primary key (tenant_id, dept_code, section_code)
);

-- ---------- SESIÓN Y NODOS ----------

create table public.sessions (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id),
  created_by       uuid not null references public.users(id),
  template_id      uuid not null references public.document_templates(id),
  process_name     varchar(300),
  language         text not null default 'es' check (language in ('es','en')),
  industry_profile text,                        -- informativo; no controla templates
  status           text not null default 'input'
                   check (status in ('input','extracting','review','confirmed',
                                     'generating','complete','error')),
  created_at       timestamptz not null default now(),
  completed_at     timestamptz,
  updated_at       timestamptz not null default now()
);
create index sessions_tenant_idx on public.sessions(tenant_id);

-- Nota: se eliminó la FK circular sessions.node_id; el nodo apunta a la sesión.
create table public.nodes (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id),
  session_id         uuid not null references public.sessions(id),
  node_code          varchar(20) not null,
  name               varchar(300) not null,
  sequence           integer check (sequence > 0),
  total_nodes        integer check (total_nodes >= sequence),
  parent_node_id     uuid references public.nodes(id),
  hierarchy_level    text check (hierarchy_level in
                       ('company_sop','area_sop','process_sop','wi_checklist','twi')),
  next_node_id       uuid references public.nodes(id),
  connection_type    text check (connection_type in ('sequential','material','terminal')),
  input_description  text,
  output_description text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (tenant_id, node_code),
  -- Regla no-negociable: se mueven juntos
  check ( (next_node_id is null and (connection_type is null or connection_type = 'terminal'))
       or (next_node_id is not null and connection_type in ('sequential','material')) )
);
create index nodes_tenant_idx on public.nodes(tenant_id);
create index nodes_session_idx on public.nodes(session_id);

create table public.operations (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id),
  node_id     uuid not null references public.nodes(id),
  op_code     varchar(20) not null,
  sequence    integer not null check (sequence > 0),
  description text not null,
  work_center varchar(200),
  safety_flag boolean not null default false,
  trained_req boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (node_id, sequence)
);
create index operations_tenant_idx on public.operations(tenant_id);

create table public.materials (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id),
  node_id     uuid not null references public.nodes(id),
  name        varchar(300) not null,
  sku         varchar(100),
  qty_per_op  numeric(10,3) check (qty_per_op > 0),
  unit        varchar(20),
  repetitions integer not null default 1 check (repetitions > 0),
  total_qty   numeric(12,3) generated always as (qty_per_op * repetitions) stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index materials_tenant_idx on public.materials(tenant_id);

create table public.steps (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id),
  operation_id     uuid not null references public.operations(id),
  node_id          uuid not null references public.nodes(id),
  step_number      integer not null check (step_number > 0),
  description      text not null,
  material_id      uuid references public.materials(id),
  critical_param   varchar(300),
  quality_gate     boolean not null default false,
  safety_hazard    boolean not null default false,
  ansi_symbol      text check (ansi_symbol in
                     ('oval','rectangle','diamond','parallelogram','connector')),
  decision_yes_to  uuid references public.steps(id),
  decision_no_to   uuid references public.steps(id),
  nc_action        text,
  dept_responsible varchar(200),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (operation_id, step_number),
  check (decision_no_to is null or nc_action is not null)
);
create index steps_tenant_idx on public.steps(tenant_id);
create index steps_operation_idx on public.steps(operation_id);

create table public.product_specs (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id),
  node_id            uuid not null references public.nodes(id),
  step_id            uuid references public.steps(id),
  characteristic     varchar(300) not null,
  nominal            numeric(12,4),
  usl                numeric(12,4),
  lsl                numeric(12,4),
  unit               varchar(30),
  measurement_method text,
  frequency          varchar(100),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index product_specs_tenant_idx on public.product_specs(tenant_id);

create table public.specs_5m (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id),
  operation_id    uuid not null unique references public.operations(id),
  man             text,
  machine         text,
  machine_id      varchar(100),
  calibration_due date,
  material        text,
  method          text,
  measurement     text,
  ppe             text,
  hazard          text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index specs_5m_tenant_idx on public.specs_5m(tenant_id);

-- Análisis de Riesgos (V0 por decisión de producto — formato matriz de riesgos,
-- DISTINTO del PFMEA que es AIAG-VDA por modo de falla y queda en V1)
create table public.risks (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id),
  session_id        uuid not null references public.sessions(id),
  node_id           uuid references public.nodes(id),
  risk_description  text not null,
  cause             text,
  consequence       text,
  probability       smallint not null check (probability between 1 and 5),
  impact            smallint not null check (impact between 1 and 5),
  risk_score        smallint generated always as (probability * impact) stored,
  current_controls  text,
  mitigation_action text,
  action_owner_id   uuid references public.users(id),
  due_date          date,
  status            text not null default 'open'
                    check (status in ('open','in_progress','mitigated','accepted')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index risks_tenant_idx on public.risks(tenant_id);
create index risks_session_idx on public.risks(session_id);

-- ---------- BRAIN ----------

create table public.session_inputs (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id),
  session_id uuid not null references public.sessions(id),
  kind       text not null default 'text' check (kind in ('text')),  -- V1: voice|photo|video
  content    text not null,
  language   text,
  created_at timestamptz not null default now()
);
create index session_inputs_tenant_idx on public.session_inputs(tenant_id);

create table public.brain_extractions (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id),
  session_id      uuid not null references public.sessions(id),
  input_id        uuid references public.session_inputs(id),
  field_path      varchar(200) not null,        -- ej: operations[2].description
  extracted_value text,
  confidence      numeric(4,3) check (confidence between 0 and 1),
  status          text not null default 'pending_confirmation'
                  check (status in ('auto_written','pending_confirmation',
                                    'confirmed','rejected','missing')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index brain_extractions_session_idx on public.brain_extractions(session_id);
create index brain_extractions_tenant_idx on public.brain_extractions(tenant_id);

-- Costo API: el principal costo variable a $49/mes. Una fila por llamada a Claude.
create table public.llm_calls (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id),
  session_id    uuid references public.sessions(id),
  purpose       text not null,                  -- extract | question | generate | revise
  model         varchar(100) not null,
  input_tokens  integer,
  output_tokens integer,
  cost_usd      numeric(10,6),
  created_at    timestamptz not null default now()
);
create index llm_calls_tenant_idx on public.llm_calls(tenant_id);

create table public.chat_messages (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id),
  session_id      uuid not null references public.sessions(id),
  role            text not null check (role in ('brain','engineer')),
  msg_type        text not null default 'free_text'
                  check (msg_type in ('question','confirmation','free_text','system')),
  content         text not null,
  linked_field    varchar(200),
  options         jsonb,
  selected_option text,
  created_at      timestamptz not null default now()
);
create index chat_messages_session_idx on public.chat_messages(session_id);
create index chat_messages_tenant_idx on public.chat_messages(tenant_id);

-- ---------- DOCUMENTOS Y CONTROL ----------

create table public.documents (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id),
  session_id      uuid references public.sessions(id),
  node_id         uuid references public.nodes(id),
  template_id     uuid not null references public.document_templates(id),
  department_id   uuid references public.departments(id),
  section_code    varchar(10),
  doc_type        text not null,
  doc_number      varchar(50),                  -- system: asignado al aprobar
  title           varchar(400) not null,
  language        text not null default 'es' check (language in ('es','en')),
  revision_number integer not null default 0,   -- REV se deriva: lpad(revision_number)
  status          text not null default 'draft'
                  check (status in ('draft','under_review','approved','released','obsolete')),
  effective_date  date,
  review_due      date,
  file_url        text,
  -- Documentos relacionados detectados por el brain en el input.
  -- Si ya existe: el brain pregunta el nombre/código y lo guarda aquí.
  -- Si no existe: queda como sugerencia pendiente de crear.
  -- Array de objetos: {"title","code","status":"existing"|"suggested"}
  related_docs    jsonb not null default '[]'::jsonb,
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, doc_number)
);
create index documents_tenant_idx on public.documents(tenant_id);
create index documents_status_idx on public.documents(tenant_id, status);

create table public.revisions (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id),
  document_id    uuid not null references public.documents(id),
  rev_number     integer not null,
  reason         text not null,
  what_changed   text,                          -- solo el brain escribe (app-enforced)
  data_snapshot  jsonb,                         -- congelar matriz al aprobar
  created_by     uuid not null references public.users(id),
  approved_by    uuid references public.users(id),
  effective_date date,
  obsolete_date  date,
  retained       boolean not null default true, -- flag de display; NUNCA se purga
  created_at     timestamptz not null default now(),
  unique (document_id, rev_number)
);
create index revisions_tenant_idx on public.revisions(tenant_id);

-- Firmas POR REVISIÓN: re-aprobar REV02 no toca las firmas de REV01.
create table public.ownership (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id),
  document_id     uuid not null references public.documents(id),
  revision_id     uuid not null references public.revisions(id),
  owner_id        uuid not null references public.users(id),
  approver_id     uuid not null references public.users(id),
  qa_id           uuid references public.users(id),
  owner_signed    timestamptz,
  approver_signed timestamptz,
  qa_signed       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (document_id, revision_id),
  check (owner_id <> approver_id)               -- regla no-negociable, en la DB
);
create index ownership_tenant_idx on public.ownership(tenant_id);

create table public.print_events (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id),
  document_id      uuid not null references public.documents(id),
  revision_id      uuid references public.revisions(id),
  printed_by       uuid not null references public.users(id),
  copy_number      integer not null check (copy_number > 0),
  total_copies     integer not null check (total_copies >= copy_number),
  pdf_snapshot_url text,                        -- el PDF exacto que salió, con footer
  printed_at       timestamptz not null default now()
);
create index print_events_tenant_idx on public.print_events(tenant_id);
create index print_events_document_idx on public.print_events(document_id);

create table public.access_grants (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id),
  document_id uuid not null references public.documents(id),
  user_id     uuid not null references public.users(id),
  level       text not null check (level in ('view','print','edit')),
  granted_by  uuid references public.users(id),
  created_at  timestamptz not null default now(),
  unique (document_id, user_id)
);
create index access_grants_tenant_idx on public.access_grants(tenant_id);

create table public.generation_jobs (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id),
  session_id       uuid references public.sessions(id),
  document_id      uuid references public.documents(id),
  idempotency_key  varchar(100) not null unique, -- un reintento NO duplica documentos
  status           text not null default 'queued'
                   check (status in ('queued','running','succeeded','failed')),
  error            text,
  output_file_path text,
  created_at       timestamptz not null default now(),
  finished_at      timestamptz
);
create index generation_jobs_tenant_idx on public.generation_jobs(tenant_id);

-- ---------- AUDIT (append-only) ----------

create table public.audit_log (
  id         bigserial primary key,
  tenant_id  uuid not null references public.tenants(id),
  session_id uuid,
  actor_id   uuid,
  actor_type text not null default 'user' check (actor_type in ('user','brain','system')),
  event_type varchar(100) not null,
  table_name varchar(100),
  record_id  uuid,
  old_value  jsonb,
  new_value  jsonb,
  comment    text,                              -- obligatorio en rechazos (app-enforced)
  created_at timestamptz not null default now()
);
create index audit_log_tenant_idx on public.audit_log(tenant_id);
create index audit_log_event_idx on public.audit_log(tenant_id, event_type);
