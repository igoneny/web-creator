import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/sites
 *
 * Devuelve todos los sitios desplegados.
 * Sustituye el mock por tu consulta real a Supabase / PlanetScale / otra DB.
 *
 * PROTECCIÓN: En producción añade autenticación antes del handler.
 * Ejemplo con NextAuth:
 *   const session = await getServerSession(authOptions);
 *   if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 */
export async function GET(req: NextRequest) {
  // ── Protección básica por API key en cabecera ──────────────────────────
  // En producción usa NextAuth, Clerk o similar en lugar de esto.
  const adminKey = req.headers.get("x-admin-key");
  if (
    process.env.NODE_ENV === "production" &&
    adminKey !== process.env.ADMIN_SECRET_KEY
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Con Supabase (descomenta cuando configures la DB) ──────────────────
  /*
  import { createClient } from '@supabase/supabase-js';
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sites: data });
  */

  // ── Mock data para desarrollo ──────────────────────────────────────────
  const sites = [
    {
      id: "1",
      businessName: "Café El Rincón",
      sector: "Restaurante",
      email: "hola@elrincon.es",
      template: "Velvet Warm",
      status: "live",
      url: "cafe-el-rincon-x3k.vercel.app",
      deployId: "dpl_A1B2C3",
      buildMs: 14200,
      amount: 29,
      color: "#d97706",
      stripeSessionId: "cs_live_a1b2c3",
      createdAt: "2026-04-08T10:30:00Z",
    },
    {
      id: "2",
      businessName: "Clínica Salud Vital",
      sector: "Salud",
      email: "info@saludvital.es",
      template: "Fresh Clinic",
      status: "live",
      url: "clinica-salud-vital-m9p.vercel.app",
      deployId: "dpl_D4E5F6",
      buildMs: 11800,
      amount: 29,
      color: "#059669",
      stripeSessionId: "cs_live_d4e5f6",
      createdAt: "2026-04-07T14:15:00Z",
    },
    {
      id: "3",
      businessName: "Fontanería Pérez",
      sector: "Servicios",
      email: "fontaneria@perez.es",
      template: "Corporate Blue",
      status: "pending",
      url: null,
      deployId: null,
      buildMs: null,
      amount: 29,
      color: "#2563eb",
      stripeSessionId: "cs_live_g7h8i9",
      createdAt: "2026-04-06T09:00:00Z",
    },
    {
      id: "4",
      businessName: "Inmobiliaria Costa Sol",
      sector: "Inmobiliaria",
      email: "ventas@costasol.es",
      template: "Cosmos Dark",
      status: "error",
      url: null,
      deployId: null,
      buildMs: null,
      amount: 29,
      color: "#7c6bfa",
      stripeSessionId: "cs_live_j1k2l3",
      createdAt: "2026-04-04T16:45:00Z",
    },
  ];

  return NextResponse.json({ sites });
}
