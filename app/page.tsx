"use client";

import { useEffect, useRef, useState } from "react";

// ── Tipos ──────────────────────────────────────────────────────────────────

interface BusinessData {
  name: string;
  description: string;
  sector: string;
  city: string;
  phone: string;
  email: string;
  color: string;
  template: string;
}

const TEMPLATES = [
  {
    id: 0,
    name: "Cosmos Dark",
    tag: "Tecnología · SaaS · Startup",
    bgClass: "tmpl-1",
  },
  {
    id: 1,
    name: "Velvet Warm",
    tag: "Restaurante · Hostelería · Catering",
    bgClass: "tmpl-2",
  },
  {
    id: 2,
    name: "Fresh Clinic",
    tag: "Salud · Clínica · Bienestar",
    bgClass: "tmpl-3",
  },
  {
    id: 3,
    name: "Portfolio Noir",
    tag: "Diseñador · Fotógrafo · Creativo",
    bgClass: "tmpl-4",
  },
  {
    id: 4,
    name: "Corporate Blue",
    tag: "Consultoría · Finanzas · Legal",
    bgClass: "tmpl-5",
  },
  {
    id: 5,
    name: "Pastel Studio",
    tag: "Moda · Belleza · Lifestyle",
    bgClass: "tmpl-6",
  },
];

const COLORS = [
  "#7c6bfa",
  "#2563eb",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0891b2",
  "#7c3aed",
  "#be185d",
];

const GEN_STEPS = [
  "Analizando información del negocio",
  "Generando textos con IA",
  "Aplicando plantilla y colores",
  "Optimizando para móvil y SEO",
  "Preparando preview",
];

// ── Componente principal ───────────────────────────────────────────────────

export default function Home() {
  const [screen, setScreen] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(-1);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [bizData, setBizData] = useState<Partial<BusinessData>>({});
  const [generatedHTML, setGeneratedHTML] = useState("");
  const [htmlKey, setHtmlKey] = useState("");
  const [genStep, setGenStep] = useState(0);
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [isPayingLoading, setIsPayingLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Timer
  useEffect(() => {
    if (screen >= 1 && screen <= 4) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [screen]);

  // Cargar preview en iframe
  useEffect(() => {
    if (screen === 3 && generatedHTML && iframeRef.current) {
      const blob = new Blob([generatedHTML], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      iframeRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [screen, generatedHTML]);

  const timerLabel =
    screen === 5
      ? "✓ Web activa"
      : `⏱ ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")} restantes`;

  // ── Generación ─────────────────────────────────────────────────────────────

  async function startGeneration() {
    const name = (bizData.name || "").trim();
    const description = (bizData.description || "").trim();
    if (!name || !description) {
      alert("Por favor, rellena el nombre y la descripción del negocio.");
      return;
    }

    setGenStep(0);
    setScreen(2);

    const data: BusinessData = {
      name,
      description,
      sector: bizData.sector || "General",
      city: bizData.city || "",
      phone: bizData.phone || "",
      email: bizData.email || "",
      color: selectedColor,
      template: TEMPLATES[selectedTemplate]?.name || "Cosmos Dark",
    };

    // Animar pasos mientras esperamos la API
    const stepTimings = [800, 1000, 900, 800];
    for (let i = 0; i < stepTimings.length; i++) {
      await sleep(stepTimings[i]);
      setGenStep(i + 1);
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setGeneratedHTML(json.html);
      setHtmlKey(json.htmlKey);
    } catch (e) {
      alert("Error generando la web: " + (e as Error).message);
      setScreen(1);
      return;
    }

    await sleep(500);
    setGenStep(5);
    await sleep(500);
    setScreen(3);
  }

  // ── Pago ───────────────────────────────────────────────────────────────────

  async function handlePay() {
    setIsPayingLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: bizData.name,
          htmlKey,
          templateId: selectedTemplate,
          color: selectedColor,
        }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url; // Redirigir a Stripe Checkout
    } catch (e) {
      alert("Error procesando el pago: " + (e as Error).message);
      setIsPayingLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const slug = (bizData.name || "mi-negocio")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  return (
    <>
      <style>{globalStyles}</style>

      {/* HEADER */}
      <header className="header">
        <div className="logo">⚡ Webcraft AI</div>
        <div className="progress-bar">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`step-dot ${
                i < Math.min(screen, 4)
                  ? "done"
                  : i === Math.min(screen, 4)
                  ? "active"
                  : ""
              }`}
            />
          ))}
        </div>
        <div className={`timer-badge ${screen === 5 ? "green" : ""}`}>
          {timerLabel}
        </div>
      </header>

      <main className="main">
        {/* ── SCREEN 0: PLANTILLAS ── */}
        {screen === 0 && (
          <div className="screen">
            <h1 className="headline">
              Elige tu <span className="accent-text">plantilla</span>
            </h1>
            <p className="subline">
              6 diseños profesionales listos para personalizar con IA.
            </p>
            <div className="templates-grid">
              {TEMPLATES.map((t) => (
                <div
                  key={t.id}
                  className={`template-card ${selectedTemplate === t.id ? "selected" : ""}`}
                  onClick={() => setSelectedTemplate(t.id)}
                >
                  <div className={`template-preview ${t.bgClass}`}>
                    <TemplateMock id={t.id} />
                  </div>
                  <div className="template-info">
                    <div className="template-name">{t.name}</div>
                    <div className="template-tag">{t.tag}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="btn-row">
              <button
                className="btn btn-primary"
                disabled={selectedTemplate < 0}
                onClick={() => setScreen(1)}
              >
                Siguiente paso →
              </button>
              {selectedTemplate < 0 && (
                <span className="hint">Elige una plantilla para continuar</span>
              )}
            </div>
          </div>
        )}

        {/* ── SCREEN 1: DATOS DEL NEGOCIO ── */}
        {screen === 1 && (
          <div className="screen">
            <h1 className="headline">
              Cuéntanos sobre{" "}
              <span className="accent-text">tu negocio</span>
            </h1>
            <p className="subline">
              La IA usará esta información para generar el contenido de tu web.
            </p>
            <div className="form-grid">
              <div className="form-row">
                <Field label="Nombre del negocio *">
                  <input
                    type="text"
                    placeholder="Ej: Café El Rincón"
                    value={bizData.name || ""}
                    onChange={(e) =>
                      setBizData((d) => ({ ...d, name: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Sector / Tipo">
                  <select
                    value={bizData.sector || ""}
                    onChange={(e) =>
                      setBizData((d) => ({ ...d, sector: e.target.value }))
                    }
                  >
                    <option value="">Seleccionar...</option>
                    {[
                      "Restaurante / Hostelería",
                      "Salud / Clínica",
                      "Tecnología / SaaS",
                      "Comercio / Tienda",
                      "Servicios profesionales",
                      "Creativo / Freelance",
                      "Educación / Formación",
                      "Inmobiliaria",
                      "Otro",
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="¿Qué hace tu negocio? *">
                <textarea
                  placeholder="Describe tus productos o servicios, qué te diferencia, a quién te diriges..."
                  value={bizData.description || ""}
                  onChange={(e) =>
                    setBizData((d) => ({ ...d, description: e.target.value }))
                  }
                />
              </Field>
              <div className="form-row">
                <Field label="Ciudad / Ubicación">
                  <input
                    type="text"
                    placeholder="Ej: Madrid, España"
                    value={bizData.city || ""}
                    onChange={(e) =>
                      setBizData((d) => ({ ...d, city: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Teléfono / WhatsApp">
                  <input
                    type="text"
                    placeholder="+34 612 345 678"
                    value={bizData.phone || ""}
                    onChange={(e) =>
                      setBizData((d) => ({ ...d, phone: e.target.value }))
                    }
                  />
                </Field>
              </div>
              <Field label="Email de contacto">
                <input
                  type="email"
                  placeholder="hola@tunegocio.com"
                  value={bizData.email || ""}
                  onChange={(e) =>
                    setBizData((d) => ({ ...d, email: e.target.value }))
                  }
                />
              </Field>
              <Field label="Color de marca">
                <div className="color-row">
                  {COLORS.map((c) => (
                    <div
                      key={c}
                      className={`color-swatch ${selectedColor === c ? "selected" : ""}`}
                      style={{ background: c }}
                      onClick={() => setSelectedColor(c)}
                    />
                  ))}
                </div>
              </Field>
            </div>
            <div className="btn-row">
              <button className="btn btn-secondary" onClick={() => setScreen(0)}>
                ← Atrás
              </button>
              <button className="btn btn-primary" onClick={startGeneration}>
                ✨ Generar mi web
              </button>
            </div>
          </div>
        )}

        {/* ── SCREEN 2: GENERANDO ── */}
        {screen === 2 && (
          <div className="screen">
            <div className="generating-box">
              <div className="spinner" />
              <h2 className="gen-title">Creando tu web...</h2>
              <p className="gen-sub">
                La IA está escribiendo y diseñando todo el contenido
              </p>
              <div className="gen-steps">
                {GEN_STEPS.map((label, i) => (
                  <div
                    key={i}
                    className={`gen-step ${
                      i < genStep ? "done" : i === genStep ? "active" : ""
                    }`}
                  >
                    <div className="gen-step-icon">
                      {i < genStep ? "✓" : i + 1}
                    </div>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SCREEN 3: PREVIEW ── */}
        {screen === 3 && (
          <div className="screen">
            <h1 className="headline">
              Tu web está <span className="accent-text">lista</span> 🎉
            </h1>
            <p className="subline">
              Así quedaría online. Si te gusta, actívala por solo 29€.
            </p>
            <div className="preview-wrapper">
              <div className="preview-toolbar">
                <div className="browser-dots">
                  <div className="browser-dot" />
                  <div className="browser-dot" />
                  <div className="browser-dot" />
                </div>
                <div className="url-bar">https://{slug}.webcraft.app</div>
                <div className="device-btns">
                  {(["desktop", "mobile"] as const).map((m) => (
                    <button
                      key={m}
                      className={`device-btn ${deviceMode === m ? "active" : ""}`}
                      onClick={() => setDeviceMode(m)}
                    >
                      {m === "desktop" ? "🖥" : "📱"}
                    </button>
                  ))}
                </div>
              </div>
              <div
                className={`preview-frame-container ${
                  deviceMode === "mobile" ? "mobile" : ""
                }`}
              >
                <iframe
                  ref={iframeRef}
                  title="Preview"
                  style={{
                    width: "100%",
                    minHeight: 560,
                    border: "none",
                    display: "block",
                  }}
                />
              </div>
            </div>
            <div className="btn-row">
              <button className="btn btn-secondary" onClick={() => setScreen(1)}>
                ↺ Editar datos
              </button>
              <button className="btn btn-green" onClick={() => setScreen(4)}>
                💳 Activar mi web — 29€
              </button>
            </div>
          </div>
        )}

        {/* ── SCREEN 4: PAGO ── */}
        {screen === 4 && (
          <div className="screen">
            <h1 className="headline">
              Activa tu <span className="accent-text">web</span>
            </h1>
            <p className="subline">
              Un pago único. Tu web online en menos de 60 segundos.
            </p>
            <div className="pricing-card">
              <div className="pricing-badge">✨ Oferta de lanzamiento</div>
              <div className="pricing-price">
                29€ <span>/ pago único</span>
              </div>
              <ul className="pricing-features">
                {[
                  "Deploy automático en Vercel",
                  "Dominio temporal incluido (1 año)",
                  "Web generada con IA, lista para editar",
                  "SSL incluido",
                  "Soporte por email 30 días",
                  "Código fuente descargable",
                ].map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button
                className="btn btn-green"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  fontSize: "1rem",
                  padding: "1rem",
                  marginTop: "0.5rem",
                }}
                onClick={handlePay}
                disabled={isPayingLoading}
              >
                {isPayingLoading
                  ? "⏳ Redirigiendo a Stripe..."
                  : "🔒 Pagar 29€ con Stripe →"}
              </button>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "#5c5978",
                  marginTop: "0.75rem",
                  textAlign: "center",
                }}
              >
                Pago seguro por Stripe · Nunca almacenamos datos de tarjeta
              </p>
            </div>
            <div className="btn-row" style={{ justifyContent: "center" }}>
              <button className="btn btn-secondary" onClick={() => setScreen(3)}>
                ← Volver al preview
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function TemplateMock({ id }: { id: number }) {
  const dark = id === 0 || id === 3;
  const barBg = dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.13)";
  return (
    <div className="tmpl-mock">
      <div style={{ height: 8, background: barBg, borderRadius: 4 }} />
      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, justifyContent: "center" }}>
          <div style={{ height: 5, background: barBg, borderRadius: 3, width: "80%" }} />
          <div style={{ height: 5, background: barBg, borderRadius: 3, width: "55%" }} />
        </div>
        <div style={{ width: 38, height: 30, borderRadius: 6, background: barBg }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginTop: 6 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: 18, borderRadius: 4, background: barBg }} />
        ))}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── CSS ─────────────────────────────────────────────────────────────────────

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0a0a0f;--surface:#111118;--surface2:#1a1a24;
    --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.14);
    --accent:#7c6bfa;--accent2:#a78bfa;
    --green:#34d399;--amber:#fbbf24;
    --text:#f0eeff;--muted:#8b87a8;--muted2:#5c5978;
  }
  body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
  .header{display:flex;align-items:center;justify-content:space-between;padding:1.2rem 2rem;border-bottom:1px solid var(--border);position:sticky;top:0;background:rgba(10,10,15,0.92);backdrop-filter:blur(12px);z-index:100}
  .logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1.3rem;letter-spacing:-0.03em;background:linear-gradient(135deg,#a78bfa,#7c6bfa,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .progress-bar{display:flex;align-items:center;gap:0.5rem}
  .step-dot{width:8px;height:8px;border-radius:50%;background:var(--border2);transition:all 0.3s}
  .step-dot.active{background:var(--accent);width:24px;border-radius:4px}
  .step-dot.done{background:var(--green)}
  .timer-badge{font-size:0.75rem;color:var(--green);background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.2);padding:0.3rem 0.8rem;border-radius:20px;font-weight:500}
  .timer-badge.green{color:var(--green)}
  .main{max-width:860px;margin:0 auto;padding:2.5rem 1.5rem}
  .screen{animation:fadeIn 0.4s ease}
  @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .headline{font-family:'Syne',sans-serif;font-weight:700;font-size:clamp(1.8rem,4vw,2.6rem);line-height:1.15;letter-spacing:-0.03em;margin-bottom:0.6rem}
  .subline{color:var(--muted);font-size:1rem;line-height:1.6;margin-bottom:2.5rem}
  .accent-text{color:var(--accent2)}
  .hint{font-size:0.82rem;color:var(--muted)}
  .templates-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:2rem}
  @media(max-width:600px){.templates-grid{grid-template-columns:repeat(2,1fr)}}
  .template-card{border:1.5px solid var(--border);border-radius:12px;overflow:hidden;cursor:pointer;transition:all 0.25s;position:relative}
  .template-card:hover{border-color:var(--accent);transform:translateY(-3px)}
  .template-card.selected{border-color:var(--accent);box-shadow:0 0 0 3px rgba(124,107,250,0.25)}
  .template-card.selected::after{content:'✓';position:absolute;top:8px;right:8px;width:22px;height:22px;background:var(--accent);border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700;color:white}
  .template-preview{height:110px;position:relative;overflow:hidden}
  .tmpl-1{background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)}
  .tmpl-2{background:linear-gradient(135deg,#fff7ed 0%,#fef3c7 100%)}
  .tmpl-3{background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)}
  .tmpl-4{background:linear-gradient(135deg,#18181b 0%,#27272a 100%)}
  .tmpl-5{background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)}
  .tmpl-6{background:linear-gradient(135deg,#fdf4ff 0%,#fae8ff 100%)}
  .tmpl-mock{position:absolute;inset:0;padding:10px;display:flex;flex-direction:column;gap:4px}
  .template-info{padding:0.75rem;background:var(--surface)}
  .template-name{font-family:'Syne',sans-serif;font-size:0.8rem;font-weight:600;margin-bottom:2px}
  .template-tag{font-size:0.68rem;color:var(--muted)}
  .form-grid{display:grid;gap:1.25rem;margin-bottom:2rem}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
  @media(max-width:600px){.form-row{grid-template-columns:1fr}}
  .field label{display:block;font-size:0.8rem;font-weight:500;color:var(--muted);margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.06em}
  .field input,.field textarea,.field select{width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:10px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:0.95rem;padding:0.75rem 1rem;outline:none;transition:border-color 0.2s;resize:none}
  .field input:focus,.field textarea:focus,.field select:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(124,107,250,0.15)}
  .field textarea{min-height:100px}
  .field select option{background:#1a1a24}
  .color-row{display:flex;gap:0.6rem;flex-wrap:wrap;margin-top:0.4rem}
  .color-swatch{width:30px;height:30px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:all 0.2s}
  .color-swatch.selected{border-color:white;transform:scale(1.2)}
  .btn{display:inline-flex;align-items:center;gap:0.5rem;padding:0.85rem 2rem;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:0.95rem;font-weight:500;cursor:pointer;border:none;transition:all 0.2s}
  .btn-primary{background:linear-gradient(135deg,#7c6bfa,#9d8bf5);color:white;box-shadow:0 4px 20px rgba(124,107,250,0.35)}
  .btn-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 28px rgba(124,107,250,0.45)}
  .btn-secondary{background:var(--surface2);color:var(--muted);border:1px solid var(--border2)}
  .btn-secondary:hover{color:var(--text);border-color:var(--accent)}
  .btn-green{background:linear-gradient(135deg,#059669,#34d399);color:white;box-shadow:0 4px 20px rgba(52,211,153,0.3)}
  .btn-green:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 28px rgba(52,211,153,0.4)}
  .btn:disabled{opacity:0.5;cursor:not-allowed}
  .btn-row{display:flex;gap:1rem;align-items:center;flex-wrap:wrap}
  .generating-box{background:var(--surface);border:1px solid var(--border2);border-radius:16px;padding:3rem 2rem;text-align:center;margin:2rem 0}
  .spinner{width:56px;height:56px;border:3px solid var(--border2);border-top-color:var(--accent);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 1.5rem}
  @keyframes spin{to{transform:rotate(360deg)}}
  .gen-title{font-family:'Syne',sans-serif;font-size:1.5rem;font-weight:700;margin-bottom:0.5rem}
  .gen-sub{color:var(--muted);font-size:0.9rem}
  .gen-steps{display:flex;flex-direction:column;gap:0.75rem;margin-top:1.5rem;max-width:360px;margin:1.5rem auto 0}
  .gen-step{display:flex;align-items:center;gap:0.75rem;font-size:0.9rem;color:var(--muted);text-align:left;transition:all 0.3s}
  .gen-step.done{color:var(--green)}
  .gen-step.active{color:var(--text)}
  .gen-step-icon{width:20px;height:20px;border-radius:50%;background:var(--border2);flex-shrink:0;display:grid;place-items:center;font-size:11px}
  .gen-step.done .gen-step-icon{background:var(--green);color:#0a0a0f}
  .gen-step.active .gen-step-icon{background:var(--accent);color:white;animation:pulse 1s ease infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
  .preview-wrapper{border:1px solid var(--border2);border-radius:16px;overflow:hidden;margin-bottom:2rem;background:var(--surface)}
  .preview-toolbar{display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;background:var(--surface2);border-bottom:1px solid var(--border)}
  .browser-dots{display:flex;gap:5px}
  .browser-dot{width:10px;height:10px;border-radius:50%}
  .browser-dot:nth-child(1){background:#ff5f57}
  .browser-dot:nth-child(2){background:#febc2e}
  .browser-dot:nth-child(3){background:#28c840}
  .url-bar{flex:1;max-width:300px;margin:0 1rem;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:0.3rem 0.75rem;font-size:0.78rem;color:var(--muted);font-family:monospace}
  .device-btns{display:flex;gap:0.5rem}
  .device-btn{background:none;border:1px solid var(--border);color:var(--muted);border-radius:6px;padding:4px 8px;font-size:0.7rem;cursor:pointer;transition:all 0.2s}
  .device-btn.active,.device-btn:hover{border-color:var(--accent);color:var(--accent2)}
  .preview-frame-container{width:100%;background:white;transition:all 0.3s;min-height:560px}
  .preview-frame-container.mobile{max-width:375px;margin:0 auto;border-left:1px solid var(--border);border-right:1px solid var(--border)}
  .pricing-card{background:var(--surface);border:1px solid var(--border2);border-radius:16px;padding:2rem;max-width:480px;margin:0 auto 2rem}
  .pricing-badge{display:inline-flex;align-items:center;gap:0.4rem;background:rgba(124,107,250,0.12);border:1px solid rgba(124,107,250,0.25);color:var(--accent2);font-size:0.78rem;font-weight:500;padding:0.3rem 0.75rem;border-radius:20px;margin-bottom:1.25rem}
  .pricing-price{font-family:'Syne',sans-serif;font-size:3rem;font-weight:800;letter-spacing:-0.04em;margin-bottom:0.25rem}
  .pricing-price span{font-size:1.2rem;font-weight:400;color:var(--muted)}
  .pricing-features{list-style:none;margin:1.5rem 0;display:flex;flex-direction:column;gap:0.6rem}
  .pricing-features li{display:flex;align-items:center;gap:0.6rem;font-size:0.9rem;color:var(--muted)}
  .pricing-features li::before{content:'✓';color:var(--green);font-weight:700;flex-shrink:0}
`;
