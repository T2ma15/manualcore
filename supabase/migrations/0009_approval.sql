-- ============================================================
-- ManualCore -- Migracion 0009: aprobacion (opcion A, flexible)
-- + numeracion editable
-- ============================================================

alter table public.documents add column if not exists owner_name text;
alter table public.documents add column if not exists approver_name text;

-- Reemplaza el state machine: permite draft->approved directo,
-- quita la inmutabilidad de doc_number (numeracion editable),
-- mantiene review_due obligatorio y sella fechas al aprobar.
create or replace function public.enforce_document_transitions()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'draft' and new.status in ('under_review','approved')) or
      (old.status = 'under_review' and new.status in ('draft','approved')) or
      (old.status = 'approved' and new.status in ('released','obsolete','draft')) or
      (old.status = 'released' and new.status in ('obsolete','draft'))
    ) then
      raise exception 'Transicion de estado invalida: % -> %', old.status, new.status;
    end if;

    if new.status in ('under_review','approved') and new.review_due is null then
      raise exception 'review_due es obligatorio para revisar o aprobar';
    end if;

    if new.status = 'approved' then
      if new.approved_at is null then new.approved_at := now(); end if;
      if new.effective_date is null then new.effective_date := current_date; end if;
    end if;
  end if;
  return new;
end $$;
