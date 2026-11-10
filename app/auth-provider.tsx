"use client";

import { createContext, useContext, useEffect, useState, type ReactNode, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";

type AuthContextValue = {
  email: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  return context;
}

function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);

    try {
      const supabase = getSupabaseClient();

      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });

        if (authError) throw authError;

        if (!data.session) {
          setNotice("Tu cuenta se creó. Revisa tu correo para confirmar la dirección y después inicia sesión.");
        } else {
          setNotice("¡Tu cuenta está lista! Bienvenido a AURENZA.");
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos completar la solicitud. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-mark"><span /><i /></div>
          <span>AURENZA</span>
        </div>
        <div className="auth-eyebrow">TU ESPACIO, A TU RITMO</div>
        <h1>{mode === "signup" ? "Comienza con claridad" : "Qué gusto tenerte de vuelta"}<span>.</span></h1>
        <p className="auth-description">
          {mode === "signup"
            ? "Crea tu cuenta y organiza tus ideas, actividades y objetivos en un solo lugar."
            : "Inicia sesión para continuar en tu espacio personal."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="aurenza-email">Correo electrónico</label>
          <input
            id="aurenza-email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="aurenza-password">Contraseña</label>
          <input
            id="aurenza-password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && <p className="auth-message auth-error" role="alert">{error}</p>}
          {notice && <p className="auth-message auth-notice" role="status">{notice}</p>}
          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? "Un momento..." : mode === "signup" ? "Crear mi cuenta" : "Iniciar sesión"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "signup" ? "¿Ya tienes una cuenta?" : "¿Todavía no tienes cuenta?"}
          <button type="button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); setNotice(""); }}>
            {mode === "signup" ? "Inicia sesión" : "Crear cuenta"}
          </button>
        </div>
        <div className="auth-footnote">ORGANIZA <span>·</span> PLANEA <span>·</span> LOGRA</div>
      </section>
      <div className="auth-side-note">Un espacio para cada idea. Un paso más cerca de tus objetivos.</div>
    </main>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw error;
  }

  if (loading) {
    return <main className="auth-loading"><div className="auth-loading-mark" /><span>AURENZA</span></main>;
  }

  if (!session) return <AuthScreen />;

  return (
    <AuthContext.Provider value={{ email: session.user.email ?? null, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
