interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  label?: string
  sublabel?: string
}

export function CircularProgress({
  value,
  size = 96,
  strokeWidth = 8,
  color = 'var(--color-primary)',
  trackColor = 'var(--color-bg-subtle)',
  label,
  sublabel,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference * (1 - clamped / 100)

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={label ? `${label}: ${clamped}%` : `${clamped}%`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-lg font-bold text-ink">
          {clamped}%
        </span>
      </div>
      {label && <span className="text-xs font-semibold text-ink">{label}</span>}
      {sublabel && <span className="text-[11px] text-text-muted">{sublabel}</span>}
    </div>
  )
}
