import { useState } from "react";
import HomeScreen from "./HomeScreen";
import ProfileScreen from "./ProfileScreen";

function CalendarIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20c.8-3.6 3.7-5.5 7.5-5.5s6.7 1.9 7.5 5.5" />
    </svg>
  );
}

const TABS = [
  { id: "home", label: "Horários", Icon: CalendarIcon },
  { id: "profile", label: "Você", Icon: UserIcon },
];

export default function AppShell() {
  const [tab, setTab] = useState("home");

  // As duas telas ficam montadas e só uma aparece. Assim a Home não perde
  // o dia selecionado nem recarrega o usuário ao voltar do perfil.
  return (
    <>
      <div hidden={tab !== "home"}>
        <HomeScreen />
      </div>
      <div hidden={tab !== "profile"}>
        <ProfileScreen active={tab === "profile"} />
      </div>

      <nav className="bottom-nav" aria-label="Navegação principal">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`bottom-nav-item ${tab === id ? "active" : ""}`}
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
