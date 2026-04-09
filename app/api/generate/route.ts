import { NextRequest, NextResponse } from "next/server";
import { generateSiteHTML, BusinessData } from "@/lib/generate-site";
import { storeHTML } from "@/lib/kv";

export const maxDuration = 60; // Vercel function timeout (segundos)

export async function POST(req: NextRequest) {
  try {
    const body: BusinessData = await req.json();

    // Validación mínima
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "El nombre del negocio es obligatorio" },
        { status: 400 }
      );
    }
    if (!body.description?.trim()) {
      return NextResponse.json(
        { error: "La descripción del negocio es obligatoria" },
        { status: 400 }
      );
    }

    // Generar HTML con Claude
    const html = await generateSiteHTML(body);

    // Guardar en KV (expira en 1h) y devolver la clave
    const htmlKey = await storeHTML(html);

    return NextResponse.json({ html, htmlKey });
  } catch (error) {
    console.error("[/api/generate]", error);
    return NextResponse.json(
      { error: "Error generando la web. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
