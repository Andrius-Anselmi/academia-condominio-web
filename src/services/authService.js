import { supabase } from "../supabaseClient";

function userEmail(username) {
  return `${username.trim().toLowerCase()}@yourcondominium.app`;
}

export async function login(username, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: userEmail(username),
    password: password,
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
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return null;
  return data;
}
