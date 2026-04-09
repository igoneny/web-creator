import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { businessName, htmlKey, templateId, color } = await req.json();

    if (!htmlKey) {
      return NextResponse.json(
        { error: "Falta la referencia al HTML generado" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Web profesional para ${businessName}`,
              description:
                "Deploy automático en Vercel · Dominio temporal · SSL incluido · Código fuente descargable",
            },
            unit_amount: 2900, // 29,00 €
          },
          quantity: 1,
        },
      ],
      mode: "payment",

      // URLs de retorno
      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/?cancelled=1`,

      // Metadata para el webhook
      metadata: {
        businessName: businessName.slice(0, 100), // Stripe limita a 500 chars por campo
        htmlKey,                                   // Clave de Vercel KV
        templateId: String(templateId),
        color,
      },

      // Opciones adicionales recomendadas
      locale: "es",
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // expira en 30 min
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[/api/checkout]", error);
    return NextResponse.json(
      { error: "Error creando la sesión de pago" },
      { status: 500 }
    );
  }
}
