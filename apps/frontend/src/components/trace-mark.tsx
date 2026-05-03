interface TraceMarkProps {
  size?: number;
  color?: string;
}

export function TraceMark({ size = 28, color = 'currentColor' }: TraceMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M4 16 L13 16 L13 7 L19 7 L19 16 L28 16 L28 22 L19 22 L19 28 L13 28 L13 22 L4 22 Z"
        fill={color}
      />
    </svg>
  );
}
