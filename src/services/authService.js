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
  };
}
