import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { deployToVercel } from "@/lib/deploy-vercel";
import { getHTML, deleteHTML } from "@/lib/kv";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const maxDuration = 120; // Deploy puede tardar hasta ~60s en Vercel

/**
 * IMPORTANTE: Next.js App Router no expone el body raw por defecto.
 * Necesitamos leerlo como texto para que Stripe pueda verificar la firma.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  // ── 1. Verificar firma del webhook ────────────────────────────────────────
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[webhook] Firma inválida:", err);
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  // ── 2. Solo procesamos pagos completados ─────────────────────────────────
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.CheckoutSession;

  // Verificar que el pago fue aprobado (no solo la sesión completada)
  if (session.payment_status !== "paid") {
    console.warn("[webhook] Sesión completada pero pago no aprobado:", session.id);
    return NextResponse.json({ received: true });
  }

  const { businessName, htmlKey } = session.metadata || {};

  if (!businessName || !htmlKey) {
    console.error("[webhook] Metadata incompleta:", session.metadata);
    return NextResponse.json({ error: "Metadata incompleta" }, { status: 400 });
  }

  // ── 3. Recuperar HTML del store temporal ─────────────────────────────────
  const html = await getHTML(htmlKey);

  if (!html) {
    console.error("[webhook] HTML no encontrado en KV para key:", htmlKey);
    // TODO: Notificar al cliente que hubo un problema y procesar manualmente
    return NextResponse.json({ error: "HTML not found" }, { status: 404 });
  }

  // ── 4. Deploy en Vercel ───────────────────────────────────────────────────
  try {
    console.log(`[webhook] Iniciando deploy para: ${businessName}`);
    const result = await deployToVercel(businessName, html);

    console.log(`[webhook] ✅ Deploy exitoso:`, result.url);

    // TODO: Guardar en base de datos
    // await db.sites.create({
    //   stripeSessionId: session.id,
    //   businessName,
    //   url: result.url,
    //   deployId: result.deployId,
    //   projectName: result.projectName,
    //   buildDurationMs: result.buildDurationMs,
    //   paidAt: new Date(),
    //   customerEmail: session.customer_details?.email,
    // });

    // TODO: Enviar email al cliente con la URL
    // await sendDeployEmail({
    //   to: session.customer_details?.email,
    //   businessName,
    //   siteUrl: result.url,
    // });

    // Limpiar KV tras deploy exitoso
    await deleteHTML(htmlKey);

    return NextResponse.json({
      received: true,
      deployed: true,
      url: result.url,
    });
  } catch (deployError) {
    console.error("[webhook] ❌ Deploy fallido:", deployError);

    // TODO: Notificar al equipo (Slack, email, etc.)
    // TODO: Guardar el error para reintento manual

    // Devolvemos 200 para que Stripe no reintente el webhook
    // (el error es nuestro, no de Stripe)
    return NextResponse.json({
      received: true,
      deployed: false,
      error: "Deploy failed — se procesará manualmente",
    });
  }
}
