import { CheckCircle2, CloudCog, KeyRound, LogOut, Network, Server, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import ProviderLogout from "@/components/ProviderLogout";
import type { SsoSession } from "@/lib/sso";

type IndexProps = {
  session: SsoSession;
  onLogout: () => void;
};

const Index = ({ session, onLogout }: IndexProps) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_90%_10%,rgba(29,164,216,0.18),transparent_30%),linear-gradient(135deg,#f8fafc,#eef5f8)] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-5">
            <img src="/leonardo-logo.svg" alt="Leonardo" className="h-8 w-auto" />
            <div className="h-8 w-px bg-slate-200" />
            <img src="/nuvolaris-logo.png" alt="Nuvolaris" className="h-8 w-auto" />
            <div className="hidden text-sm font-bold uppercase tracking-[0.16em] text-slate-500 sm:block">
              SSO Test Portal
            </div>
          </div>
          <Button onClick={onLogout} variant="outline" className="rounded-none border-slate-900">
            <LogOut className="h-4 w-4" />
            Esci dal test
          </Button>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="space-y-7">
          <ProviderLogout onReset={onLogout} />
          <div className="inline-flex items-center gap-3 border border-emerald-700 bg-emerald-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-900 shadow-[6px_6px_0_#064e3b]">
            <ShieldCheck className="h-4 w-4" />
            Accesso SSO verificato
          </div>

          <div className="space-y-4">
            <h1 className="text-balance text-5xl font-black leading-[0.96] md:text-7xl">
              Benvenuto nel progetto Leonardo – PSN
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-700">
              Il backend ha confermato l'accesso federato. Il bridge SSO ha verificato l'identità e risolto il namespace
              OpenServerless assegnato all'utente.
            </p>
          </div>

          <div className="grid max-w-xl gap-3 sm:grid-cols-2">
            <div className="border border-slate-900 bg-white p-4 shadow-[6px_6px_0_hsl(222_47%_11%)]">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                <Server className="h-4 w-4" />
                Namespace
              </div>
              <div className="break-all text-xl font-black">{session.namespace}</div>
            </div>
            <div className="border border-slate-900 bg-white p-4 shadow-[6px_6px_0_hsl(222_47%_11%)]">
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Login
              </div>
              <div className="break-all text-xl font-black">{session.login}</div>
            </div>
          </div>
        </section>

        <section className="border border-slate-900 bg-white p-6 shadow-[12px_12px_0_#0e7490] md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <CloudCog className="h-7 w-7 text-cyan-700" />
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Ambiente dimostrativo</div>
              <h2 className="text-2xl font-black">Informazioni sul progetto</h2>
            </div>
          </div>

          <div className="grid gap-4">
            <ProjectInfo
              icon={<KeyRound className="h-5 w-5" />}
              title="Obiettivo del test"
              description="Validare il login federato Keycloak, il device flow OIDC e l'associazione sicura tra identità e workspace."
            />
            <ProjectInfo
              icon={<Server className="h-5 w-5" />}
              title="Piattaforma applicativa"
              description="Apache OpenServerless su infrastruttura PSN, con servizi applicativi pubblicati tramite ingress dedicati."
            />
            <ProjectInfo
              icon={<Network className="h-5 w-5" />}
              title="Perimetro della verifica"
              description="Autenticazione, provisioning del namespace, accesso alla UI e raggiungibilità dei servizi del cluster."
            />
          </div>

          <div className="mt-6 flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Il completamento di questa pagina conferma che il flusso SSO e il workspace binding hanno superato il test.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;

type ProjectInfoProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

function ProjectInfo({ icon, title, description }: ProjectInfoProps) {
  return (
    <article className="flex gap-4 border border-slate-200 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-cyan-50 text-cyan-700">{icon}</div>
      <div>
        <h3 className="font-black text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </article>
  );
}
