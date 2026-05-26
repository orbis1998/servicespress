import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentRole } from "@/lib/auth";
import type { Session } from "@supabase/supabase-js";

type Role = "admin" | "livreur";

type AuthState = {
  session: Session | null;
  role: Role | null;
  loading: boolean;
  user: Session["user"] | null;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const sync = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);

    if (nextSession?.user) {
      setRole(await getCurrentRole(nextSession.user.id));
    } else {
      setRole(null);
    }

    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    await sync(s);
  }, [sync]);

  useEffect(() => {
    let cancelled = false;

    const runSync = async (s: Session | null) => {
      if (cancelled) return;
      await sync(s);
    };

    supabase.auth.getSession().then(({ data: { session: s } }) => runSync(s));

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "INITIAL_SESSION") return;
      window.setTimeout(() => void runSync(s), 0);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [sync]);

  return (
    <AuthContext.Provider
      value={{ session, role, loading, user: session?.user ?? null, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  }
  return ctx;
}
