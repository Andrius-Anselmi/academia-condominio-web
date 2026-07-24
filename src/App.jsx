import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import LoginScreen from "./components/LoginScreen";
import HomeScreen from "./components/HomeScreen";
import "./App.css";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="loading-screen">Carregando...</div>;
  }

  return session ? <HomeScreen /> : <LoginScreen />;
}
