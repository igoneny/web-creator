import { NextRequest, NextResponse } from "next/server";
import { deployToVercel } from "@/lib/deploy-vercel";

interface Params {
  params: { id: string };
}

// ── POST /api/admin/sites/[id]/redeploy ───────────────────────────────────

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = params;

  // Con Supabase, recuperar el HTML del site:
  // const { data: site } = await supabase.from('sites').select('*').eq('id', id).single();
  // if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

  // El HTML ya no estará en KV (expiró), así que deberías guardarlo
  // también en tu DB o en un bucket de almacenamiento (Supabase Storage, S3, R2).
  // Ejemplo:
  // const html = await supabase.storage.from('sites').download(`${id}/index.html`);

  // Mock: simular un redeploy exitoso
  console.log(`[admin] Redeploying site ${id}`);

  // Con los datos reales:
  // const result = await deployToVercel(site.businessName, htmlContent);
  // await supabase.from('sites').update({
  //   status: 'live',
  //   url: result.url,
  //   deployId: result.deployId,
  //   buildMs: result.buildDurationMs,
  // }).eq('id', id);

  return NextResponse.json({ redeployed: true, message: "Deploy re-encolado" });
}
