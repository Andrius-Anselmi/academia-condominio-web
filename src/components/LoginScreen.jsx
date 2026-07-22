import { useState } from "react";
import { login } from "../services/authService";
import "./LoginScreen.css";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);

    try {
      await login(username.trim(), senha.trim());
      // Não precisa navegar manualmente: o App.jsx escuta
      // supabase.auth.onAuthStateChange e troca pra HomeScreen sozinho
      // assim que a sessão for criada.
    } catch (e) {
      // Supabase não usa e.code como o Firebase, e sim e.message.
      const msg = e.message || "";
      if (msg.includes("Invalid login credentials")) {
        setErro("Usuário ou senha incorretos.");
      } else if (msg.includes("Email not confirmed")) {
        setErro("Confirme seu e-mail antes de entrar.");
      } else {
        setErro("Não foi possível entrar. Tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  }

  function handleEsqueceuSenha() {
    // TODO: ligar navegação real quando existir a tela de recuperação de senha
    alert("Fale com a portaria para redefinir sua senha.");
  }

  return (
    <div className="ls-screen">
      <div className="ls-bg" />
      <div className="ls-overlay" />

      <div className="ls-safe-area">
        <div className="ls-content">
          <div className="ls-top">
            <h1 className="ls-title">Chatêau de La Vie</h1>

            <div className="ls-badge">
              <span className="ls-badge-dot" />
              <span>Aberta agora · 05h às 00h</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="ls-form">
            <input
              className="ls-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuário"
              autoCapitalize="none"
            />

            <input
              className="ls-input"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha"
            />

            {erro && <p className="ls-error">{erro}</p>}

            <button className="ls-button" type="submit" disabled={carregando}>
              {carregando ? "Entrando..." : "Entrar"}
            </button>

            <button
              type="button"
              className="ls-forgot"
              onClick={handleEsqueceuSenha}
            >
              Esqueceu sua senha?
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
