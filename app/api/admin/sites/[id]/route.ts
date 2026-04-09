import { NextRequest, NextResponse } from "next/server";
import { deployToVercel } from "@/lib/deploy-vercel";
import { getHTML } from "@/lib/kv";

interface Params {
  params: { id: string };
}

// ── DELETE /api/admin/sites/[id] ──────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = params;

  // Con Supabase:
  // const { error } = await supabase.from('sites').delete().eq('id', id);
  // if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Opcionalmente también eliminar el proyecto en Vercel:
  // await fetch(`https://api.vercel.com/v9/projects/${projectName}`, {
  //   method: 'DELETE',
  //   headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` }
  // });

  console.log(`[admin] Deleting site ${id}`);
  return NextResponse.json({ deleted: true });
}
