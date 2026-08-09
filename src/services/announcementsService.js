import { supabase } from "../supabaseClient";

function mapAnnouncement(row) {
  return {
    id: row.id,
    message: row.mensagem,
    userId: row.usuario_id,
    residentName: row.nome_morador,
    apartment: row.apartamento,
    createdAt: row.criado_em,
  };
}

export function listenToAnnouncements(callback) {
  supabase
    .from("avisos")
    .select("*")
    .order("criado_em", { ascending: false })
    .then(({ data }) => callback((data || []).map(mapAnnouncement)));

  const channel = supabase
    .channel("announcements-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "avisos" },
      () => {
        supabase
          .from("avisos")
          .select("*")
          .order("criado_em", { ascending: false })
          .then(({ data }) => callback((data || []).map(mapAnnouncement)));
      },
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export async function createAnnouncement({ userId, name, apartment, message }) {
  const { error } = await supabase.from("avisos").insert({
    usuario_id: userId,
    nome_morador: name,
    apartamento: apartment,
    mensagem: message,
  });
  if (error) throw error;
}

export async function removeAnnouncement(announcementId) {
  const { error } = await supabase
    .from("avisos")
    .delete()
    .eq("id", announcementId);
  if (error) throw error;
}
