import { useRef, useState } from "react";
import { ShieldCheck, LogIn, ExternalLink, Loader2, RotateCcw } from "lucide-react";
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,hsl(196_82%_92%),transparent_28%),linear-gradient(135deg,hsl(210_36%_96%),hsl(48_60%_96%))] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
        <section className="grid w-full gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 border border-slate-900 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] shadow-[6px_6px_0_hsl(222_47%_11%)]">
              <ShieldCheck className="h-4 w-4" />
              OpenServerless SSO
            </div>

            <div className="max-w-2xl space-y-5">
              <h1 className="text-balance text-5xl font-black leading-[0.95] text-slate-950 md:text-7xl">
                Trustable Workspace
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-700">
                Accedi con il provider aziendale e apri il namespace OpenServerless assegnato.
              </p>
            </div>

            <div className="grid max-w-xl grid-cols-3 border border-slate-900 bg-white text-center shadow-[8px_8px_0_hsl(222_47%_11%)]">
              <div className="border-r border-slate-900 p-4">
                <div className="text-2xl font-black">OIDC</div>
                <div className="text-xs uppercase text-slate-500">Protocollo</div>
              </div>
              <div className="border-r border-slate-900 p-4">
                <div className="text-2xl font-black">PKCE</div>
                <div className="text-xs uppercase text-slate-500">Protezione</div>
              </div>
              <div className="p-4">
                <div className="text-2xl font-black">SSO</div>
                <div className="text-xs uppercase text-slate-500">Cluster</div>
              </div>
            </div>
          </div>

          <div className="border border-slate-900 bg-white p-6 shadow-[12px_12px_0_hsl(222_47%_11%)]">
            <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-5">
              <img src="/trustable.png" alt="Trustable" className="h-12 w-auto" />
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase text-emerald-900">
                SSO enabled
              </span>
            </div>

            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black">Login</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Il cluster usera il provider SSO configurato per verificare l'identita e risolvere il namespace.
                </p>
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
                  {status === "idle" ? "Accedi con SSO" : "In attesa"}
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
  const popup = window.open("about:blank", "trureact_sso", "width=520,height=720");
  if (!popup) return null;

  popup.document.title = "Trustable SSO";
  popup.document.body.style.margin = "0";
  popup.document.body.style.fontFamily = "system-ui, sans-serif";
  popup.document.body.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;background:#f8fafc;color:#020617">
      <section style="border:1px solid #020617;background:white;padding:28px;box-shadow:10px 10px 0 #020617;max-width:360px">
        <h1 style="font-size:22px;margin:0 0 10px;font-weight:900">SSO Trustable</h1>
        <p style="margin:0;color:#475569;line-height:1.5">Preparazione login SSO...</p>
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
