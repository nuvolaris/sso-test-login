import { useRef, useState } from "react";
import { ShieldCheck, LogIn, ExternalLink, Loader2, RotateCcw, Network, CloudCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type DeviceAuthorization,
  type SsoSession,
  pollForSession,
  startDeviceAuthorization,
} from "@/lib/sso";

type LoginPageProps = {
  onAuthenticated: (session: SsoSession) => void;
};

const LoginPage = ({ onAuthenticated }: LoginPageProps) => {
  const [device, setDevice] = useState<DeviceAuthorization | null>(null);
  const [status, setStatus] = useState<"idle" | "waiting" | "verifying">("idle");
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const popupRef = useRef<Window | null>(null);

  async function beginLogin() {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    setError("");
    setStatus("waiting");

    try {
      const loginWindow = openLoginWindow();
      popupRef.current = loginWindow;

      const device = await startDeviceAuthorization();
      setDevice(device);

      const verificationUrl = device.verification_uri_complete || device.verification_uri;
      if (!sendWindowToLogin(loginWindow, verificationUrl)) {
        setError("Il browser ha bloccato l'apertura automatica. Usa Apri login.");
      }

      const session = await pollForSession(device, abort.signal);
      setStatus("verifying");
      onAuthenticated(session);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setStatus("idle");
      setError(err instanceof Error ? err.message : "SSO login failed");
    }
  }

  function resetLogin() {
    abortRef.current?.abort();
    popupRef.current?.close();
    popupRef.current = null;
    setDevice(null);
    setStatus("idle");
    setError("");
  }

  const verificationUrl = device ? device.verification_uri_complete || device.verification_uri : "";

  return (
    <main className="min-h-screen overflow-hidden bg-[#071528] text-slate-950">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(29,164,216,0.28),transparent_30%),radial-gradient(circle_at_88%_78%,rgba(228,0,43,0.18),transparent_27%)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
        <section className="relative grid w-full gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 border border-cyan-300/40 bg-cyan-300/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
              <ShieldCheck className="h-4 w-4" />
              Leonardo PSN · SSO Test
            </div>

            <div className="max-w-2xl space-y-5">
              <h1 className="text-balance text-5xl font-black leading-[0.95] text-white md:text-7xl">
                Accesso sicuro al cloud applicativo
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-300">
                Portale dimostrativo per validare l'autenticazione federata e l'accesso al namespace
                OpenServerless dedicato al progetto Leonardo – PSN.
              </p>
            </div>

            <div className="grid max-w-xl grid-cols-3 overflow-hidden border border-white/15 bg-white/5 text-center text-white backdrop-blur">
              <div className="border-r border-white/15 p-4">
                <div className="text-2xl font-black text-cyan-300">OIDC</div>
                <div className="text-xs uppercase text-slate-400">Identità</div>
              </div>
              <div className="border-r border-white/15 p-4">
                <div className="text-2xl font-black text-cyan-300">PSN</div>
                <div className="text-xs uppercase text-slate-400">Ambiente</div>
              </div>
              <div className="p-4">
                <div className="text-2xl font-black text-cyan-300">FaaS</div>
                <div className="text-xs uppercase text-slate-400">Piattaforma</div>
              </div>
            </div>
          </div>

          <div className="border border-white/20 bg-white p-6 shadow-[16px_16px_0_rgba(29,164,216,0.3)] md:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-5 border-b border-slate-200 pb-6">
              <div className="flex items-center gap-5">
                <img src="/leonardo-logo.svg" alt="Leonardo" className="h-8 w-auto" />
                <div className="h-8 w-px bg-slate-200" />
                <img src="/nuvolaris-logo.png" alt="Nuvolaris" className="h-8 w-auto" />
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase text-emerald-900">
                SSO attivo
              </span>
            </div>

            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black">Accedi all'ambiente di test</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Il cluster utilizza il provider aziendale per verificare l'identità e associare il namespace corretto.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 border border-slate-200 p-3 text-sm font-semibold text-slate-700">
                  <Network className="h-5 w-5 text-cyan-600" />
                  Device flow protetto
                </div>
                <div className="flex items-center gap-3 border border-slate-200 p-3 text-sm font-semibold text-slate-700">
                  <CloudCog className="h-5 w-5 text-cyan-600" />
                  Namespace dedicato
                </div>
              </div>

              {device && verificationUrl ? (
                <div className="space-y-4 border border-slate-900 bg-slate-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Codice</div>
                  <div className="select-all text-center text-4xl font-black tracking-[0.14em] text-slate-950">
                    {device.user_code}
                  </div>
                  <Button asChild variant="outline" className="w-full border-slate-900">
                    <a href={verificationUrl} target="_blank" rel="noreferrer">
                      Apri login
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ) : null}

              {error ? (
                <div className="border border-red-900 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">{error}</div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={beginLogin}
                  disabled={status === "waiting" || status === "verifying"}
                  className="h-12 flex-1 rounded-none bg-slate-950 text-white hover:bg-slate-800"
                >
                  {status === "waiting" || status === "verifying" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4" />
                  )}
                  {status === "idle" ? "Accedi con SSO aziendale" : "In attesa"}
                </Button>
                {device ? (
                  <Button onClick={resetLogin} variant="outline" className="h-12 rounded-none border-slate-900">
                    <RotateCcw className="h-4 w-4" />
                    Riavvia
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default LoginPage;

function openLoginWindow() {
  const popup = window.open("about:blank", "leonardo_psn_sso", "width=520,height=720");
  if (!popup) return null;

  popup.document.title = "Leonardo PSN · SSO";
  popup.document.body.style.margin = "0";
  popup.document.body.style.fontFamily = "system-ui, sans-serif";
  popup.document.body.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;background:#f8fafc;color:#020617">
      <section style="border:1px solid #020617;background:white;padding:28px;box-shadow:10px 10px 0 #020617;max-width:360px">
        <h1 style="font-size:22px;margin:0 0 10px;font-weight:900">Leonardo PSN · SSO</h1>
        <p style="margin:0;color:#475569;line-height:1.5">Preparazione dell'accesso federato...</p>
      </section>
    </main>
  `;
  return popup;
}

function sendWindowToLogin(popup: Window | null, url: string) {
  if (!popup || popup.closed) return false;

  try {
    popup.opener = null;
    popup.location.assign(url);
    popup.focus();
    return true;
  } catch {
    return false;
  }
}
