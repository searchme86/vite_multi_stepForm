import React from 'react';
import { StepNumber } from '../../types/stepTypes';

interface StepNavigationContextType {
  currentStep: StepNumber;
  progressWidth: number;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  goToStep: (step: StepNumber) => void;
  canGoToStep: (step: StepNumber) => boolean;
  isFirstStep: () => boolean;
  isLastStep: () => boolean;
  getStepProgress: () => number;
  getTotalSteps: () => number;
}

const StepNavigationContext = React.createContext<
  StepNavigationContextType | undefined
>(undefined);

interface StepNavigationProviderProps {
  children: React.ReactNode;
  value: StepNavigationContextType;
}

export function StepNavigationProvider({
  children,
  value,
}: StepNavigationProviderProps) {
  console.log(
    '🧭 StepNavigationProvider: 스텝 네비게이션 Context Provider 렌더링'
  );

  return (
    <StepNavigationContext.Provider value={value}>
      {children}
    </StepNavigationContext.Provider>
  );
}

export function useStepNavigationContext() {
  console.log('🧭 useStepNavigationContext: 스텝 네비게이션 Context 사용');

  const context = React.useContext(StepNavigationContext);
  if (context === undefined) {
    throw new Error(
      'useStepNavigationContext must be used within a StepNavigationProvider'
    );
  }
  return context;
}

export { StepNavigationContext };
