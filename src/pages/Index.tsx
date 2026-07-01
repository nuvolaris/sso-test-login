import { LogOut, Server, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SsoSession } from "@/lib/sso";

type IndexProps = {
  session: SsoSession;
  onLogout: () => void;
};

const Index = ({ session, onLogout }: IndexProps) => {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,hsl(210_36%_96%),hsl(48_60%_96%))] text-slate-950">
      <header className="border-b border-slate-900 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/trustable.png"
              alt="Trustable Logo"
              className="h-10 w-auto"
            />
            <div className="hidden text-sm font-bold uppercase tracking-[0.16em] text-slate-500 sm:block">
              Workspace
            </div>
          </div>
          <Button onClick={onLogout} variant="outline" className="rounded-none border-slate-900">
            <LogOut className="h-4 w-4" />
            Esci
          </Button>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="space-y-7">
          <div className="inline-flex items-center gap-3 border border-slate-900 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] shadow-[6px_6px_0_hsl(222_47%_11%)]">
            <ShieldCheck className="h-4 w-4" />
            SSO active
          </div>

          <div className="space-y-4">
            <h1 className="text-balance text-5xl font-black leading-[0.96] md:text-7xl">
              Trustable - Backend Test
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-700">
              Sessione federata pronta. Il namespace OpenServerless e stato risolto dal bridge SSO.
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

        <section className="border border-slate-900 bg-white p-6 shadow-[12px_12px_0_hsl(222_47%_11%)]">
          <h2 className="mb-4 text-2xl font-black">Workspace online</h2>
          <ul className="space-y-3 text-left text-base text-slate-700">
            <li className="border border-slate-200 p-3">Change the home page in a Todo list</li>
            <li className="border border-slate-200 p-3">Change the home page in an Address book</li>
            <li className="border border-slate-200 p-3">Change the home page in a Pomodoro timer</li>
            <li className="border border-slate-200 p-3">Change the home page in an Unit converter</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default Index;
