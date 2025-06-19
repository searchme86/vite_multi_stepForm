import { SwiperSlide } from 'swiper/react';
import { SwipeSlideProps } from '../types/swipeableTypes';

/**
 * SwipeSlide 래퍼 컴포넌트
 * - Swiper의 SwiperSlide를 래핑하여 일관된 스타일과 구조 제공
 * - 자동 스크롤 처리 및 접근성 개선
 */
export function SwipeSlide({
  children,
  className = '',
  slideId,
}: SwipeSlideProps) {
  return (
    <SwiperSlide
      className={`h-full ${className}`}
      data-slide-id={slideId}
      role="tabpanel"
      aria-label={slideId ? `${slideId} 슬라이드` : '슬라이드'}
    >
      <div className="flex flex-col w-full h-full overflow-auto bg-white">
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    </SwiperSlide>
  );
}

/**
 * 🎨 SwipeSlide 사용법 예시:
 *
 * <SwipeSlide slideId="structure" className="bg-blue-50">
 *   <StructureManagementContent />
 * </SwipeSlide>
 *
 * <SwipeSlide slideId="preview">
 *   <PreviewContent />
 * </SwipeSlide>
 */
