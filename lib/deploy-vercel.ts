export interface DeployResult {
  url: string;
  deployId: string;
  projectName: string;
  readyState: string;
  buildDurationMs: number;
}

/**
 * Despliega un HTML estático en Vercel como proyecto independiente.
 * Devuelve la URL pública cuando el deploy está listo.
 */
export async function deployToVercel(
  businessName: string,
  html: string
): Promise<DeployResult> {
  const startTime = Date.now();

  // Slug: solo letras, números y guiones, máx 40 chars
  const slug = businessName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // eliminar acentos
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  // Nombre único del proyecto para evitar colisiones
  const projectName = `wc-${slug}-${Date.now().toString(36)}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  };

  const teamParam = process.env.VERCEL_TEAM_ID
    ? `?teamId=${process.env.VERCEL_TEAM_ID}`
    : "";

  // ── 1. Crear el deployment ────────────────────────────────────────────────
  const deployRes = await fetch(
    `https://api.vercel.com/v13/deployments${teamParam}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: projectName,
        files: [
          {
            file: "index.html",
            data: html,
            encoding: "utf-8",
          },
          {
            file: "vercel.json",
            data: JSON.stringify({
              rewrites: [{ source: "/(.*)", destination: "/index.html" }],
              headers: [
                {
                  source: "/(.*)",
                  headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "X-Frame-Options", value: "DENY" },
                    {
                      key: "Cache-Control",
                      value: "public, max-age=86400, stale-while-revalidate",
                    },
                  ],
                },
              ],
            }),
            encoding: "utf-8",
          },
        ],
        projectSettings: {
          framework: null, // sitio estático puro
          buildCommand: null,
          outputDirectory: null,
        },
        target: "production",
      }),
    }
  );

  if (!deployRes.ok) {
    const errText = await deployRes.text();
    throw new Error(`Vercel deploy failed (${deployRes.status}): ${errText}`);
  }

  const deploy = await deployRes.json();

  // ── 2. Polling hasta READY ────────────────────────────────────────────────
  const finalDeploy = await pollDeployReady(deploy.id, headers, teamParam);

  const buildDurationMs = Date.now() - startTime;

  return {
    url: `https://${finalDeploy.url}`,
    deployId: finalDeploy.id,
    projectName,
    readyState: finalDeploy.readyState,
    buildDurationMs,
  };
}

/**
 * Opcional: asignar un dominio personalizado a un proyecto existente.
 */
export async function addCustomDomain(
  projectName: string,
  domain: string
): Promise<{ configured: boolean; url: string }> {
  const headers = {
    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  };

  const teamParam = process.env.VERCEL_TEAM_ID
    ? `?teamId=${process.env.VERCEL_TEAM_ID}`
    : "";

  const res = await fetch(
    `https://api.vercel.com/v10/projects/${projectName}/domains${teamParam}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ name: domain }),
    }
  );

  const data = await res.json();
  return {
    configured: res.ok,
    url: `https://${domain}`,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function pollDeployReady(
  deployId: string,
  headers: Record<string, string>,
  teamParam: string,
  maxAttempts = 30,
  intervalMs = 3000
) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(intervalMs);

    const res = await fetch(
      `https://api.vercel.com/v13/deployments/${deployId}${teamParam}`,
      { headers }
    );

    if (!res.ok) continue;

    const data = await res.json();

    if (data.readyState === "READY") return data;
    if (data.readyState === "ERROR" || data.readyState === "CANCELED") {
      throw new Error(`Deploy ${data.readyState}: ${JSON.stringify(data.errorMessage || "")}`);
    }
    // Estados intermedios: QUEUED, INITIALIZING, BUILDING — seguir esperando
  }

  throw new Error(`Deploy timeout después de ${maxAttempts * intervalMs / 1000}s`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
