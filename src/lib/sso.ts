export const DEFAULT_API_BASE = "http://test.psn.n7s.co";
export type SsoSession = { login: string; namespace: string };
export type DeviceAuthorization = {
  flow_id: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval?: number;
};
type PollResponse = {
  status?: string; message?: string; interval?: number;
  LOGIN?: string; NAMESPACE?: string;
};

export function resolveRouting(location: Pick<Location, "hostname">, configured = DEFAULT_API_BASE) {
  const base = new URL(configured);
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password) {
    throw new Error("Configurazione APIHOST non valida");
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  const suffix = `.${base.hostname}`;
  const candidate = location.hostname.endsWith(suffix) ? location.hostname.slice(0, -suffix.length) : "";
  return {
    apiBase: local ? "" : base.origin,
    namespace: candidate && !candidate.includes(".") ? candidate : null,
  };
}

export function getAdminApiBase() {
  return resolveRouting(window.location, import.meta.env?.VITE_ADMIN_API_BASE || DEFAULT_API_BASE).apiBase;
}
export function getRequestedWorkspaceNamespace() {
  return resolveRouting(window.location, import.meta.env?.VITE_ADMIN_API_BASE || DEFAULT_API_BASE).namespace;
}

export function getProviderLogoutUrl(
  issuer = import.meta.env?.VITE_OIDC_ISSUER_URL || "https://keycloak-cust-01-faas-std.apps.clu02.paas-psn.priv/realms/openserverless-psn",
  clientId = import.meta.env?.VITE_OIDC_CLIENT_ID || "openserverless-admin-api",
) {
  const url = new URL(verificationUrl(issuer));
  if (url.search || url.hash || !clientId.trim()) throw new Error("Configurazione logout Keycloak non valida");
  url.pathname = url.pathname.replace(/\/+$/, "") + "/protocol/openid-connect/logout";
  url.searchParams.set("client_id", clientId);
  // No id_token_hint is retained: Keycloak asks the user to confirm logout.
  // Omit post_logout_redirect_uri, which would require an allowed client redirect.
  return url.href;
}

function verificationUrl(value: unknown) {
  if (typeof value !== "string") throw new Error("Keycloak non ha restituito un URL di verifica");
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("URL di verifica Keycloak non valido");
  }
  return url.href;
}

export async function startDeviceAuthorization(signal?: AbortSignal): Promise<DeviceAuthorization> {
  const namespace = getRequestedWorkspaceNamespace();
  const response = await fetchJson(`${getAdminApiBase()}/system/api/v1/auth/oidc/device/start`, {
    method: "POST", body: JSON.stringify(namespace ? { namespace } : {}), signal,
  });
  const payload = response.payload;
  if (!response.ok) throw new Error(payload.message || `Avvio SSO fallito (${response.status})`);
  if (typeof payload.flow_id !== "string" || !payload.flow_id || typeof payload.user_code !== "string" ||
      !payload.user_code || !Number.isFinite(payload.expires_in) || payload.expires_in <= 0) {
    throw new Error("Risposta di avvio SSO incompleta");
  }
  return {
    flow_id: payload.flow_id, user_code: payload.user_code,
    verification_uri: verificationUrl(payload.verification_uri),
    verification_uri_complete: payload.verification_uri_complete ? verificationUrl(payload.verification_uri_complete) : undefined,
    expires_in: payload.expires_in,
    interval: Number.isFinite(payload.interval) && payload.interval > 0 ? payload.interval : 5,
  };
}

export async function pollForSession(device: DeviceAuthorization, signal?: AbortSignal): Promise<SsoSession> {
  const expiresAt = Date.now() + device.expires_in * 1000;
  let intervalMs = Math.max(device.interval || 5, 1) * 1000;
  while (Date.now() < expiresAt) {
    await sleep(Math.min(intervalMs, expiresAt - Date.now()), signal);
    if (Date.now() >= expiresAt) break;
    const response = await fetchJson(`${getAdminApiBase()}/system/api/v1/auth/oidc/device/poll`, {
      method: "POST", body: JSON.stringify({ flow_id: device.flow_id }), signal,
    });
    if (signal?.aborted) throw signal.reason;
    const payload = response.payload as PollResponse;
    if (response.status === 202 && payload.status === "pending") {
      if (payload.message === "slow_down") intervalMs += 5000;
      if (payload.interval && Number.isFinite(payload.interval)) intervalMs = Math.max(intervalMs, payload.interval * 1000);
      continue;
    }
    if (!response.ok) throw new Error(payload.message || `Accesso SSO rifiutato (${response.status})`);
    const namespace = payload.NAMESPACE;
    if (typeof namespace !== "string" || !namespace || typeof payload.LOGIN !== "string" || !payload.LOGIN) {
      throw new Error("Il backend non ha confermato login e namespace");
    }
    const requested = getRequestedWorkspaceNamespace();
    if (requested && namespace !== requested) throw new Error("Namespace restituito diverso dal workspace richiesto");
    // Discard AUTH, provider tokens and any other credentials returned by the API.
    return { login: payload.LOGIN, namespace };
  }
  throw new Error("Accesso SSO scaduto. Avvia un nuovo tentativo.");
}

async function fetchJson(endpoint: string, init: RequestInit) {
  const controller = new AbortController();
  const cancel = () => controller.abort(init.signal?.reason);
  if (init.signal?.aborted) cancel();
  init.signal?.addEventListener("abort", cancel, { once: true });
  const timeout = setTimeout(() => controller.abort(new DOMException("Timeout richiesta SSO", "TimeoutError")), 20000);
  try {
    const response = await fetch(endpoint, { ...init, headers: { "Content-Type": "application/json" }, signal: controller.signal });
    let payload;
    try { payload = await response.json(); }
    catch { throw new Error(`Il backend non restituisce JSON (${response.status}). Verificare route e APIHOST.`); }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Risposta SSO non valida");
    if (controller.signal.aborted) throw controller.signal.reason;
    return { ok: response.ok, status: response.status, payload };
  } catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason;
    throw new Error(`Errore SSO: ${error instanceof Error ? error.message : "backend non raggiungibile"}`);
  } finally {
    clearTimeout(timeout);
    init.signal?.removeEventListener("abort", cancel);
  }
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) { reject(signal.reason); return; }
    const cancel = () => { clearTimeout(timer); reject(signal?.reason); };
    const timer = setTimeout(() => { signal?.removeEventListener("abort", cancel); resolve(); }, ms);
    signal?.addEventListener("abort", cancel, { once: true });
  });
}
