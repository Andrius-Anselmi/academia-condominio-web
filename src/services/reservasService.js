import { supabase } from "../supabaseClient";

export function listenToDailyReservations(date, callback) {
  // Initial fetch
  supabase
    .from("reservations")
    .select("*")
    .eq("date", date)
    .then(({ data: reservations }) => callback(reservations || []));

  // Real-time — equivalent to Flutter's StreamBuilder
  const channel = supabase
    .channel(`reservations-${date}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "reservations",
        filter: `date=eq.${date}`,
      },
      () => {
        supabase
          .from("reservations")
          .select("*")
          .eq("date", date)
          .then(({ data: reservations }) => callback(reservations || []));
      },
    )
    .subscribe();

  return () => supabase.removeChannel(channel); // função de "parar de ouvir"
}

export async function reserve({
  userId,
  apartment,
  name,
  date,
  startTime,
  endTime,
}) {
  const { error } = await supabase.rpc("reserve_time_slot", {
    p_user_id: userId,
    p_apartment: apartment,
    p_name: name,
    p_date: date,
    p_start_time: startTime,
    p_end_time: endTime,
  });

  if (error) throw error;
}

export async function cancel(reservationId) {
  const { error } = await supabase
    .from("reservations")
    .delete()
    .eq("id", reservationId);

  if (error) throw error;
}
