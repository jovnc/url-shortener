interface SingpassLogoProps {
  size?: number;
}

export function SingpassLogo({ size = 26 }: SingpassLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="Singpass">
      <rect width="40" height="40" rx="8" fill="#F4333D" />
      <text
        x="50%"
        y="56%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight="900"
        fontSize="17"
        letterSpacing="-0.5"
        fill="#fff"
      >
        sp
      </text>
    </svg>
  );
}
