import React from 'react';
import { ResponsiveUIState } from '../../types/responsiveTypes';

interface ResponsiveUIContextType extends ResponsiveUIState {
  setIsMobile: (isMobile: boolean) => void;
  updateWindowDimensions: (width: number, height: number) => void;
  isTablet: boolean;
  isDesktop: boolean;
  getBreakpoint: () => 'mobile' | 'tablet' | 'desktop';
  checkMobile: () => boolean;
}

const ResponsiveUIContext = React.createContext<
  ResponsiveUIContextType | undefined
>(undefined);

interface ResponsiveUIProviderProps {
  children: React.ReactNode;
  value: ResponsiveUIContextType;
}

export function ResponsiveUIProvider({
  children,
  value,
}: ResponsiveUIProviderProps) {
  console.log('📱 ResponsiveUIProvider: 반응형 UI Context Provider 렌더링');

  return (
    <ResponsiveUIContext.Provider value={value}>
      {children}
    </ResponsiveUIContext.Provider>
  );
}

export function useResponsiveUIContext() {
  console.log('📱 useResponsiveUIContext: 반응형 UI Context 사용');

  const context = React.useContext(ResponsiveUIContext);
  if (context === undefined) {
    throw new Error(
      'useResponsiveUIContext must be used within a ResponsiveUIProvider'
    );
  }
  return context;
}

export { ResponsiveUIContext };
