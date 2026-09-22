export function MiniSine({
  active = false,
  disabled = false
}: {
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <span className={\`mini-sine \${active ? "is-active" : ""} \${disabled ? "is-disabled" : ""}\`}>
      <svg viewBox="0 0 96 32" aria-hidden="true">
        <g className="sine-track">
          <path d="M-48 16 C-40 3 -32 3 -24 16 S-8 29 0 16 S16 3 24 16 S40 29 48 16 S64 3 72 16 S88 29 96 16 S112 3 120 16 S136 29 144 16" />
        </g>
        <line x1="0" y1="16" x2="96" y2="16" className="sine-axis" />
      </svg>
    </span>
  );
}
