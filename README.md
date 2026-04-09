# ⚡ Webcraft AI

Creador de sitios web con inteligencia artificial. El usuario describe su negocio, la IA genera la web completa en segundos, y tras el pago con Stripe se despliega automáticamente en Vercel.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript
- **IA:** Anthropic Claude (claude-opus-4-5)
- **Pagos:** Stripe Checkout
- **Deploy de webs:** Vercel Deploy API
- **Store temporal:** Vercel KV (Redis)

---

## Instalación

```bash
git clone https://github.com/tu-usuario/webcraft-ai.git
cd webcraft-ai
npm install
cp .env.example .env.local
# → Edita .env.local con tus claves reales
npm run dev
```

---

## Variables de entorno

| Variable | Descripción | Dónde obtenerla |
|---|---|---|
| `ANTHROPIC_API_KEY` | Clave API de Anthropic | console.anthropic.com |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe | dashboard.stripe.com/apikeys |
| `STRIPE_WEBHOOK_SECRET` | Secret del webhook de Stripe | Ver sección Webhooks |
| `VERCEL_TOKEN` | Token de acceso de Vercel | vercel.com/account/tokens |
| `VERCEL_TEAM_ID` | ID del equipo (opcional) | vercel.com/teams |
| `KV_URL` | URL de Vercel KV | vercel.com → Storage → KV |
| `KV_REST_API_URL` | REST URL de KV | vercel.com → Storage → KV |
| `KV_REST_API_TOKEN` | Token de KV | vercel.com → Storage → KV |
| `NEXT_PUBLIC_URL` | URL pública de tu app | Tu dominio de producción |

---

## Configurar Stripe Webhook

### En desarrollo:
```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Escuchar y reenviar al servidor local
stripe listen --forward-to localhost:3000/api/webhook

# Copiar el webhook secret que muestra y añadirlo a .env.local
```

### En producción:
1. Ir a [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → Webhooks
2. Añadir endpoint: `https://tudominio.com/api/webhook`
3. Seleccionar evento: `checkout.session.completed`
4. Copiar el **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## Configurar Vercel KV

1. Ir a [vercel.com/dashboard](https://vercel.com/dashboard) → Storage → Create Database → KV
2. Conectar el KV a tu proyecto
3. Las variables `KV_*` se añaden automáticamente a tu proyecto en Vercel
4. Para desarrollo local: `vercel env pull .env.local`

---

## Flujo completo

```
1. Usuario elige plantilla (6 opciones)
2. Usuario rellena datos del negocio
3. POST /api/generate → Claude genera el HTML → guardado en KV
4. Preview en iframe
5. POST /api/checkout → Stripe crea sesión → redirige al checkout
6. Usuario paga 29€
7. Stripe llama a POST /api/webhook
8. Webhook recupera HTML de KV → deployToVercel()
9. Vercel crea proyecto estático en ~15s
10. Usuario ve pantalla de éxito con su URL
```

---

## Estructura del proyecto

```
webcraft-ai/
├── app/
│   ├── layout.tsx              ← Root layout
│   ├── page.tsx                ← Wizard completo (frontend)
│   ├── success/page.tsx        ← Página post-pago
│   └── api/
│       ├── generate/route.ts   ← Genera HTML con Claude
│       ├── checkout/route.ts   ← Crea sesión Stripe
│       └── webhook/route.ts    ← Recibe pago → deploy Vercel
├── lib/
│   ├── generate-site.ts        ← Prompt + llamada a Anthropic
│   ├── deploy-vercel.ts        ← Vercel Deploy API
│   └── kv.ts                   ← Store temporal (Vercel KV)
├── .env.example                ← Plantilla de variables
├── package.json
└── tsconfig.json
```

---

## Próximos pasos recomendados

### Base de datos
Añade Supabase o PlanetScale para guardar cada web desplegada:
```typescript
// Ejemplo con Supabase
await supabase.from('sites').insert({
  stripe_session_id: session.id,
  business_name: businessName,
  url: result.url,
  deploy_id: result.deployId,
  paid_at: new Date().toISOString(),
  customer_email: session.customer_details?.email,
});
```

### Emails transaccionales
Integra [Resend](https://resend.com) para notificar al cliente:
```typescript
await resend.emails.send({
  from: 'Webcraft AI <hola@webcraft.app>',
  to: customerEmail,
  subject: '¡Tu web está online! 🚀',
  html: `<p>Tu web <strong>${businessName}</strong> está en: <a href="${siteUrl}">${siteUrl}</a></p>`,
});
```

### Panel de administración
Ruta `/admin` con lista de webs desplegadas, estados, URLs y pagos.

### Dominio personalizado
Usa la Vercel Domains API (ya implementada en `deploy-vercel.ts` como `addCustomDomain`) para asignar dominios propios tras el pago de un plan premium.

### Plan de suscripción
Añade un plan mensual con Stripe Subscriptions para hosting en dominio propio + actualizaciones de contenido.

---

## Deploy en producción

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Recuerda añadir todas las variables de entorno en el dashboard de Vercel antes del deploy.

---

## Licencia

MIT
