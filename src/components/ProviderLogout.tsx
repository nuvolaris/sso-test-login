import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProviderLogoutUrl } from "@/lib/sso";

export default function ProviderLogout({ onReset }: { onReset: () => void }) {
  return (
    <div className="space-y-2">
      <Button asChild variant="outline" className="w-full rounded-none border-slate-400">
        <a href={getProviderLogoutUrl()} target="_blank" rel="noreferrer" onClick={onReset}>
          <LogOut className="h-4 w-4" />
          Cambia account Keycloak
        </a>
      </Button>
      <p className="text-xs leading-5 text-slate-600">
        Conferma l'uscita nella pagina Keycloak, poi torna qui e premi Accedi.
        L'uscita termina la sessione SSO di questo realm anche per le altre app.
        Riavvia annulla solo il tentativo corrente.
      </p>
    </div>
  );
}
