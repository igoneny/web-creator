import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface BusinessData {
  name: string;
  description: string;
  sector: string;
  city: string;
  phone: string;
  email: string;
  color: string;
  template: string;
}

const TEMPLATE_STYLES: Record<string, string> = {
  "Cosmos Dark":
    "Fondo oscuro (#0a0a0f), tipografía moderna sans-serif, acentos en el color de marca, estilo tech/SaaS premium",
  "Velvet Warm":
    "Fondo crema/warm white, tipografía serif elegante, tonos cálidos, estilo hostelería premium",
  "Fresh Clinic":
    "Fondo blanco limpio, verde como acento de salud, layout espacioso, estilo médico/bienestar profesional",
  "Portfolio Noir":
    "Fondo negro puro, grid asimétrico, mucho espacio en blanco, estilo portfolio creativo minimalista",
  "Corporate Blue":
    "Fondo blanco, azul corporativo, layout estructurado, estilo consultoría/finanzas serio y confiable",
  "Pastel Studio":
    "Fondo blanco con toques pastel, tipografía playful, cards redondeadas, estilo moda/lifestyle/belleza",
};

export async function generateSiteHTML(data: BusinessData): Promise<string> {
  const { name, description, sector, city, phone, email, color, template } =
    data;

  const styleGuide =
    TEMPLATE_STYLES[template] ||
    "Diseño moderno, limpio y profesional con el color de marca como acento";

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Genera un sitio web completo en HTML de una sola página para el negocio "${name}".

## Datos del negocio
- **Nombre:** ${name}
- **Descripción:** ${description}
- **Sector:** ${sector || "General"}
- **Ciudad:** ${city || "España"}
- **Teléfono:** ${phone || "No proporcionado"}
- **Email:** ${email || "No proporcionado"}
- **Color principal de marca:** ${color}
- **Estilo de plantilla:** ${template}
- **Guía de estilo:** ${styleGuide}

## Instrucciones estrictas

### Estructura
Incluye TODAS estas secciones en orden:
1. **Nav** fijo con logo y CTA
2. **Hero** con H1 impactante, subtítulo y botón CTA
3. **Servicios/Productos** — 3 o 4 cards con icono emoji, título y descripción
4. **Sobre nosotros** — párrafo que humanice la marca
5. **Testimonios** — 3 clientes ficticios pero creíbles con nombre y rol
6. **Contacto** — datos reales (teléfono, email, ciudad) + CTA final
7. **Footer** — copyright, datos, redes sociales ficticias

### Técnico
- HTML completo auto-contenido (DOCTYPE, head, body)
- Sin dependencias externas EXCEPTO Google Fonts (una sola importación)
- CSS interno en <style> — responsive mobile-first con media queries
- Color ${color} como variable CSS --color-primary y usarlo consistentemente
- Meta tags SEO: title, description, og:title, og:description, viewport
- Formulario de contacto visual (sin backend, solo apariencia)

### Contenido
- Textos REALES y persuasivos basados en la descripción del negocio
- CERO Lorem ipsum ni texto de relleno
- Incluir datos de contacto reales donde se proporcionaron
- Testimonios con nombres españoles creíbles

### Diseño
- Seguir el estilo: ${styleGuide}
- Usar ${color} como color de acento en botones, highlights y elementos clave
- Tipografía de Google Fonts apropiada para el estilo
- Animaciones CSS sutiles en hover y scroll
- Sombras y border-radius modernos

Devuelve ÚNICAMENTE el HTML dentro de \`\`\`html \`\`\` sin ningún texto adicional antes ni después.`,
      },
    ],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Extraer el HTML del bloque de código
  const match = text.match(/```html\n?([\s\S]*?)```/);
  if (match) return match[1].trim();

  // Si Claude devolvió HTML directo sin bloque de código
  if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
    return text.trim();
  }

  throw new Error(
    "Claude no devolvió HTML válido. Respuesta: " + text.slice(0, 200)
  );
}
