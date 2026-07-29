import { supabase } from "../supabaseClient";

function emailFromUsername(username) {
  return `${username.trim().toLowerCase()}@seucondominio.app`;
}

export async function login(username, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailFromUsername(username),
    password,
  });
  if (error) throw error;
  return data.user;
}

export async function logout() {
  await supabase.auth.signOut();
  // Força um reload completo da página (em vez de só trocar o
  // componente React). Isso é necessário pra alguns navegadores
  // (principalmente Safari no iPhone) reconhecerem a tela de login
  // como uma página "nova" de verdade e oferecerem o autofill de
  // usuário/senha salvos. Uma troca de componente via SPA, sem reload,
  // costuma não disparar esse comportamento.
  window.location.href = "/";
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return null;

  return {
    id: data.id,
    username: data.usuario,
    name: data.nome,
    apartment: data.apartamento,
    isAdmin: data.is_admin,
  };
}
