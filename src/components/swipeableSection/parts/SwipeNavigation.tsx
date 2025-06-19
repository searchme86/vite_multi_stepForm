import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SwipeNavigationProps } from '../types/swipeableTypes';

/**
 * SwipeNavigation 컴포넌트
 * - 좌우 화살표로 슬라이드 이동 제어
 * - 드래그와 함께 사용하는 보조 네비게이션
 * - 데스크탑 환경에서 주로 사용
 * - 접근성 및 키보드 네비게이션 완벽 지원
 */
export function SwipeNavigation({
  onPrevClick,
  onNextClick,
  hasNext,
  hasPrev,
  className = '',
}: SwipeNavigationProps) {
  const buttonBaseClass = `
    w-10 h-10
    flex items-center justify-center
    bg-white/90 backdrop-blur-sm
    border border-gray-200/50
    rounded-full
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
    shadow-sm hover:shadow-md
    group
  `;

  const getButtonClass = (isEnabled: boolean) => `
    ${buttonBaseClass}
    ${
      isEnabled
        ? 'text-gray-700 hover:text-blue-600 hover:bg-white hover:border-blue-200 cursor-pointer'
        : 'text-gray-300 cursor-not-allowed opacity-50'
    }
  `;

  const iconClass = `
    w-5 h-5
    transition-transform duration-200
    group-hover:scale-110
  `;

  return (
    <div
      className={`
        absolute inset-y-0 left-0 right-0
        flex items-center justify-between
        pointer-events-none
        px-4 z-20
        ${className}
      `}
      role="navigation"
      aria-label="슬라이드 네비게이션"
    >
      <button
        type="button"
        onClick={() => {
          if (hasPrev) {
            onPrevClick();
          }
        }}
        disabled={!hasPrev}
        className={`
          ${getButtonClass(hasPrev)}
          pointer-events-auto
        `}
        aria-label="이전 슬라이드"
        aria-disabled={!hasPrev}
      >
        <ChevronLeft
          className={`
            ${iconClass}
            ${hasPrev ? 'group-hover:-translate-x-0.5' : ''}
          `}
        />
      </button>

      <button
        type="button"
        onClick={() => {
          if (hasNext) {
            onNextClick();
          }
        }}
        disabled={!hasNext}
        className={`
          ${getButtonClass(hasNext)}
          pointer-events-auto
        `}
        aria-label="다음 슬라이드"
        aria-disabled={!hasNext}
      >
        <ChevronRight
          className={`
            ${iconClass}
            ${hasNext ? 'group-hover:translate-x-0.5' : ''}
          `}
        />
      </button>
    </div>
  );
}

/**
 * 🎨 SwipeNavigation 사용법 예시:
 *
 * <SwipeNavigation
 *   onPrevClick={() => goToPrev()}
 *   onNextClick={() => goToNext()}
 *   hasNext={!isLastSlide}
 *   hasPrev={!isFirstSlide}
 * />
 *
 * // 조건부 렌더링으로 사용
 * {showNavigation && (
 *   <SwipeNavigation
 *     onPrevClick={handlePrev}
 *     onNextClick={handleNext}
 *     hasNext={canGoNext}
 *     hasPrev={canGoPrev}
 *     className="opacity-80 hover:opacity-100"
 *   />
 * )}
 */
