import { motion } from 'framer-motion';
import TextCountMessage from './TextCountMessage'; // 🚀 동적 메시지 컴포넌트 추가

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
    <div className="border-b border-gray-200 bg-gray-50">
      {/* 🎯 메인 진행률 표시 영역 */}
      <div className="p-2">
        <div className="flex items-center gap-3">
          <MultiActivityRings rings={rings} size={32} />

          {/* 📊 글자수 상세 정보 - 요청된 형식으로 변경 */}
          <div className="flex-1 text-xs text-blue-700">
            <div className="font-medium">
              <span className="text-blue-800">현재: </span>
              <span className="font-bold text-blue-900">
                {metrics.currentChars}
              </span>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-orange-600">남은글자: </span>
              <span className="font-bold text-orange-700">
                {metrics.remainingChars}
              </span>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-green-600">목표: </span>
              <span className="font-bold text-green-700">{targetChars}</span>
            </div>
            <div className="mt-1 text-xs opacity-75">
              <span className="text-purple-600">
                진행률: {Math.round(metrics.progress)}%
              </span>
              <span className="ml-2 text-gray-500">
                ({includeSpaces ? '공백포함' : '공백미포함'})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 동적 메시지 영역 추가 */}
      <div className="border-t border-gray-100">
        <TextCountMessage progress={metrics.progress} />
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
