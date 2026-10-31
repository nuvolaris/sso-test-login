import { useState, type ReactNode } from "react";
import type { SsoSession } from "@/lib/sso";
import LoginPage from "@/pages/Login";

type AuthGateProps = {
  children: (session: SsoSession, logout: () => void) => ReactNode;
};

const AuthGate = ({ children }: AuthGateProps) => {
  // A success screen must follow a real backend response, not editable browser storage.
  const [session, setSession] = useState<SsoSession | null>(null);
  if (!session) return <LoginPage onAuthenticated={setSession} />;
  return <>{children(session, () => setSession(null))}</>;
};
export default AuthGate;
