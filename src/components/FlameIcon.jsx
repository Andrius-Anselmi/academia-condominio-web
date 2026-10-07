// Chama de uma cor só, no estilo do Strava (laranja sólido com a gota vazada).
// `size` em px. Com `muted`, a chama fica apagada (ex.: sequência zerada).
export default function FlameIcon({
  size = 28,
  muted = false,
  color = "#FC5200",
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="9 1 46 61"
      aria-hidden="true"
      style={muted ? { opacity: 0.35, filter: "grayscale(1)" } : undefined}
    >
      <path
        fill={color}
        fillRule="evenodd"
        d="M33 3 C34 14 47 22 47 38 C47 50 40 60 32 60 C24 60 17 50 17 38 C17 31 20 26 23 22 C24 28 26 30 28 31 C27 19 29 9 33 3 Z M32 37 C35 42 39 45 39 50 C39 54 36 57 32 57 C28 57 25 54 25 50 C25 45 29 42 32 37 Z"
      />
    </svg>
  );
}
