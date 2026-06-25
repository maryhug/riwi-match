interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
}

export default function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  color = '#967DF5',
  trackColor = '#EEE9FF',
  label,
  sublabel,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        {/* Center label */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: 'rotate(0deg)' }}
        >
          <span
            className="font-bold leading-none"
            style={{
              fontSize: size * 0.22,
              color: '#1E1B4B',
              fontFamily: 'var(--font-display)',
            }}
          >
            {Math.round(value)}%
          </span>
        </div>
      </div>
      {label && (
        <p className="text-sm font-semibold text-center" style={{ color: '#1E1B4B' }}>
          {label}
        </p>
      )}
      {sublabel && (
        <p className="text-xs text-center" style={{ color: '#9CA3AF' }}>
          {sublabel}
        </p>
      )}
    </div>
  );
}
