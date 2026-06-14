import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Guarda el logo de la empresa como data URL en tenants.logo_url.
// (Sin almacenamiento externo: simple para V0; logo pequeño.)
export async function POST(req: Request) {
  const { dataUrl } = await req.json().catch(() => ({}));

  if (dataUrl !== null) {
    if (typeof dataUrl !== "string" || !/^data:image\/(png|jpeg|jpg|gif);base64,/.test(dataUrl)) {
      return NextResponse.json({ error: "Imagen no válida (usa PNG, JPG o GIF)." }, { status: 400 });
    }
    if (dataUrl.length > 700_000) {
      return NextResponse.json(
        { error: "El logo es muy grande. Usa una imagen más pequeña (≈ menos de 500 KB)." },
        { status: 400 },
      );
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("tenant_id, role")
    .eq("auth_user_id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Sin perfil." }, { status: 403 });

  const { error } = await supabase
    .from("tenants")
    .update({ logo_url: dataUrl })
    .eq("id", profile.tenant_id);

  if (error) return NextResponse.json({ error: "No se pudo guardar el logo." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
