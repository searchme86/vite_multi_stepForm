import React, { useMemo, useCallback } from 'react';

//====여기부터 수정됨====
// ✅ 추가: 타입 안전성을 위한 인터페이스 정의
// 이유: 더 구체적인 타입 정의로 타입 안전성 확보
interface ImageViewConfig {
  selectedImages: string[]; // 선택된 이미지 URL 배열
  clickOrder: number[]; // 클릭 순서 배열 (1, 2, 3...)
  layout: {
    columns: number; // 그리드 열 개수 (2~6)
    gridType?: 'grid' | 'masonry'; // 레이아웃 타입 (기본값: 'grid')
  };
  filter?: string; // 필터 옵션 (선택사항)
}

// ✅ 추가: 아이템 크기 타입 정의
// 이유: 매스너리 레이아웃의 크기 정보를 명확하게 타입 정의
interface ItemSize {
  colSpan: number; // 그리드에서 차지할 열 개수
  rowSpan: number; // 그리드에서 차지할 행 개수
}

// ✅ 수정: Props 인터페이스에 더 구체적인 타입과 설명 추가
interface DynamicImageLayoutProps {
  config: ImageViewConfig; // 이미지 레이아웃 설정 객체
  showNumbers?: boolean; // 이미지에 순서 번호 표시 여부 (기본값: false)
  className?: string; // 추가 CSS 클래스명 (기본값: 빈 문자열)
  onImageClick?: (imageUrl: string, index: number) => void; // 이미지 클릭 핸들러 (선택사항)
  loadingPlaceholder?: string; // 이미지 로딩 실패 시 대체 이미지 URL (선택사항)
}

// ✅ 새로 추가: 기본 설정값들을 상수로 정의
// 이유: 매직 넘버를 피하고 재사용성과 유지보수성 향상
const DEFAULT_GRID_COLUMNS = 3; // 기본 그리드 열 개수
const DEFAULT_ROW_HEIGHT = 120; // 기본 행 높이 (px)
const MAX_COLUMNS = 6; // 최대 열 개수
const MIN_COLUMNS = 1; // 최소 열 개수

function DynamicImageLayout({
  config,
  showNumbers = false, // 기본값: 순서 번호 숨김
  className = '', // 기본값: 빈 클래스명
  onImageClick, // 선택사항: 이미지 클릭 핸들러
  loadingPlaceholder = 'https://via.placeholder.com/300x200?text=이미지+로드+실패', // 기본 대체 이미지
}: DynamicImageLayoutProps): React.ReactNode {
  // ✅ 수정: 매스너리 아이템 크기를 useMemo로 최적화
  // 이유: 컴포넌트 재렌더링 시마다 배열이 재생성되는 것을 방지
  const itemSizes = useMemo<ItemSize[]>(() => {
    return [
      { colSpan: 1, rowSpan: 1 }, // 작은 정사각형 - 기본 크기
      { colSpan: 1, rowSpan: 2 }, // 세로로 긴 직사각형 - 2배 높이
      { colSpan: 2, rowSpan: 1 }, // 가로로 긴 직사각형 - 2배 너비
      { colSpan: 2, rowSpan: 2 }, // 큰 정사각형 - 4배 크기
    ];
  }, []); // 의존성 배열이 비어있어 컴포넌트 마운트 시 한 번만 생성

  // ✅ 수정: 인덱스 기반 크기 할당 함수를 useCallback으로 최적화
  // 이유: 함수 재생성 방지 및 메모이제이션을 통한 성능 향상
  const getItemSize = useCallback(
    (index: number): ItemSize => {
      // 배열 범위 체크를 통한 안전성 확보
      if (index < 0 || !Number.isInteger(index)) {
        return itemSizes[0]; // 기본값: 작은 정사각형
      }

      // 매스너리 패턴: 규칙적인 크기 분배 알고리즘
      if (index % 6 === 0) return itemSizes[3] || itemSizes[0]; // 6의 배수: 큰 정사각형
      if (index % 5 === 0) return itemSizes[2] || itemSizes[0]; // 5의 배수: 가로 긴 직사각형
      if (index % 3 === 0) return itemSizes[1] || itemSizes[0]; // 3의 배수: 세로 긴 직사각형
      return itemSizes[0]; // 기본: 작은 정사각형
    },
    [itemSizes]
  ); // itemSizes가 변경될 때만 함수 재생성

  // ✅ 추가: 안전한 설정값 검증 및 기본값 적용
  // 이유: 잘못된 config 값으로 인한 렌더링 오류 방지
  const safeConfig = useMemo<ImageViewConfig>(() => {
    // config가 없거나 null인 경우 기본값 반환
    if (!config) {
      return {
        selectedImages: [],
        clickOrder: [],
        layout: {
          columns: DEFAULT_GRID_COLUMNS,
          gridType: 'grid',
        },
        filter: 'available',
      };
    }

    // 각 필드에 대한 안전성 검증 및 기본값 적용
    const safeSelectedImages = Array.isArray(config.selectedImages)
      ? config.selectedImages.filter(
          (img) => typeof img === 'string' && img.trim().length > 0
        )
      : [];

    const safeClickOrder = Array.isArray(config.clickOrder)
      ? config.clickOrder.filter(
          (order) => typeof order === 'number' && order > 0
        )
      : [];

    const safeColumns = Math.max(
      MIN_COLUMNS,
      Math.min(MAX_COLUMNS, config.layout?.columns || DEFAULT_GRID_COLUMNS)
    );

    const safeGridType =
      config.layout?.gridType === 'masonry' ? 'masonry' : 'grid';

    return {
      selectedImages: safeSelectedImages,
      clickOrder: safeClickOrder,
      layout: {
        columns: safeColumns,
        gridType: safeGridType,
      },
      filter: config.filter || 'available',
    };
  }, [config]); // config가 변경될 때만 재계산

  // ✅ 추가: 이미지 클릭 핸들러
  // 이유: 사용자 인터랙션 지원 및 접근성 향상
  const handleImageClick = useCallback(
    (imageUrl: string, index: number) => {
      // onImageClick 핸들러가 있고 함수인지 확인
      if (onImageClick && typeof onImageClick === 'function') {
        try {
          onImageClick(imageUrl, index);
        } catch (error) {
          console.error('이미지 클릭 핸들러 실행 중 오류:', error);
        }
      }
    },
    [onImageClick]
  );

  // ✅ 추가: 이미지 로드 에러 핸들러
  // 이유: 이미지 로드 실패 시 대체 이미지 표시
  const handleImageError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const imgElement = event.currentTarget;
      if (imgElement && loadingPlaceholder) {
        imgElement.src = loadingPlaceholder;
        imgElement.alt = '이미지를 불러올 수 없습니다';
      }
    },
    [loadingPlaceholder]
  );

  // ✅ 수정: 빈 이미지 배열에 대한 더 나은 처리
  // 이유: 사용자에게 명확한 피드백 제공
  if (!safeConfig.selectedImages || safeConfig.selectedImages.length === 0) {
    return (
      <div className={`my-8 not-prose ${className}`}>
        <div className="p-8 text-center border rounded-lg bg-default-100 border-default-200">
          <div className="mb-3 text-4xl" role="img" aria-label="이미지 없음">
            📷
          </div>
          <h3 className="mb-2 text-lg font-medium text-default-600">
            표시할 이미지가 없습니다
          </h3>
          <p className="text-sm text-default-500">
            이미지 뷰 빌더에서 이미지를 선택한 후 "해당 뷰로 추가" 버튼을
            클릭하세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`my-8 not-prose ${className}`}
      role="region"
      aria-label="이미지 갤러리"
    >
      {/* ✅ 수정: 모든 헤더 섹션, 타이틀, 갤러리 정보 완전 삭제 */}
      {/* 이유: 사용자 요청에 따라 순수하게 이미지 그리드만 표시 */}

      {/* ✅ 수정: 그리드 컨테이너 접근성 및 안전성 개선 */}
      <div
        className="grid gap-4"
        style={{
          // CSS Grid 템플릿 열 정의: 지정된 열 개수만큼 동일한 너비로 분할
          gridTemplateColumns: `repeat(${safeConfig.layout.columns}, 1fr)`,
          // 자동 행 높이: 매스너리 레이아웃을 위한 기본 행 단위 높이
          gridAutoRows: `${DEFAULT_ROW_HEIGHT}px`,
        }}
        role="grid"
        aria-label="이미지 갤러리"
        aria-rowcount={Math.ceil(
          safeConfig.selectedImages.length / safeConfig.layout.columns
        )}
      >
        {safeConfig.selectedImages.map((imageUrl, index) => {
          // 조건부 크기 적용: 매스너리 vs 일반 그리드
          const { colSpan, rowSpan } =
            safeConfig.layout.gridType === 'masonry'
              ? getItemSize(index) // 매스너리: 다양한 크기
              : { colSpan: 1, rowSpan: 1 }; // 균등 그리드: 모든 아이템 동일 크기

          // 안전한 colSpan 계산: 최대 열 개수를 넘지 않도록 제한
          const safeColSpan = Math.min(colSpan, safeConfig.layout.columns);

          // 클릭 순서 번호 가져오기 (안전한 접근)
          const orderNumber = safeConfig.clickOrder[index];

          // 이미지 설명을 위한 alt 텍스트 생성
          const altText = `갤러리 이미지 ${index + 1}${
            orderNumber ? ` (순서: ${orderNumber}번째)` : ''
          }`;

          return (
            <div
              key={`gallery-image-${index}-${imageUrl.slice(-10)}`} // 고유한 key 생성
              className={`
                relative group overflow-hidden rounded-lg bg-default-100
                transition-all duration-300 hover:shadow-lg hover:scale-[1.02]
                ${onImageClick ? 'cursor-pointer' : ''}
              `}
              style={{
                // CSS Grid 아이템 배치 설정
                gridColumn: `span ${safeColSpan}`, // 차지할 열 개수
                gridRow: `span ${rowSpan}`, // 차지할 행 개수
                minHeight: `${DEFAULT_ROW_HEIGHT}px`, // 최소 높이 보장
              }}
              role="gridcell"
              aria-rowindex={Math.floor(index / safeConfig.layout.columns) + 1}
              aria-colindex={(index % safeConfig.layout.columns) + 1}
              tabIndex={onImageClick ? 0 : -1} // 클릭 가능한 경우만 탭 인덱스 설정
              onClick={() => handleImageClick(imageUrl, index)}
              onKeyDown={(e) => {
                // 키보드 접근성: Enter 또는 Space 키로 클릭 동작 수행
                if ((e.key === 'Enter' || e.key === ' ') && onImageClick) {
                  e.preventDefault();
                  handleImageClick(imageUrl, index);
                }
              }}
              aria-label={onImageClick ? `${altText} - 클릭하여 확대` : altText}
            >
              {/* ✅ 수정: 이미지 요소 접근성 및 에러 처리 개선 */}
              <img
                src={imageUrl || loadingPlaceholder} // URL이 없으면 대체 이미지 사용
                alt={altText}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                loading="lazy" // 지연 로딩으로 성능 최적화
                onError={handleImageError} // 이미지 로드 실패 시 처리
                draggable={false} // 드래그 방지
                onContextMenu={(e) => e.preventDefault()} // 우클릭 방지 (선택사항)
              />

              {/* ✅ 수정: 순서 번호 표시 접근성 개선 */}
              {showNumbers && orderNumber && (
                <div className="absolute z-10 top-2 left-2">
                  <div
                    className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white border-2 border-white rounded-full shadow-lg bg-primary"
                    role="img"
                    aria-label={`순서: ${orderNumber}번째`}
                  >
                    {orderNumber}
                  </div>
                </div>
              )}

              {/* ✅ 수정: 호버 오버레이 효과 개선 */}
              <div className="absolute inset-0 transition-all duration-300 bg-black bg-opacity-0 pointer-events-none group-hover:bg-opacity-20">
                {/* 클릭 가능한 경우 호버 시 아이콘 표시 */}
                {onImageClick && (
                  <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                    <div className="p-2 bg-white rounded-full shadow-lg bg-opacity-90">
                      <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ 수정: 갤러리 정보 표시 영역 완전 삭제 */}
      {/* 이유: 사용자 요청에 따라 모든 갤러리 정보 및 메타데이터 제거 */}
    </div>
  );
}

export default DynamicImageLayout;
//====여기까지 수정됨====
