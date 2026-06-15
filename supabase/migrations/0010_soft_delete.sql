-- ============================================================
-- ManualCore -- Migracion 0010: borrado suave + papelera 30 dias
-- El documento se marca borrado (queda trazabilidad de que existio),
-- se puede recuperar 30 dias, y luego se purga del sistema.
-- ============================================================

alter table public.documents add column if not exists deleted_at timestamptz;
create index if not exists documents_deleted_idx on public.documents(tenant_id, deleted_at);
