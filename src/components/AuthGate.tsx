import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { clearSession, loadSession, saveSession, type SsoSession } from "@/lib/sso";
import LoginPage from "@/pages/Login";

type AuthGateProps = {
  children: (session: SsoSession, logout: () => void) => ReactNode;
};

const AuthGate = ({ children }: AuthGateProps) => {
  const [session, setSession] = useState<SsoSession | null>(() => loadSession());

  const actions = useMemo(
    () => ({
      login(nextSession: SsoSession) {
        saveSession(nextSession);
        setSession(nextSession);
      },
      logout() {
        clearSession();
        setSession(null);
      },
    }),
    [],
  );

  if (!session) {
    return <LoginPage onAuthenticated={actions.login} />;
  }

  return <>{children(session, actions.logout)}</>;
};

export default AuthGate;
