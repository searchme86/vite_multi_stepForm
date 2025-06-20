import { motion } from 'framer-motion';

interface RingData {
  progress: number;
  color: string;
  backgroundColor: string;
}

interface TextCountMetrics {
  currentChars: number;
  progress: number;
  remainingChars: number;
  isTargetReached: boolean;
}

function ActivityRing({
  progress,
  size = 28,
  strokeWidth = 4,
  color = '#ff2d92',
  backgroundColor = 'rgba(255, 255, 255, 0.2)',
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
}) {
  const radius = Math.max((size - strokeWidth) / 2, 1);
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  );
}

function MultiActivityRings({
  rings,
  size = 28,
}: {
  rings: RingData[];
  size?: number;
}) {
  const spacing = 3;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {rings.map((ring, index) => {
        const ringSize = size - index * spacing * 2;
        const strokeWidth = Math.max(4 - index * 1, 2);

        return (
          <div
            key={index}
            className="absolute"
            style={{
              top: index * spacing,
              left: index * spacing,
              width: ringSize,
              height: ringSize,
            }}
          >
            <ActivityRing
              progress={ring.progress}
              size={ringSize}
              strokeWidth={strokeWidth}
              color={ring.color}
              backgroundColor={ring.backgroundColor}
            />
          </div>
        );
      })}
    </div>
  );
}

function CompactProgressDisplay({
  rings,
  metrics,
  targetChars,
  includeSpaces,
}: {
  rings: RingData[];
  metrics: TextCountMetrics;
  targetChars: number;
  includeSpaces: boolean;
}) {
  return (
    <div className="p-2 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center gap-2">
        <MultiActivityRings rings={rings} size={28} />

        <div className="flex-1 text-xs text-blue-700">
          <span className="font-bold">{metrics.currentChars}</span>
          <span className="mx-1">/</span>
          <span className="font-bold">{targetChars}</span>
          <span className="ml-1">({Math.round(metrics.progress)}%)</span>
          <span className="ml-2 opacity-75">
            {includeSpaces ? '공백포함' : '공백미포함'}
          </span>
        </div>
      </div>
    </div>
  );
}

interface TextCountProgressProps {
  rings: RingData[];
  metrics: TextCountMetrics;
  targetChars: number;
  includeSpaces: boolean;
}

function TextCountProgress({
  rings,
  metrics,
  targetChars,
  includeSpaces,
}: TextCountProgressProps) {
  return (
    <CompactProgressDisplay
      rings={rings}
      metrics={metrics}
      targetChars={targetChars}
      includeSpaces={includeSpaces}
    />
  );
}

export default TextCountProgress;
