import { redirect } from "next/navigation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface Props {
  searchParams: { session_id?: string };
}

export default async function SuccessPage({ searchParams }: Props) {
  const { session_id } = searchParams;

  if (!session_id) {
    redirect("/");
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch {
    redirect("/");
  }

  const businessName = session.metadata?.businessName || "Tu negocio";
  const customerEmail = session.customer_details?.email || "";

  // TODO: Consultar la URL final desde tu DB con session.id
  // const site = await db.sites.findBy({ stripeSessionId: session_id });
  // const siteUrl = site?.url;

  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>¡Web desplegada! — Webcraft AI</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'DM Sans', sans-serif;
            background: #0a0a0f;
            color: #f0eeff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .card {
            background: #111118;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 3rem 2.5rem;
            text-align: center;
            max-width: 500px;
            width: 100%;
          }
          .icon { font-size: 3.5rem; margin-bottom: 1.5rem; }
          h1 {
            font-family: 'Syne', sans-serif;
            font-size: 2.2rem;
            font-weight: 800;
            margin-bottom: 0.75rem;
            letter-spacing: -0.03em;
          }
          p { color: #8b87a8; line-height: 1.6; margin-bottom: 1rem; }
          .btn {
            display: inline-block;
            padding: 0.85rem 2rem;
            background: linear-gradient(135deg, #7c6bfa, #9d8bf5);
            color: white;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 500;
            margin-top: 1.5rem;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 0.6rem 0;
            border-bottom: 1px solid rgba(255,255,255,0.07);
            font-size: 0.9rem;
          }
          .info-row:last-child { border: none; }
          .info-key { color: #8b87a8; }
          .info-val { font-weight: 500; font-family: monospace; font-size: 0.82rem; color: #a78bfa; }
          .status-box {
            background: #1a1a24;
            border-radius: 12px;
            padding: 1.25rem;
            margin: 1.5rem 0;
            text-align: left;
          }
        `}</style>
      </head>
      <body>
        <div className="card">
          <div className="icon">🚀</div>
          <h1>¡Web desplegada!</h1>
          <p>
            El pago de <strong style={{ color: "#f0eeff" }}>29€</strong> fue
            aprobado y tu web para{" "}
            <strong style={{ color: "#f0eeff" }}>{businessName}</strong> está
            online ahora mismo.
          </p>

          {customerEmail && (
            <p style={{ fontSize: "0.88rem" }}>
              Te hemos enviado los detalles a{" "}
              <span style={{ color: "#a78bfa" }}>{customerEmail}</span>
            </p>
          )}

          <div className="status-box">
            <div className="info-row">
              <span className="info-key">Estado</span>
              <span style={{ color: "#34d399", fontWeight: 600 }}>● Live</span>
            </div>
            <div className="info-row">
              <span className="info-key">Negocio</span>
              <span className="info-val">{businessName}</span>
            </div>
            <div className="info-row">
              <span className="info-key">Plataforma</span>
              <span className="info-val">Vercel Edge Network</span>
            </div>
            <div className="info-row">
              <span className="info-key">SSL</span>
              <span style={{ color: "#34d399" }}>✓ Activo</span>
            </div>
          </div>

          <p style={{ fontSize: "0.85rem", color: "#5c5978" }}>
            Tu URL estará disponible en unos segundos mientras completamos el
            deploy. Si no la ves en 2 minutos, contáctanos.
          </p>

          <a href="/" className="btn">
            Crear otra web
          </a>
        </div>
      </body>
    </html>
  );
}
