export interface ResponsiveUIState {
  isMobile: boolean;
  windowWidth: number;
  windowHeight: number;
}

export interface ResponsiveActions {
  setIsMobile: (isMobile: boolean) => void;
  updateWindowDimensions: (width: number, height: number) => void;
}

export const MOBILE_BREAKPOINT = 768;
