import DumbbellIcon from "./DumbbellIcon";

const APP_NAME = "FitZone"; // troque pelo nome do seu app

export default function SplashScreen({ leaving = false }) {
  return (
    <div
      className={`splash-screen ${leaving ? "splash-leaving" : ""}`}
      role="status"
      aria-label="Carregando"
    >
      <div className="splash-logo">
        <div className="splash-mark">
          <DumbbellIcon size={64} />
        </div>
        <h1 className="splash-name">{APP_NAME}</h1>
        <p className="splash-tagline"></p>
      </div>
    </div>
  );
}
