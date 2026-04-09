"use client";

import { useEffect, useState, useCallback } from "react";

// ── Tipos ──────────────────────────────────────────────────────────────────

export type SiteStatus = "live" | "pending" | "error";

export interface Site {
  id: string;
  businessName: string;
  sector: string;
  email: string;
  template: string;
  status: SiteStatus;
  url: string | null;
  deployId: string | null;
  buildMs: number | null;
  amount: number;
  color: string;
  stripeSessionId: string;
  createdAt: string;
}

// ── Constantes ─────────────────────────────────────────────────────────────

const TEMPLATE_COLORS: Record<string, string> = {
  "Cosmos Dark": "#7c6bfa",
  "Velvet Warm": "#d97706",
  "Fresh Clinic": "#059669",
  "Portfolio Noir": "#374151",
  "Corporate Blue": "#2563eb",
  "Pastel Studio": "#be185d",
};

const PER_PAGE = 10;

// ── Componente principal ───────────────────────────────────────────────────

export default function AdminPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [filtered, setFiltered] = useState<Site[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [templateFilter, setTemplateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch desde tu API/Supabase ──────────────────────────────────────────

  const fetchSites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sites");
      const data = await res.json();
      setSites(data.sites || []);
    } catch (e) {
      console.error("Error fetching sites:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
    const interval = setInterval(fetchSites, 30_000); // polling cada 30s
    return () => clearInterval(interval);
  }, [fetchSites]);

  // ── Filtros ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      sites.filter((s) => {
        const matchQ =
          !q ||
          s.businessName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.url || "").toLowerCase().includes(q);
        const matchStatus = !statusFilter || s.status === statusFilter;
        const matchTemplate = !templateFilter || s.template === templateFilter;
        return matchQ && matchStatus && matchTemplate;
      })
    );
    setPage(1);
  }, [sites, search, statusFilter, templateFilter]);

  // ── Acciones ─────────────────────────────────────────────────────────────

  async function retryDeploy(site: Site) {
    await fetch(`/api/admin/sites/${site.id}/redeploy`, { method: "POST" });
    fetchSites();
  }

  async function deleteSite(site: Site) {
    if (!confirm(`¿Eliminar "${site.businessName}"?`)) return;
    await fetch(`/api/admin/sites/${site.id}`, { method: "DELETE" });
    setSites((prev) => prev.filter((s) => s.id !== site.id));
  }

  function exportCSV() {
    const rows = [
      ["ID", "Negocio", "Email", "Plantilla", "Estado", "URL", "Pago", "Fecha"],
      ...sites.map((s) => [
        s.id,
        s.businessName,
        s.email,
        s.template,
        s.status,
        s.url || "—",
        `€${s.amount}`,
        s.createdAt,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "webcraft-sites.csv";
    a.click();
  }

  // ── Métricas ─────────────────────────────────────────────────────────────

  const liveCount = sites.filter((s) => s.status === "live").length;
  const errorCount = sites.filter((s) => s.status === "error").length;
  const revenue = sites
    .filter((s) => s.status !== "error")
    .reduce((a, s) => a + s.amount, 0);
  const avgBuild =
    sites.filter((s) => s.buildMs).reduce((a, s) => a + (s.buildMs || 0), 0) /
      (sites.filter((s) => s.buildMs).length || 1);

  // ── Paginación ────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageSites = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{adminStyles}</style>

      <div className="admin-topbar">
        <div className="admin-logo">
          <div className="logo-dot" />
          Webcraft AI — Admin
        </div>
        <div className="admin-actions">
          <button className="btn-outline" onClick={exportCSV}>
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="admin-layout">
        {/* SIDEBAR */}
        <aside className="admin-sidebar">
          {[
            { label: "Dashboard", icon: "⊞" },
            { label: "Webs", icon: "◻" },
            { label: "Ingresos", icon: "↗" },
            { label: "Clientes", icon: "○" },
            { label: "Configuración", icon: "⚙" },
          ].map((item) => (
            <div key={item.label} className="sidebar-item">
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </aside>

        {/* MAIN */}
        <main className="admin-content">
          <div className="page-title">Dashboard</div>

          {/* MÉTRICAS */}
          <div className="metrics-grid">
            <MetricCard
              label="Ingresos totales"
              value={`€${revenue.toLocaleString()}`}
              delta="Este mes"
            />
            <MetricCard
              label="Webs desplegadas"
              value={liveCount}
              delta={`${sites.length} total`}
            />
            <MetricCard
              label="Tasa de éxito"
              value={`${Math.round((liveCount / (sites.length || 1)) * 100)}%`}
              delta={`${errorCount} errores`}
            />
            <MetricCard
              label="Build promedio"
              value={`${(avgBuild / 1000).toFixed(1)}s`}
              delta="Vercel Edge"
            />
          </div>

          {/* TABLA */}
          <div className="table-card">
            <div className="table-toolbar">
              <input
                type="text"
                placeholder="Buscar negocio, email o URL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="live">Live</option>
                <option value="pending">Pendiente</option>
                <option value="error">Error</option>
              </select>
              <select
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.target.value)}
              >
                <option value="">Todas las plantillas</option>
                {Object.keys(TEMPLATE_COLORS).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <span className="result-count">
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loading ? (
              <div className="loading-state">Cargando sitios...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Negocio</th>
                      <th>Estado</th>
                      <th>URL</th>
                      <th>Plantilla</th>
                      <th>Pago</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageSites.map((site) => (
                      <SiteRow
                        key={site.id}
                        site={site}
                        onView={() => setSelected(site)}
                        onRetry={() => retryDeploy(site)}
                        onDelete={() => deleteSite(site)}
                      />
                    ))}
                    {pageSites.length === 0 && (
                      <tr>
                        <td colSpan={7} className="empty-state">
                          Sin resultados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pagination">
              <span>
                {filtered.length > 0
                  ? `Mostrando ${(page - 1) * PER_PAGE + 1}–${Math.min(
                      page * PER_PAGE,
                      filtered.length
                    )} de ${filtered.length}`
                  : ""}
              </span>
              <div className="page-btns">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`page-btn ${page === i + 1 ? "active" : ""}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL DETALLE */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{selected.businessName}</span>
              <button onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              {[
                ["Sector", selected.sector],
                ["Email", selected.email],
                ["Plantilla", selected.template],
                ["Estado", selected.status],
                ["URL", selected.url || "—"],
                ["Deploy ID", selected.deployId || "—"],
                [
                  "Build time",
                  selected.buildMs
                    ? `${(selected.buildMs / 1000).toFixed(1)}s`
                    : "—",
                ],
                ["Pago", `€${selected.amount} · Stripe`],
                ["Sesión Stripe", selected.stripeSessionId],
                ["Fecha", selected.createdAt],
              ].map(([k, v]) => (
                <div key={k} className="detail-row">
                  <span className="detail-key">{k}</span>
                  <span className="detail-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string | number;
  delta: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-delta">{delta}</div>
    </div>
  );
}

function SiteRow({
  site,
  onView,
  onRetry,
  onDelete,
}: {
  site: Site;
  onView: () => void;
  onRetry: () => void;
  onDelete: () => void;
}) {
  const initials = site.businessName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const color = TEMPLATE_COLORS[site.template] || "#7c6bfa";

  return (
    <tr>
      <td>
        <div className="biz-cell">
          <div
            className="biz-avatar"
            style={{ background: color + "22", color }}
          >
            {initials}
          </div>
          <div>
            <div className="biz-name">{site.businessName}</div>
            <div className="biz-email">{site.email}</div>
          </div>
        </div>
      </td>
      <td>
        <span className={`badge badge-${site.status}`}>
          <span className="badge-dot" />
          {site.status === "live"
            ? "Live"
            : site.status === "pending"
            ? "Pendiente"
            : "Error"}
        </span>
      </td>
      <td>
        {site.url ? (
          <a
            href={`https://${site.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="url-link"
            title={site.url}
          >
            {site.url}
          </a>
        ) : (
          <span style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>
            —
          </span>
        )}
      </td>
      <td className="template-cell">{site.template}</td>
      <td className="amount-cell">€{site.amount}</td>
      <td className="date-cell">
        {new Date(site.createdAt).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td>
        <div className="row-actions">
          <button className="btn-sm" onClick={onView}>
            Ver
          </button>
          {site.status === "error" && (
            <button className="btn-sm" onClick={onRetry}>
              Reintentar
            </button>
          )}
          <button className="btn-sm danger" onClick={onDelete}>
            Borrar
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── CSS ────────────────────────────────────────────────────────────────────

const adminStyles = `
  .admin-topbar{display:flex;align-items:center;justify-content:space-between;padding:0 1.5rem;height:52px;background:var(--color-background-primary);border-bottom:0.5px solid var(--color-border-tertiary);position:sticky;top:0;z-index:20}
  .admin-logo{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:500}
  .logo-dot{width:8px;height:8px;border-radius:50%;background:#7c6bfa;flex-shrink:0}
  .admin-layout{display:grid;grid-template-columns:200px 1fr;min-height:calc(100vh - 52px)}
  .admin-sidebar{background:var(--color-background-primary);border-right:0.5px solid var(--color-border-tertiary);padding:1rem 0}
  .sidebar-item{display:flex;align-items:center;gap:10px;padding:0.55rem 1.25rem;font-size:13px;color:var(--color-text-secondary);cursor:pointer}
  .sidebar-item:hover{background:var(--color-background-secondary);color:var(--color-text-primary)}
  .sidebar-icon{font-size:14px;opacity:0.6}
  .admin-content{padding:1.5rem;background:var(--color-background-tertiary)}
  .page-title{font-size:18px;font-weight:500;margin-bottom:1.25rem}
  .metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:1.25rem}
  .metric-card{background:var(--color-background-secondary);border-radius:var(--border-radius-md);padding:1rem}
  .metric-label{font-size:12px;color:var(--color-text-secondary);margin-bottom:6px}
  .metric-value{font-size:22px;font-weight:500}
  .metric-delta{font-size:11px;color:var(--color-text-tertiary);margin-top:4px}
  .table-card{background:var(--color-background-primary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);overflow:hidden}
  .table-toolbar{display:flex;align-items:center;gap:8px;padding:0.875rem 1.25rem;border-bottom:0.5px solid var(--color-border-tertiary);flex-wrap:wrap}
  .table-toolbar input{flex:1;min-width:180px;font-size:13px;padding:0.4rem 0.75rem;border-radius:var(--border-radius-md);border:0.5px solid var(--color-border-secondary);background:var(--color-background-secondary);color:var(--color-text-primary);outline:none}
  .table-toolbar input:focus{border-color:#7c6bfa}
  .table-toolbar select{font-size:12px;padding:0.38rem 0.6rem;border-radius:var(--border-radius-md);border:0.5px solid var(--color-border-secondary);background:var(--color-background-secondary);color:var(--color-text-primary);outline:none;cursor:pointer}
  .result-count{font-size:12px;color:var(--color-text-secondary);margin-left:auto}
  table{width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed}
  th{text-align:left;font-size:11px;font-weight:500;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.06em;padding:0.6rem 1rem;border-bottom:0.5px solid var(--color-border-tertiary);background:var(--color-background-secondary)}
  td{padding:0.75rem 1rem;border-bottom:0.5px solid var(--color-border-tertiary);vertical-align:middle}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:var(--color-background-secondary)}
  .biz-cell{display:flex;align-items:center;gap:10px}
  .biz-avatar{width:30px;height:30px;border-radius:var(--border-radius-md);display:grid;place-items:center;font-size:11px;font-weight:500;flex-shrink:0}
  .biz-name{font-weight:500;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .biz-email{font-size:11px;color:var(--color-text-secondary)}
  .badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:500;padding:2px 8px;border-radius:20px}
  .badge-live{background:var(--color-background-success);color:var(--color-text-success)}
  .badge-pending{background:var(--color-background-warning);color:var(--color-text-warning)}
  .badge-error{background:var(--color-background-danger);color:var(--color-text-danger)}
  .badge-dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0}
  .url-link{color:var(--color-text-info);font-family:var(--font-mono);font-size:11px;text-decoration:none;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px}
  .url-link:hover{text-decoration:underline}
  .template-cell{font-size:12px;color:var(--color-text-secondary)}
  .amount-cell{font-family:var(--font-mono);font-size:13px}
  .date-cell{font-size:12px;color:var(--color-text-secondary)}
  .row-actions{display:flex;gap:6px}
  .btn-sm{background:none;border:0.5px solid var(--color-border-secondary);border-radius:var(--border-radius-md);padding:3px 8px;font-size:11px;color:var(--color-text-secondary);cursor:pointer}
  .btn-sm:hover{background:var(--color-background-secondary);color:var(--color-text-primary)}
  .btn-sm.danger:hover{background:var(--color-background-danger);color:var(--color-text-danger);border-color:var(--color-border-danger)}
  .btn-outline{background:none;border:0.5px solid var(--color-border-secondary);border-radius:var(--border-radius-md);padding:6px 12px;font-size:13px;color:var(--color-text-secondary);cursor:pointer}
  .btn-outline:hover{background:var(--color-background-secondary);color:var(--color-text-primary)}
  .pagination{display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1.25rem;border-top:0.5px solid var(--color-border-tertiary);font-size:12px;color:var(--color-text-secondary)}
  .page-btns{display:flex;gap:4px}
  .page-btn{border:0.5px solid var(--color-border-secondary);background:none;border-radius:var(--border-radius-md);padding:3px 9px;font-size:12px;cursor:pointer;color:var(--color-text-secondary)}
  .page-btn.active,.page-btn:hover{background:var(--color-background-secondary);color:var(--color-text-primary)}
  .loading-state,.empty-state{padding:2rem;text-align:center;color:var(--color-text-secondary);font-size:13px}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:50;display:flex;align-items:flex-start;justify-content:center;padding-top:80px}
  .modal{background:var(--color-background-primary);border:0.5px solid var(--color-border-secondary);border-radius:var(--border-radius-lg);width:400px;max-width:95vw;overflow:hidden}
  .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:0.5px solid var(--color-border-tertiary);font-size:15px;font-weight:500}
  .modal-header button{background:none;border:none;font-size:20px;cursor:pointer;color:var(--color-text-secondary);line-height:1}
  .modal-body{padding:1.25rem}
  .detail-row{display:flex;justify-content:space-between;font-size:13px;padding:0.5rem 0;border-bottom:0.5px solid var(--color-border-tertiary)}
  .detail-row:last-child{border:none}
  .detail-key{color:var(--color-text-secondary)}
  .detail-val{font-family:var(--font-mono);font-size:12px;font-weight:500;text-align:right;max-width:220px;overflow:hidden;text-overflow:ellipsis}
  @media(max-width:700px){
    .admin-layout{grid-template-columns:1fr}
    .admin-sidebar{display:none}
    .metrics-grid{grid-template-columns:repeat(2,1fr)}
  }
`;
