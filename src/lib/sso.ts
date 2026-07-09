const SESSION_KEY = "trureact.sso.session";

export type SsoSession = {
  login: string;
  namespace: string;
};

export type DeviceAuthorization = {
  flow_id: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval?: number;
};

type PollResponse = {
  status?: string;
  message?: string;
  LOGIN?: string;
  NAMESPACE?: string;
  USER?: string;
  USERNAME?: string;
};

export function loadSession(): SsoSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as SsoSession;
    const requestedNamespace = getRequestedWorkspaceNamespace();
    if (requestedNamespace && session.namespace !== requestedNamespace) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession(session: SsoSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getAdminApiBase() {
  const configuredBase = import.meta.env.VITE_ADMIN_API_BASE?.trim();
  if (configuredBase) {
    return configuredBase.replace(/\/+$/, "");
  }

  const { protocol, hostname, origin } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://amd.n7s.co";
  }

  const parts = hostname.split(".");
  if (parts.length > 3) {
    return `${protocol}//${parts.slice(1).join(".")}`;
  }

  return origin;
}

export function getRequestedWorkspaceNamespace() {
  const { hostname } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  const parts = hostname.split(".");
  if (parts.length <= 3) {
    return null;
  }

  return parts[0] || null;
}

export async function startDeviceAuthorization() {
  const response = await fetch(`${getAdminApiBase()}/system/api/v1/auth/oidc/device/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || "Unable to start SSO login");
  }

  return payload as DeviceAuthorization;
}

export async function pollForSession(device: DeviceAuthorization, signal?: AbortSignal): Promise<SsoSession> {
  const intervalMs = Math.max(device.interval || 5, 1) * 1000;
  const expiresAt = Date.now() + Math.max(device.expires_in || 600, 30) * 1000;

  while (Date.now() < expiresAt) {
    await sleep(intervalMs, signal);

    const response = await fetch(`${getAdminApiBase()}/system/api/v1/auth/oidc/device/poll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flow_id: device.flow_id }),
      signal,
    });

    const payload = (await response.json()) as PollResponse;
    if (response.status === 202 || payload.status === "pending") {
      continue;
    }

    if (!response.ok) {
      throw new Error(payload.message || `OpenServerless login failed (${response.status})`);
    }

    const namespace = payload.NAMESPACE || payload.LOGIN || payload.USER || payload.USERNAME;
    if (!namespace) {
      throw new Error("OpenServerless did not return a namespace");
    }

    return {
      login: payload.LOGIN || namespace,
      namespace,
    };
  }

  throw new Error("SSO login expired");
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeout);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}
