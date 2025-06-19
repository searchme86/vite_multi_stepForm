import React from 'react';
import { SwipeLabelProps } from '../types/swipeableTypes';

/**
 * SwipeLabel 컴포넌트
 * - 현재 슬라이드의 라벨을 표시
 * - 부드러운 전환 애니메이션 지원
 * - 다양한 위치 설정 가능 (top, bottom, inside)
 * - 깔끔한 유리 효과 디자인
 */
export function SwipeLabel({
  currentSlide,
  position = 'bottom',
  className = '',
}: SwipeLabelProps) {
  const positionClasses = {
    top: 'top-4',
    bottom: 'bottom-4',
    inside: 'top-1/2 transform -translate-y-1/2',
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return 'shadow-lg';
      case 'bottom':
        return 'shadow-md';
      case 'inside':
        return 'shadow-xl bg-white/95';
      default:
        return 'shadow-md';
    }
  };

  if (!currentSlide.label) {
    return null;
  }

  return (
    <div
      className={`
        absolute right-4 z-10
        ${positionClasses[position]}
        ${className}
      `}
      role="status"
      aria-live="polite"
      aria-label="현재 슬라이드"
    >
      <div
        className={`
        bg-white/90 backdrop-blur-sm
        rounded-lg px-3 py-1
        border border-gray-200/50
        transition-all duration-300 ease-out
        hover:bg-white/95 hover:shadow-lg
        ${getPositionStyles()}
      `}
      >
        <span className="text-sm font-medium text-gray-700 transition-colors duration-200 select-none ">
          {currentSlide.label}
        </span>
      </div>

      {position === 'inside' && (
        <div className="absolute rounded-lg opacity-50 -inset-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-sm -z-10" />
      )}
    </div>
  );
}

/**
 * 🎨 SwipeLabel 사용법 예시:
 *
 * <SwipeLabel
 *   currentSlide={{ id: 'structure', label: '구조관리' }}
 *   position="bottom"
 * />
 *
 * <SwipeLabel
 *   currentSlide={{ id: 'preview', label: '최종조합' }}
 *   position="inside"
 *   className="opacity-80"
 * />
 */
