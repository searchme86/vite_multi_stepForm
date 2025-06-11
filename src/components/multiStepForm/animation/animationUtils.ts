export const ANIMATION_DURATION = {
  FAST: 0.2,
  NORMAL: 0.3,
  SLOW: 0.5,
  EXTRA_SLOW: 0.7,
};

export const EASING = {
  EASE_IN_OUT: 'ease-in-out',
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  LINEAR: 'linear',
};

export const slideVariants = {
  enter: { x: 100, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 },
};

export const fadeVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

export const createSlideTransition = (
  duration: number = ANIMATION_DURATION.NORMAL
) => {
  console.log('🎬 createSlideTransition: 슬라이드 전환 생성', duration);
  return {
    duration,
    ease: EASING.EASE_IN_OUT,
  };
};

export const createFadeTransition = (
  duration: number = ANIMATION_DURATION.NORMAL
) => {
  console.log('🎬 createFadeTransition: 페이드 전환 생성', duration);
  return {
    duration,
    ease: EASING.EASE_IN_OUT,
  };
};
