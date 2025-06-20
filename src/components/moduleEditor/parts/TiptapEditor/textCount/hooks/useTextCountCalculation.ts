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

  const ringData = useMemo((): RingData[] => {
    return [
      {
        progress: progress,
        color: '#ff2d92',
        backgroundColor: 'rgba(255, 45, 146, 0.15)',
      },
      {
        progress: Math.min((currentChars / (targetChars * 0.5)) * 100, 100),
        color: '#32d74b',
        backgroundColor: 'rgba(50, 215, 75, 0.15)',
      },
      {
        progress: Math.min((currentChars / (targetChars * 0.25)) * 100, 100),
        color: '#007aff',
        backgroundColor: 'rgba(0, 122, 255, 0.15)',
      },
    ];
  }, [progress, currentChars, targetChars]);

  return {
    metrics,
    ringData,
  };
}

export default useTextCountCalculation;
