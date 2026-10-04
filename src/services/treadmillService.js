import { supabase } from "../supabaseClient";

const typeToDb = { during: "durante", after: "apos" };
const typeFromDb = { durante: "during", apos: "after" };

function mapTreadmill(row) {
  return {
    id: row.id,
    userId: row.usuario_id,
    apartment: row.apartamento,
    residentName: row.nome_morador,
    date: row.data,
    slotStart: row.hora_referencia.slice(0, 5), // "18:00:00" -> "18:00"
    type: typeFromDb[row.tipo],
  };
}

export function listenToDayTreadmill(date, callback) {
  const load = () =>
    supabase
      .from("esteira_reservas")
      .select("*")
      .eq("data", date)
      .then(({ data, error }) => {
        if (error) {
          console.error("Erro ao carregar esteira:", error);
          return;
        }
        console.log("Esteira carregada:", data);
        callback((data || []).map(mapTreadmill));
      });

  load();

  const channel = supabase
    .channel(`treadmill-${date}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "esteira_reservas",
        filter: `data=eq.${date}`,
      },
      load,
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export async function createTreadmillReservation({
  userId,
  apartment,
  name,
  date,
  slotStart,
  type,
}) {
  const { error } = await supabase.rpc("reservar_esteira", {
    p_usuario_id: userId,
    p_apartamento: apartment,
    p_nome: name,
    p_data: date,
    p_hora_referencia: slotStart,
    p_tipo: typeToDb[type],
  });
  if (error) throw error;
}

export async function cancelTreadmillReservation({ userId, id }) {
  const { error } = await supabase.rpc("cancelar_esteira", {
    p_usuario_id: userId,
    p_id: id,
  });
  if (error) throw error;
}
