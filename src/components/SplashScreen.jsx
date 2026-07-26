export default function SplashScreen() {
  return (
    <div className="splash-screen">
      <svg width="72" height="72" viewBox="0 0 512 512" className="splash-icon">
        <rect width="512" height="512" rx="96" fill="#14161A" />
        <g fill="#E8A33D">
          <rect x="96" y="196" width="28" height="120" rx="8" />
          <rect x="132" y="216" width="20" height="80" rx="6" />
          <rect x="140" y="247" width="232" height="18" rx="9" />
          <rect x="388" y="196" width="28" height="120" rx="8" />
          <rect x="360" y="216" width="20" height="80" rx="6" />
        </g>
        <circle cx="256" cy="256" r="10" fill="#F2EFE9" />
      </svg>
      <div className="splash-spinner" />
    </div>
  );
}
