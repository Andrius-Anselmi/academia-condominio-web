import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "../services/authService";
import { timeSlots } from "../models/timeSlots";
import SplashScreen from "./SplashScreen";
import {
  listenToDayReservations,
  createReservation,
  cancelReservation,
  listenToDayBlocks,
  blockSlot,
  unblockSlot,
} from "../services/reservationsService";

import {
  listenToAnnouncements,
  createAnnouncement,
  removeAnnouncement,
} from "../services/announcementsService";

const weekDayLabels = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const BOOKING_WINDOW_DAYS = 7;

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function HomeScreen() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedDay, setSelectedDay] = useState(formatDate(new Date()));
  const [reservations, setReservations] = useState([]);
  const [confirming, setConfirming] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [blockingSlot, setBlockingSlot] = useState(null);
  const [blockReason, setBlockReason] = useState("Manutenção");
  const [unblockingSlot, setUnblockingSlot] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState("");

  function showToast(message) {
    setToast({ id: Date.now(), message });
  }

  function isSlotClosed(dayStr, slot) {
    const slotDateTime = new Date(`${dayStr}T${slot.start}:00`);
    const closeCutoff = new Date(slotDateTime.getTime() - 10 * 60 * 1000); // fecha 10 min antes
    return new Date() >= closeCutoff;
  }

  function isSlotNotYetOpen(dayStr, slot) {
    const slotDateTime = new Date(`${dayStr}T${slot.start}:00`);
    const openCutoff = new Date(slotDateTime.getTime() - 48 * 60 * 60 * 1000); // abre 48h antes
    return new Date() < openCutoff;
  }

  function formatVagas(quantidade) {
    if (quantidade === 1) return "1 vaga disponível";
    return `${quantidade} vagas disponíveis`;
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    getCurrentUser().then((u) => {
      // console.log("Usuário carregado:", u);
      setUser(u);
      setLoadingUser(false);
    });
  }, []);

  useEffect(() => {
    const stopListening = listenToDayReservations(selectedDay, setReservations);
    return stopListening;
  }, [selectedDay]);

  useEffect(() => {
    const stopListening = listenToDayBlocks(selectedDay, setBlocks);
    return stopListening;
  }, [selectedDay]);

  useEffect(() => {
    const stopListening = listenToAnnouncements(setAnnouncements);
    return stopListening;
  }, []);

  async function handleConfirm(slot) {
    if (!user) return;

    const alreadyHasReservationToday = reservations.some(
      (r) => r.userId === user.id,
    );
    if (alreadyHasReservationToday) {
      showToast("Você já tem uma reserva nesse dia.");
      setConfirming(null);
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticReservation = {
      id: tempId,
      userId: user.id,
      apartment: user.apartment,
      residentName: user.name,
      date: selectedDay,
      startTime: slot.start,
      endTime: slot.end,
    };
    setReservations((prev) => [...prev, optimisticReservation]);
    setConfirming(null);

    try {
      await createReservation({
        userId: user.id,
        apartment: user.apartment,
        name: user.name,
        date: selectedDay,
        startTime: slot.start,
        endTime: slot.end,
      });
    } catch (e) {
      setReservations((prev) => prev.filter((r) => r.id !== tempId));
      showToast(e.message || "Erro ao reservar");
    }
  }

  async function handleCancel(reservationId) {
    setCancelingId(reservationId);

    let removedReservation;
    setReservations((prev) => {
      removedReservation = prev.find((r) => r.id === reservationId);
      return prev.filter((r) => r.id !== reservationId);
    });

    try {
      await cancelReservation(reservationId);
    } catch (e) {
      if (removedReservation) {
        setReservations((prev) => [...prev, removedReservation]);
      }
      showToast(e.message || "Não foi possível cancelar a reserva.");
    } finally {
      setCancelingId(null);
    }
  }

  function openBlockModal(slot) {
    setBlockReason("Manutenção");
    setBlockingSlot(slot);
  }

  function openUnblockConfirm(slot) {
    setUnblockingSlot(slot);
  }

  async function handleConfirmBlock() {
    if (!blockingSlot || !user) return;
    try {
      await blockSlot({
        userId: user.id,
        date: selectedDay,
        startTime: blockingSlot.start,
        reason: blockReason,
      });
    } catch (e) {
      showToast(e.message || "Erro ao bloquear");
    } finally {
      setBlockingSlot(null);
    }
  }

  async function handleConfirmUnblock() {
    if (!unblockingSlot || !user) return;
    try {
      await unblockSlot({
        userId: user.id,
        date: selectedDay,
        startTime: unblockingSlot.start,
      });
    } catch (e) {
      showToast(e.message || "Erro ao desbloquear");
    } finally {
      setUnblockingSlot(null);
    }
  }

  async function handlePostAnnouncement() {
    if (!newAnnouncement.trim() || !user) return;
    try {
      await createAnnouncement({
        userId: user.id,
        name: user.name,
        apartment: user.apartment,
        message: newAnnouncement.trim(),
      });
      setNewAnnouncement("");
      setPostingAnnouncement(false);
    } catch (e) {
      showToast(e.message || "Erro ao postar aviso");
    }
  }

  async function handleRemoveAnnouncement(announcementId) {
    try {
      await removeAnnouncement(announcementId);
    } catch (e) {
      showToast(e.message || "Não foi possível remover o aviso");
    }
  }

  if (loadingUser) {
    return <SplashScreen />;
  }

  if (!user) {
    return (
      <div className="loading-screen">
        <p>Não foi possível carregar seu usuário.</p>
        <button onClick={logout}>Voltar ao login</button>
      </div>
    );
  }

  const today = new Date();
  const days = Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  return (
    <div className="home-container">
      <div className="home-header">
        <div className="home-header-top">
          <div className="apartment-badge">
            <span className="dot" />
            <span>
              {user.name.toUpperCase()} · APTO {user.apartment}
            </span>
          </div>
          <button className="logout-link" onClick={logout}>
            sair
          </button>
        </div>
        <h2 className="home-title">Horários</h2>
        <div className="day-picker">
          {days.map((d) => {
            const dayStr = formatDate(d);
            const active = dayStr === selectedDay;
            const dayName = weekDayLabels[(d.getDay() + 6) % 7];
            const label =
              dayStr === formatDate(today)
                ? `${dayName} · HOJE`
                : `${dayName} ${d.getDate()}`;
            return (
              <button
                key={dayStr}
                className={`day-pill ${active ? "active" : ""}`}
                onClick={() => setSelectedDay(dayStr)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="legend">
        <span className="legend-item">
          <span className="legend-dot blue" /> disponível
        </span>
        <span className="legend-item">
          <span className="legend-dot red" /> lotado
        </span>
        <span className="legend-item">
          <span className="legend-dot yellow" /> sua reserva
        </span>
      </div>

      <div className="announcements-panel">
        <div className="announcements-header">
          <span className="announcements-title">Avisos</span>
          <button
            className="add-announcement-button"
            onClick={() => setPostingAnnouncement(true)}
          >
            + Avisar
          </button>
        </div>

        {announcements.length === 0 ? (
          <p className="announcements-empty">Nenhum aviso no momento.</p>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className="announcement-item">
              <div className="announcement-text">
                <span className="announcement-message">{a.message}</span>
                <span className="announcement-meta">
                  {a.residentName} · {a.apartment}
                </span>
              </div>
              {(a.userId === user.id || user.isAdmin) && (
                <button
                  className="remove-announcement-button"
                  onClick={() => handleRemoveAnnouncement(a.id)}
                  title="Remover aviso"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="slots-list">
        {timeSlots.map((slot) => {
          const slotReservations = reservations.filter(
            (r) => r.startTime === slot.start,
          );
          const occupied = slotReservations.length;
          const myReservation = slotReservations.find(
            (r) => r.userId === user.id,
          );
          const full = occupied >= 4;
          const closed = isSlotClosed(selectedDay, slot);
          const notYetOpen = isSlotNotYetOpen(selectedDay, slot);
          const bookable = !closed && !notYetOpen;
          const blockedSlot = blocks.find(
            (b) => b.hora_inicio.slice(0, 5) === slot.start,
          );

          const hasOtherReservationToday = reservations.some(
            (r) => r.userId === user.id && r.id !== myReservation?.id,
          );
          const blockedByDailyLimit =
            hasOtherReservationToday && !myReservation;

          let cardClass = "slot-card";
          let statusText = formatVagas(4 - occupied);
          if (blockedSlot) {
            cardClass += " slot-blocked";
            statusText = blockedSlot.motivo
              ? `Bloqueado · ${blockedSlot.motivo}`
              : "Bloqueado";
          } else if (myReservation) {
            cardClass += " slot-mine";
            statusText = "Você reservou";
          } else if (full) {
            cardClass += " slot-full";
            statusText = "Lotado";
          } else if (closed) {
            cardClass += " slot-closed";
            statusText = "Encerrado";
          } else if (notYetOpen) {
            cardClass += " slot-not-open";
            statusText = "Ainda não liberado";
          }

          function handleSlotClick() {
            if (blockedSlot || myReservation || full || !bookable) return;
            if (blockedByDailyLimit) {
              showToast(
                "Você já tem uma reserva nesse dia. Cancele-a para escolher outro horário.",
              );
              return;
            }
            setConfirming(slot);
          }

          return (
            <div
              key={slot.start}
              className={cardClass}
              onClick={handleSlotClick}
            >
              <div className="slot-row">
                <div className="slot-time">
                  <strong>
                    {slot.start}–{slot.end}
                  </strong>
                  <small>1h</small>
                </div>
                <div className="slot-middle">
                  <span className="slot-status">{statusText}</span>
                  <div className="slot-dots">
                    {Array.from({ length: 4 }, (_, i) => {
                      const r = slotReservations[i];
                      let color = "";
                      if (r) {
                        color =
                          r.userId === user.id
                            ? "yellow"
                            : full
                              ? "red"
                              : "blue";
                      }
                      return <span key={i} className={`dot-slot ${color}`} />;
                    })}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {myReservation ? (
                    <button
                      className="cancel-button"
                      disabled={cancelingId === myReservation.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(myReservation.id);
                      }}
                    >
                      {cancelingId === myReservation.id ? "..." : "✕"}
                    </button>
                  ) : !full && bookable && !blockedSlot ? (
                    <span className="chevron">›</span>
                  ) : null}

                  {user.isAdmin && (
                    <button
                      className="admin-block-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (blockedSlot) {
                          openUnblockConfirm(slot);
                        } else {
                          openBlockModal(slot);
                        }
                      }}
                      title={
                        blockedSlot ? "Desbloquear" : "Bloquear (manutenção)"
                      }
                    >
                      🔧
                    </button>
                  )}
                </div>
              </div>
              {slotReservations.length > 0 && (
                <div className="slot-names">
                  {slotReservations.map((r) => (
                    <span key={r.id}>
                      {r.residentName} · {r.apartment}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {confirming && (
        <div className="modal-overlay" onClick={() => setConfirming(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {confirming.start} – {confirming.end}
            </h3>
            <p>Confirmar sua reserva nesse horário?</p>
            <div className="modal-buttons">
              <button
                className="button-secondary"
                onClick={() => setConfirming(null)}
              >
                Cancelar
              </button>
              <button
                className="button-primary"
                onClick={() => handleConfirm(confirming)}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {blockingSlot && (
        <div className="modal-overlay" onClick={() => setBlockingSlot(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {blockingSlot.start} – {blockingSlot.end}
            </h3>
            <p>Motivo do bloqueio:</p>
            <input
              type="text"
              className="block-reason-input"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              autoFocus
            />
            <div className="modal-buttons">
              <button
                className="button-secondary"
                onClick={() => setBlockingSlot(null)}
              >
                Cancelar
              </button>
              <button className="button-primary" onClick={handleConfirmBlock}>
                Bloquear
              </button>
            </div>
          </div>
        </div>
      )}

      {unblockingSlot && (
        <div className="modal-overlay" onClick={() => setUnblockingSlot(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {unblockingSlot.start} – {unblockingSlot.end}
            </h3>
            <p>Desbloquear esse horário?</p>
            <div className="modal-buttons">
              <button
                className="button-secondary"
                onClick={() => setUnblockingSlot(null)}
              >
                Cancelar
              </button>
              <button className="button-primary" onClick={handleConfirmUnblock}>
                Desbloquear
              </button>
            </div>
          </div>
        </div>
      )}

      {postingAnnouncement && (
        <div
          className="modal-overlay"
          onClick={() => setPostingAnnouncement(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Novo aviso</h3>
            <textarea
              className="announcement-textarea"
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
              maxLength={200}
              rows={3}
              autoFocus
            />
            <div className="modal-buttons">
              <button
                className="button-secondary"
                onClick={() => setPostingAnnouncement(false)}
              >
                Cancelar
              </button>
              <button
                className="button-primary"
                onClick={handlePostAnnouncement}
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast">
          <span>{toast.message}</span>
          <button
            className="toast-close"
            onClick={() => setToast(null)}
            aria-label="Fechar aviso"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
