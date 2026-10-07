import { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../services/authService";
import { getUserReservations } from "../services/reservationsService";
import { getPhoto, savePhotoData } from "../services/activityPhotos";
import AvatarCropper from "./AvatarCropper";
import { getNote, saveNote } from "../services/activityNotes";
import DumbbellIcon from "./DumbbellIcon";
import FlameIcon from "./FlameIcon";
import "./ProfileScreen.css";

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const WEEK_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"]; // seg → dom
const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function parseDay(str) {
  return new Date(`${str}T00:00:00`);
}

function slotEnd(r) {
  const d = new Date(`${r.date}T${r.endTime}:00`);
  if (r.endTime <= r.startTime) d.setDate(d.getDate() + 1);
  return d;
}

function weekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function weekStreak(done) {
  const weeks = new Set(done.map((r) => weekStart(parseDay(r.date)).getTime()));
  const cursor = weekStart(new Date());
  if (!weeks.has(cursor.getTime())) cursor.setDate(cursor.getDate() - 7);
  let count = 0;
  while (weeks.has(cursor.getTime())) {
    count++;
    cursor.setDate(cursor.getDate() - 7);
  }
  return count;
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Botão que abre a câmera/galeria e devolve o arquivo escolhido.
function FilePick({ onFile, className, children, label }) {
  return (
    <label className={className} aria-label={label}>
      {children}
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
    </label>
  );
}

export default function ProfileScreen({ active }) {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("light");
  const [avatar, setAvatar] = useState(null);
  const [cropFile, setCropFile] = useState(null);
  const [openMonths, setOpenMonths] = useState({}); // { [chaveMes]: true }
  const [notes, setNotes] = useState({}); // { [idReserva]: texto }
  const [openId, setOpenId] = useState(null); // treino expandido
  const [mode, setMode] = useState("read"); // "read" | "edit"
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!active) return;
    setTheme(localStorage.getItem("homeTheme") || "light");

    let cancelled = false;
    (async () => {
      try {
        const u = await getCurrentUser();
        const list = await getUserReservations(u.id);
        if (cancelled) return;
        setUser(u);
        setItems(list);

        setAvatar(getPhoto(`avatar-${u.id}`));
        const loaded = {};
        list.forEach((r) => {
          const n = getNote(r.id);
          if (n) loaded[r.id] = n;
        });
        setNotes(loaded);
        setError("");
      } catch (e) {
        if (!cancelled)
          setError(e.message || "Não foi possível carregar seu histórico.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active]);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function confirmCrop(dataUrl) {
    try {
      setAvatar(savePhotoData(`avatar-${user?.id}`, dataUrl));
    } catch (e) {
      flash(e.message);
    }
    setCropFile(null);
  }

  function toggleRow(r) {
    if (openId === r.id) return setOpenId(null);
    setOpenId(r.id);
    setDraft(notes[r.id] || "");
    setMode(notes[r.id] ? "read" : "edit");
  }

  function submitNote(id) {
    try {
      const text = saveNote(id, draft);
      setNotes((n) => {
        const next = { ...n };
        if (text) next[id] = text;
        else delete next[id];
        return next;
      });
      setMode("read");
      if (!text) setOpenId(null);
    } catch (e) {
      flash(e.message);
    }
  }

  const { done, months, thisWeek, monthCount, weekDays } = useMemo(() => {
    const now = new Date();
    const finished = items.filter((r) => slotEnd(r) <= now);

    const start = weekStart(now);
    const thisWeek = [];
    const grouped = [];
    items.forEach((r) => {
      const row = { ...r, upcoming: slotEnd(r) > now };
      const d = parseDay(r.date);
      if (weekStart(d).getTime() === start.getTime()) {
        thisWeek.push(row);
        return; // a semana atual aparece no topo, fora dos meses
      }
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      let group = grouped.find((g) => g.key === key);
      if (!group) {
        group = {
          key,
          label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
          rows: [],
        };
        grouped.push(group);
      }
      group.rows.push(row);
    });

    const thisMonth = finished.filter((r) => {
      const d = parseDay(r.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length;

    // Faixa seg → dom da semana atual
    const week = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      return {
        label: WEEK_LABELS[i],
        trained: finished.some((r) => r.date === iso),
        booked: items.some((r) => r.date === iso && slotEnd(r) > now),
        today: day.toDateString() === now.toDateString(),
      };
    });

    return {
      done: finished,
      months: grouped,
      thisWeek,
      monthCount: thisMonth,
      weekDays: week,
    };
  }, [items]);

  const streak = weekStreak(done);

  function renderCard(r) {
    const d = parseDay(r.date);
    const note = notes[r.id];
    const open = openId === r.id;
    const canOpen = !r.upcoming;
    return (
      <article key={r.id} className="slot-card-v2 pf-card">
        <div
          className={`sc-row ${canOpen ? "pf-row" : ""}`}
          {...(canOpen && {
            role: "button",
            tabIndex: 0,
            "aria-expanded": open,
            onClick: () => toggleRow(r),
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleRow(r);
              }
            },
          })}
        >
          <div
            className={`sc-badge ${
              r.upcoming ? "sc-badge-mine" : "sc-badge-available"
            }`}
          >
            <DumbbellIcon />
          </div>
          <div className="sc-main">
            <div className="sc-title">
              {WEEKDAYS[d.getDay()]}, {d.getDate()} de {MONTHS[d.getMonth()]}
            </div>
            <div className="sc-subtitle">
              {r.startTime}–{r.endTime}
            </div>
          </div>
          {r.upcoming && <div className="sc-pill sc-pill-mine">agendado</div>}
          {canOpen && !note && !open && <span className="pf-add">Anotar</span>}
          {canOpen && (note || open) && (
            <span
              className={`pf-chevron ${open ? "is-open" : ""} ${
                note ? "has-note" : ""
              }`}
              aria-hidden="true"
            />
          )}
        </div>

        {open && mode === "read" && (
          <div className="pf-body">
            <p className="pf-note">{note}</p>
            <button
              type="button"
              className="pf-link"
              onClick={() => setMode("edit")}
            >
              Editar anotação
            </button>
          </div>
        )}

        {open && mode === "edit" && (
          <div className="pf-body pf-editor">
            <textarea
              autoFocus
              rows={4}
              maxLength={600}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Como foi o treino? Ex.: perna, agachamento 4x8, leg press, stiff"
            />
            <div className="pf-editor-actions">
              <button
                type="button"
                className="pf-btn"
                onClick={() => (note ? setMode("read") : setOpenId(null))}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="pf-btn pf-btn-primary"
                onClick={() => submitNote(r.id)}
              >
                Salvar
              </button>
            </div>
          </div>
        )}
      </article>
    );
  }

  return (
    <div className="home-container profile-screen" data-theme={theme}>
      <header className="pf-hero">
        <FilePick
          className="pf-avatar"
          label="Trocar foto de perfil"
          onFile={setCropFile}
        >
          {avatar ? (
            <img src={avatar} alt="" />
          ) : (
            <span>{initials(user?.name)}</span>
          )}
          <span className="pf-avatar-cam" aria-hidden="true">
            +
          </span>
        </FilePick>

        <div className="pf-id">
          <h2 className="pf-name">{user?.name || " "}</h2>
          <div className="pf-apt">{user ? `Apto ${user.apartment}` : " "}</div>
        </div>
      </header>

      <section className="pf-stats" aria-label="Resumo">
        <div className="pf-stat">
          <strong>{done.length}</strong>
          <span>{done.length === 1 ? "treino" : "treinos"}</span>
        </div>
        <div className="pf-stat">
          <strong>{monthCount}</strong>
          <span>no mês</span>
        </div>
        <div className="pf-stat pf-stat-streak">
          <strong>
            <FlameIcon size={26} muted={streak === 0} />
            {streak}
          </strong>
          <span>{streak === 1 ? "semana seguida" : "semanas seguidas"}</span>
        </div>
      </section>

      <section className="pf-week" aria-label="Sua semana">
        {weekDays.map((d, i) => (
          <div key={i} className="pf-day">
            <span
              className={`pf-dot ${d.trained ? "is-done" : ""} ${
                d.booked ? "is-booked" : ""
              } ${d.today ? "is-today" : ""}`}
            >
              {d.trained && <DumbbellIcon />}
            </span>
            <span className="pf-day-label">{d.label}</span>
          </div>
        ))}
      </section>

      <div className="profile-section">
        {loading && <p className="profile-empty">Carregando histórico...</p>}
        {error && <p className="profile-empty">{error}</p>}
        {!loading && !error && months.length === 0 && thisWeek.length === 0 && (
          <p className="profile-empty">
            Você ainda não tem treinos. Reserve um horário na aba Horários.
          </p>
        )}

        {thisWeek.length > 0 && (
          <div className="profile-month-block">
            <div className="profile-month">
              <span>esta semana</span>
              <span>{thisWeek.length}</span>
            </div>
            {thisWeek.map(renderCard)}
          </div>
        )}

        {months.map((m) => {
          const isOpen = !!openMonths[m.key];
          return (
            <div key={m.key} className="profile-month-block">
              <button
                type="button"
                className="profile-month pf-month-toggle"
                aria-expanded={isOpen}
                onClick={() =>
                  setOpenMonths((o) => ({ ...o, [m.key]: !o[m.key] }))
                }
              >
                <span>{m.label}</span>
                <span className="pf-month-end">
                  {m.rows.length}
                  <span
                    className={`pf-chevron ${isOpen ? "is-open" : ""}`}
                    aria-hidden="true"
                  />
                </span>
              </button>
              {isOpen && m.rows.map(renderCard)}
            </div>
          );
        })}
      </div>

      {cropFile && (
        <AvatarCropper
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onConfirm={confirmCrop}
        />
      )}

      {toast && (
        <div className="pf-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
