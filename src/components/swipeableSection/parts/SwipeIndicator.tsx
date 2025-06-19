import React from 'react';
import { SwipeIndicatorProps } from '../types/swipeableTypes';

/**
 * SwipeIndicator 컴포넌트
 * - 현재 슬라이드 위치를 시각적으로 표시
 * - 클릭으로 직접 슬라이드 이동 가능
 * - 상단/하단 위치 설정 가능
 * - 접근성 완벽 지원
 */
export function SwipeIndicator({
  totalSlides,
  activeIndex,
  onIndicatorClick,
  position = 'bottom',
  className = '',
}: SwipeIndicatorProps) {
  const positionClasses = {
    top: 'top-4',
    bottom: 'bottom-4',
  };

  const indicators = Array.from({ length: totalSlides }, (_, index) => {
    const isActive = index === activeIndex;

    return (
      <button
        key={index}
        type="button"
        onClick={() => onIndicatorClick(index)}
        className={`
          w-2 h-2 rounded-full
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
          ${
            isActive
              ? 'bg-blue-500 scale-125 shadow-md'
              : 'bg-gray-300 hover:bg-gray-400 hover:scale-110'
          }
        `}
        aria-label={`슬라이드 ${index + 1}로 이동`}
        aria-current={isActive ? 'true' : 'false'}
        {...(isActive && { 'aria-pressed': 'true' })}
      />
    );
  });

  return (
    <div
      className={`
        absolute left-1/2 transform -translate-x-1/2 z-10
        ${positionClasses[position]}
        ${className}
      `}
      role="tablist"
      aria-label="슬라이드 네비게이션"
    >
      <div
        className="flex items-center justify-center px-3 py-2 space-x-2 transition-all duration-200 border rounded-full shadow-sm  bg-white/90 backdrop-blur-sm border-gray-200/50 hover:bg-white/95 hover:shadow-md"
      >
        {indicators}

        <div className="ml-2 text-xs font-medium text-gray-600">
          {activeIndex + 1}/{totalSlides}
        </div>
      </div>
    </div>
  );
}

/**
 * 🎨 SwipeIndicator 사용법 예시:
 *
 * <SwipeIndicator
 *   totalSlides={3}
 *   activeIndex={1}
 *   onIndicatorClick={(index) => goToSlide(index)}
 *   position="bottom"
 * />
 */
