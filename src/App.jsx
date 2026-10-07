import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import LoginScreen from "./components/LoginScreen";
import AppShell from "./components/AppShell";
import SplashScreen from "./components/SplashScreen";
import "./App.css";

const SPLASH_MIN_MS = 1600; // tempo mínimo que a splash fica na tela
const SPLASH_FADE_MS = 500; // duração do fade-out (igual ao CSS)

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minTimeDone, setMinTimeDone] = useState(false);
  const [splashGone, setSplashGone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    // Workaround para bug conhecido do supabase-js: ao trocar de aba/app
    // e voltar, o auto-refresh do token às vezes trava ou falha
    // silenciosamente, fazendo a sessão "sumir" sem motivo real.
    // Forçamos uma nova checagem manual sempre que a aba volta a ficar visível.
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
        });
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      listener.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // A splash fica no mínimo SPLASH_MIN_MS, mesmo se a sessão carregar antes.
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeDone(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  // Quando tudo está pronto, faz o fade-out e depois remove a splash.
  const ready = !loading && minTimeDone;
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => setSplashGone(true), SPLASH_FADE_MS);
    return () => clearTimeout(timer);
  }, [ready]);

  return (
    <>
      {!loading && (session ? <AppShell /> : <LoginScreen />)}
      {!splashGone && <SplashScreen leaving={ready} />}
    </>
  );
}
