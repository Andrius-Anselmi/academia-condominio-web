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

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading-screen">Carregando...</div>;
  }

  return session ? <HomeScreen /> : <LoginScreen />;
}
