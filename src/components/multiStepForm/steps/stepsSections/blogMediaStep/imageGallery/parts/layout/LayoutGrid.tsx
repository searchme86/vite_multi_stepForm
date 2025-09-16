// blogMediaStep/imageGallery/parts/layout/LayoutGrid.tsx - ImageGallery 컴포넌트

import React from 'react';
import { useDynamicLayout } from '../../hooks/layout/useDynamicLayout';
import { ImageViewConfig } from '../../utils/layoutUtils';

interface LayoutGridProps {
  config: ImageViewConfig;
  showNumbers?: boolean;
  className?: string;
  onImageClick?: (imageUrl: string, index: number) => void;
  loadingPlaceholder?: string;
}

function LayoutGrid({
  config,
  showNumbers = false,
  className = '',
  onImageClick,
  loadingPlaceholder = 'https://via.placeholder.com/300x200?text=이미지+로드+실패',
}: LayoutGridProps): React.ReactNode {
  console.log('🔧 LayoutGrid 렌더링 시작:', {
    selectedImageCount: config?.selectedImages?.length || 0,
    columns: config?.layout?.columns || 3,
    showNumbers,
  });

  const dynamicLayout = useDynamicLayout({
    config,
    onImageClick,
    loadingPlaceholder,
  });

  if (dynamicLayout.isEmpty) {
    console.log('📷 LayoutGrid 빈 상태');
    return null;
  }

  console.log('🎨 LayoutGrid 균등 그리드 렌더링:', {
    imageCount: dynamicLayout.safeConfig.selectedImages.length,
    columns: dynamicLayout.safeConfig.layout.columns,
  });

  return (
    <div
      className={`grid gap-4 ${className}`}
      style={dynamicLayout.gridStyles}
      role="grid"
      aria-label="균등 그리드 이미지 갤러리"
    >
      {dynamicLayout.safeConfig.selectedImages.map((imageUrl, index) => {
        const orderNumber = dynamicLayout.safeConfig.clickOrder[index];
        const altText = dynamicLayout.generateAltText(index, orderNumber);

        console.log('🖼️ LayoutGrid 이미지 아이템:', {
          index,
          imageUrl: imageUrl.slice(0, 30) + '...',
          orderNumber,
        });

        return (
          <div
            key={`grid-image-${index}-${imageUrl.slice(-10)}`}
            className={`
              relative group overflow-hidden rounded-lg bg-default-100
              transition-all duration-300 hover:shadow-lg hover:scale-[1.02]
              ${onImageClick ? 'cursor-pointer' : ''}
            `}
            style={{
              gridColumn: 'span 1',
              gridRow: 'span 1',
              minHeight: '120px',
            }}
            role="gridcell"
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
  );
}

export default LayoutGrid;
