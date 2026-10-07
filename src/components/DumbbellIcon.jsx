export default function DumbbellIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-100 -100 200 200"
      aria-hidden="true"
    >
      <g transform="rotate(-35)" fill="currentColor">
        <rect x="-50" y="-6" width="100" height="12" rx="3" opacity="0.5" />
        <rect x="-92" y="-12" width="10" height="24" rx="4" opacity="0.55" />
        <rect x="-84" y="-27" width="18" height="54" rx="6" opacity="0.75" />
        <rect x="-68" y="-38" width="22" height="76" rx="7" />
        <rect x="82" y="-12" width="10" height="24" rx="4" opacity="0.55" />
        <rect x="66" y="-27" width="18" height="54" rx="6" opacity="0.75" />
        <rect x="46" y="-38" width="22" height="76" rx="7" />
      </g>
    </svg>
  );
}
