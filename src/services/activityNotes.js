// Anotações de cada treino (ex.: "Perna: agachamento 4x8, leg press, stiff").
// Ficam no localStorage por enquanto. Para sincronizar entre aparelhos, troque
// estas funções por chamadas ao seu backend (uma coluna "note" na reserva resolve).

export function getNote(id) {
  try {
    return localStorage.getItem(`note:${id}`) || "";
  } catch {
    return "";
  }
}

export function saveNote(id, text) {
  const clean = text.trim();
  try {
    if (clean) localStorage.setItem(`note:${id}`, clean);
    else localStorage.removeItem(`note:${id}`);
  } catch {
    throw new Error("Não foi possível salvar a anotação.");
  }
  return clean;
}
