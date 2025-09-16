// blogMediaStep/imageGallery/parts/layout/DynamicLayoutRenderer.tsx - ImageGallery 컴포넌트

import React from 'react';
import { useDynamicLayout } from '../../hooks/layout/useDynamicLayout';
import { useLayoutItemSize } from '../../hooks/layout/useLayoutItemSize';
import { ImageViewConfig } from '../../utils/layoutUtils';

interface DynamicLayoutRendererProps {
  config: ImageViewConfig;
  showNumbers?: boolean;
  className?: string;
  onImageClick?: (imageUrl: string, index: number) => void;
  loadingPlaceholder?: string;
}

function DynamicLayoutRenderer({
  config,
  showNumbers = false,
  className = '',
  onImageClick,
  loadingPlaceholder = 'https://via.placeholder.com/300x200?text=이미지+로드+실패',
}: DynamicLayoutRendererProps): React.ReactNode {
  console.log('🔧 DynamicLayoutRenderer 렌더링 시작:', {
    selectedImageCount: config?.selectedImages?.length || 0,
    showNumbers,
    hasOnImageClick: !!onImageClick,
  });

  const dynamicLayout = useDynamicLayout({
    config,
    onImageClick,
    loadingPlaceholder,
  });

  const layoutItemSize = useLayoutItemSize();

  if (dynamicLayout.isEmpty) {
    console.log('📷 DynamicLayoutRenderer 빈 상태 렌더링');

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

  console.log('🎨 DynamicLayoutRenderer 그리드 렌더링:', {
    imageCount: dynamicLayout.safeConfig.selectedImages.length,
    columns: dynamicLayout.safeConfig.layout.columns,
    gridType: dynamicLayout.safeConfig.layout.gridType,
  });

  return (
    <div
      className={`my-8 not-prose ${className}`}
      role="region"
      aria-label="이미지 갤러리"
    >
      <div
        className="grid gap-4"
        style={dynamicLayout.gridStyles}
        role="grid"
        aria-label="이미지 갤러리"
        aria-rowcount={Math.ceil(
          dynamicLayout.safeConfig.selectedImages.length /
            dynamicLayout.safeConfig.layout.columns
        )}
      >
        {dynamicLayout.safeConfig.selectedImages.map((imageUrl, index) => {
          const orderNumber = dynamicLayout.safeConfig.clickOrder[index];
          const altText = dynamicLayout.generateAltText(index, orderNumber);

          const itemStyles = layoutItemSize.getItemStyles(
            index,
            dynamicLayout.safeConfig.layout.gridType || 'grid',
            dynamicLayout.safeConfig.layout.columns
          );

          console.log('🖼️ 이미지 아이템 렌더링:', {
            index,
            imageUrl: imageUrl.slice(0, 30) + '...',
            orderNumber,
            itemStyles,
          });

          return (
            <div
              key={`gallery-image-${index}-${imageUrl.slice(-10)}`}
              className={`
                relative group overflow-hidden rounded-lg bg-default-100
                transition-all duration-300 hover:shadow-lg hover:scale-[1.02]
                ${onImageClick ? 'cursor-pointer' : ''}
              `}
              style={{
                gridColumn: itemStyles.gridColumn,
                gridRow: itemStyles.gridRow,
                minHeight: '120px',
              }}
              role="gridcell"
              aria-rowindex={
                Math.floor(index / dynamicLayout.safeConfig.layout.columns) + 1
              }
              aria-colindex={
                (index % dynamicLayout.safeConfig.layout.columns) + 1
              }
              tabIndex={onImageClick ? 0 : -1}
              onClick={() => dynamicLayout.handleImageClick(imageUrl, index)}
              onKeyDown={(e) => dynamicLayout.handleKeyDown(e, imageUrl, index)}
              aria-label={onImageClick ? `${altText} - 클릭하여 확대` : altText}
            >
              <img
                src={imageUrl || loadingPlaceholder}
                alt={altText}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={dynamicLayout.handleImageError}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />

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

              <div className="absolute inset-0 transition-all duration-300 bg-black bg-opacity-0 pointer-events-none group-hover:bg-opacity-20">
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
    </div>
  );
}

export default DynamicLayoutRenderer;
