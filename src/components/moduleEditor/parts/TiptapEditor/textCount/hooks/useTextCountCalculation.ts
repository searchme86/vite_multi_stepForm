import { useMemo } from 'react';

interface TextCountMetrics {
  currentChars: number;
  progress: number;
  remainingChars: number;
  isTargetReached: boolean;
}

interface RingData {
  progress: number;
  color: string;
  backgroundColor: string;
}

interface UseTextCountCalculationProps {
  editorContent: string;
  targetChars: number;
  includeSpaces: boolean;
}

interface UseTextCountCalculationReturn {
  metrics: TextCountMetrics;
  ringData: RingData[];
}

// 🎨 애플워치 실제 색상 팔레트 적용
const APPLE_WATCH_COLORS = {
  // Move 링 (빨간색 계열) - 더 생동감 있는 핫핑크
  MOVE: '#FA114F',
  MOVE_BG: 'rgba(250, 17, 79, 0.15)',

  // Exercise 링 (초록색 계열) - 밝고 화려한 네온 그린
  EXERCISE: '#92D050',
  EXERCISE_BG: 'rgba(146, 208, 80, 0.15)',

  // Stand 링 (파란색 계열) - 생동감 있는 시안 블루
  STAND: '#00D4FF',
  STAND_BG: 'rgba(0, 212, 255, 0.15)',
} as const;

const countCharacters = (
  text: string,
  includeSpaces: boolean = true
): number => {
  if (!text) return 0;
  const plainText = text.replace(/<[^>]*>/g, '').trim();
  return includeSpaces ? plainText.length : plainText.replace(/\s/g, '').length;
};

const calculateProgress = (current: number, target: number): number => {
  if (target === 0) return 0;
  return Math.min((current / target) * 100, 100);
};

export function useTextCountCalculation({
  editorContent,
  targetChars,
  includeSpaces,
}: UseTextCountCalculationProps): UseTextCountCalculationReturn {
  const currentChars = useMemo(() => {
    return countCharacters(editorContent, includeSpaces);
  }, [editorContent, includeSpaces]);

  const progress = useMemo(() => {
    return calculateProgress(currentChars, targetChars);
  }, [currentChars, targetChars]);

  const metrics = useMemo((): TextCountMetrics => {
    const remainingChars = Math.max(targetChars - currentChars, 0);
    const isTargetReached = currentChars >= targetChars;

    return {
      currentChars,
      progress,
      remainingChars,
      isTargetReached,
    };
  }, [currentChars, targetChars, progress]);

  // 🎨 애플워치 스타일의 화려한 색상으로 링 데이터 생성
  const ringData = useMemo((): RingData[] => {
    return [
      // Move 링 - 메인 진행률 (생동감 있는 핫핑크)
      {
        progress: progress,
        color: APPLE_WATCH_COLORS.MOVE,
        backgroundColor: APPLE_WATCH_COLORS.MOVE_BG,
      },
      // Exercise 링 - 50% 기준 (밝은 네온 그린)
      {
        progress: Math.min((currentChars / (targetChars * 0.5)) * 100, 100),
        color: APPLE_WATCH_COLORS.EXERCISE,
        backgroundColor: APPLE_WATCH_COLORS.EXERCISE_BG,
      },
      // Stand 링 - 25% 기준 (화려한 시안 블루)
      {
        progress: Math.min((currentChars / (targetChars * 0.25)) * 100, 100),
        color: APPLE_WATCH_COLORS.STAND,
        backgroundColor: APPLE_WATCH_COLORS.STAND_BG,
      },
    ];
  }, [progress, currentChars, targetChars]);

  return {
    metrics,
    ringData,
  };
}

export default useTextCountCalculation;
