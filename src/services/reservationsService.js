import { supabase } from "../supabaseClient";

function mapReservation(row) {
  return {
    id: row.id,
    userId: row.usuario_id,
    apartment: row.apartamento,
    residentName: row.nome_morador,
    date: row.data,
    startTime: row.hora_inicio.slice(0, 5), // "00:00:00" -> "00:00"
    endTime: row.hora_fim.slice(0, 5),
  };
}

export function listenToDayReservations(date, callback) {
  supabase
    .from("reservas")
    .select("*")
    .eq("data", date)
    .then(({ data }) => callback((data || []).map(mapReservation)));

  const channel = supabase
    .channel(`reservations-${date}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "reservas",
        filter: `data=eq.${date}`,
      },
      () => {
        supabase
          .from("reservas")
          .select("*")
          .eq("data", date)
          .then(({ data }) => callback((data || []).map(mapReservation)));
      },
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export async function createReservation({
  userId,
  apartment,
  name,
  date,
  startTime,
  endTime,
}) {
  const { error } = await supabase.rpc("reservar_horario", {
    p_usuario_id: userId,
    p_apartamento: apartment,
    p_nome: name,
    p_data: date,
    p_hora_inicio: startTime,
    p_hora_fim: endTime,
  });
  if (error) throw error;
}

export async function cancelReservation(reservationId) {
  const { data, error } = await supabase
    .from("reservas")
    .delete()
    .eq("id", reservationId)
    .select();

  if (error) throw error;

  console.log("Linhas deletadas:", data);

  if (!data || data.length === 0) {
    throw new Error("RLS bloqueou o delete — nenhuma linha foi removida");
  }
}

export function listenToDayBlocks(date, callback) {
  supabase
    .from("bloqueios")
    .select("*")
    .eq("data", date)
    .then(({ data }) => callback(data || []));

  const channel = supabase
    .channel(`blocks-${date}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "bloqueios",
        filter: `data=eq.${date}`,
      },
      () => {
        supabase
          .from("bloqueios")
          .select("*")
          .eq("data", date)
          .then(({ data }) => callback(data || []));
      },
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export async function blockSlot({ userId, date, startTime, reason }) {
  const { error } = await supabase.rpc("bloquear_horario", {
    p_usuario_id: userId,
    p_data: date,
    p_hora_inicio: startTime,
    p_motivo: reason,
  });
  if (error) throw error;
}

export async function unblockSlot({ userId, date, startTime }) {
  const { error } = await supabase.rpc("desbloquear_horario", {
    p_usuario_id: userId,
    p_data: date,
    p_hora_inicio: startTime,
  });
  if (error) throw error;
}
