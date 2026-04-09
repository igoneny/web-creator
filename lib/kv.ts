import { kv } from "@vercel/kv";
import { nanoid } from "nanoid";

const TTL_SECONDS = 3600; // 1 hora

/**
 * Guarda el HTML generado en KV y devuelve la clave única.
 * La clave expira automáticamente tras 1 hora.
 */
export async function storeHTML(html: string): Promise<string> {
  const key = `site:${nanoid()}`;
  await kv.set(key, html, { ex: TTL_SECONDS });
  return key;
}

/**
 * Recupera el HTML por su clave. Devuelve null si no existe o expiró.
 */
export async function getHTML(key: string): Promise<string | null> {
  return kv.get<string>(key);
}

/**
 * Elimina el HTML tras el deploy (limpieza opcional).
 */
export async function deleteHTML(key: string): Promise<void> {
  await kv.del(key);
}
