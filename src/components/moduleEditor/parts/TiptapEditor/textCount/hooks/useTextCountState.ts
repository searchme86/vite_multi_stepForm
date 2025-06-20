import { useState, useCallback, useEffect } from 'react';

interface UseTextCountStateProps {
  initialTargetChars?: number;
  onRecommendedCharsChange?: (chars: number) => void;
  onGoalModeChange?: (enabled: boolean) => void;
}

interface TextCountState {
  targetChars: number;
  isGoalModeEnabled: boolean;
  includeSpaces: boolean;
}

interface TextCountActions {
  setTargetChars: (chars: number) => void;
  setIsGoalModeEnabled: (enabled: boolean) => void;
  setIncludeSpaces: (include: boolean) => void;
  handleTargetCharsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGoalModeToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleIncludeSpacesToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function useTextCountState({
  initialTargetChars = 30,
  onRecommendedCharsChange,
  onGoalModeChange,
}: UseTextCountStateProps = {}): TextCountState & TextCountActions {
  const [targetChars, setTargetChars] = useState<number>(initialTargetChars);
  const [isGoalModeEnabled, setIsGoalModeEnabled] = useState<boolean>(false);
  const [includeSpaces, setIncludeSpaces] = useState<boolean>(true);

  useEffect(() => {
    const recommendedChars =
      isGoalModeEnabled && targetChars > 0 ? targetChars : 30;
    onRecommendedCharsChange?.(recommendedChars);
  }, [isGoalModeEnabled, targetChars, onRecommendedCharsChange]);

  useEffect(() => {
    onGoalModeChange?.(isGoalModeEnabled);
  }, [isGoalModeEnabled, onGoalModeChange]);

  const handleTargetCharsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const parsedValue = parseInt(inputValue, 10);
      const safeValue = isNaN(parsedValue) ? 30 : Math.max(1, parsedValue);
      setTargetChars(safeValue);
    },
    []
  );

  const handleGoalModeToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const isEnabled = e.target.checked;
      setIsGoalModeEnabled(isEnabled);
    },
    []
  );

  const handleIncludeSpacesToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const shouldInclude = e.target.checked;
      setIncludeSpaces(shouldInclude);
    },
    []
  );

  return {
    targetChars,
    isGoalModeEnabled,
    includeSpaces,
    setTargetChars,
    setIsGoalModeEnabled,
    setIncludeSpaces,
    handleTargetCharsChange,
    handleGoalModeToggle,
    handleIncludeSpacesToggle,
  };
}

export default useTextCountState;
