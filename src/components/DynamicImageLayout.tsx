import React, { useMemo } from 'react';

interface ImageViewConfig {
  selectedImages: string[];
  clickOrder: number[];
  layout: {
    columns: number;
    spacing: 'small' | 'medium' | 'large';
    gridType?: 'grid' | 'masonry' | 'list';
  };
  filter: string;
}

interface DynamicImageLayoutProps {
  config: ImageViewConfig;
  showNumbers?: boolean;
  className?: string;
}

function DynamicImageLayout({
  config,
  showNumbers = false,
  className = '',
}: DynamicImageLayoutProps) {
  // 간격 클래스 매핑
  const spacingClass = useMemo(() => {
    switch (config.layout.spacing) {
      case 'small':
        return 'gap-2';
      case 'medium':
        return 'gap-4';
      case 'large':
        return 'gap-6';
      default:
        return 'gap-4';
    }
  }, [config.layout.spacing]);

  // 선택된 이미지가 없는 경우
  if (!config.selectedImages || config.selectedImages.length === 0) {
    return null;
  }

  return (
    <div className={`my-8 not-prose ${className}`}>
      <h3 className="mb-4 text-xl font-bold">사용자 정의 이미지 갤러리</h3>
      <div
        className={`grid ${spacingClass}`}
        style={{
          gridTemplateColumns: `repeat(${config.layout.columns}, 1fr)`,
        }}
      >
        {config.selectedImages.map((imageUrl, index) => (
          <div
            key={index}
            className="relative group overflow-hidden rounded-lg bg-default-100 aspect-square"
          >
            <img
              src={imageUrl}
              alt={`갤러리 이미지 ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />

            {/* 순서 번호 표시 (옵션) */}
            {showNumbers && config.clickOrder[index] && (
              <div className="absolute top-2 left-2">
                <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                  {config.clickOrder[index]}
                </div>
              </div>
            )}

            {/* 호버 효과 */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
          </div>
        ))}
      </div>

      {/* 이미지 개수 및 레이아웃 정보 */}
      <div className="mt-4 text-sm text-default-500 flex items-center gap-4">
        <span>{config.selectedImages.length}개 이미지</span>
        <span>•</span>
        <span>{config.layout.columns}열 그리드</span>
        <span>•</span>
        <span>
          {config.layout.spacing === 'small'
            ? '좁은'
            : config.layout.spacing === 'medium'
            ? '보통'
            : '넓은'}{' '}
          간격
        </span>
      </div>
    </div>
  );
}

export default DynamicImageLayout;
