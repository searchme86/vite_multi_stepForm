// blogMediaStep/imageGallery/hooks/layout/useDynamicLayout.ts - ImageGallery 컴포넌트

import { useCallback, useMemo } from 'react';
import {
  createSafeImageViewConfig,
  generateGridStyles,
  generateImageAltText,
  ImageViewConfig,
  // } from '../utils/layoutUtils';
} from '../../utils/layoutUtils.ts';

export interface DynamicLayoutResult {
  safeConfig: ImageViewConfig;
  gridStyles: { gridTemplateColumns: string; gridAutoRows: string };
  handleImageClick: (imageUrl: string, index: number) => void;
  handleImageError: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  handleKeyDown: (
    event: React.KeyboardEvent,
    imageUrl: string,
    index: number
  ) => void;
  generateAltText: (index: number, orderNumber?: number) => string;
  isEmpty: boolean;
}

export interface DynamicLayoutProps {
  config: Partial<ImageViewConfig>;
  onImageClick?: (imageUrl: string, index: number) => void;
  loadingPlaceholder?: string;
}

export const useDynamicLayout = ({
  config,
  onImageClick,
  loadingPlaceholder = 'https://via.placeholder.com/300x200?text=이미지+로드+실패',
}: DynamicLayoutProps): DynamicLayoutResult => {
  console.log('🔧 useDynamicLayout 훅 초기화:', {
    hasConfig: !!config,
    hasOnImageClick: !!onImageClick,
  });

  const safeConfig = useMemo(() => {
    console.log('🔧 safeConfig 메모이제이션 계산');

    const safe = createSafeImageViewConfig(config);

    console.log('✅ safeConfig 결과:', {
      selectedCount: safe.selectedImages.length,
      columns: safe.layout.columns,
      gridType: safe.layout.gridType,
    });

    return safe;
  }, [config]);

  const gridStyles = useMemo(() => {
    console.log('🔧 gridStyles 메모이제이션 계산');

    const styles = generateGridStyles(safeConfig.layout.columns);

    console.log('✅ gridStyles 결과:', styles);
    return styles;
  }, [safeConfig.layout.columns]);

  const isEmpty = useMemo(() => {
    const empty =
      !safeConfig.selectedImages || safeConfig.selectedImages.length === 0;

    console.log('🔧 isEmpty 계산:', {
      empty,
      imageCount: safeConfig.selectedImages.length,
    });
    return empty;
  }, [safeConfig.selectedImages]);

  const handleImageClick = useCallback(
    (imageUrl: string, index: number) => {
      console.log('🔧 handleImageClick 호출:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
        index,
      });

      if (onImageClick && typeof onImageClick === 'function') {
        try {
          onImageClick(imageUrl, index);
          console.log('✅ handleImageClick 성공');
        } catch (error) {
          console.error('❌ 이미지 클릭 핸들러 실행 중 오류:', error);
        }
      } else {
        console.log('⚠️ onImageClick 핸들러가 없거나 함수가 아님');
      }
    },
    [onImageClick]
  );

  const handleImageError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      console.log('🔧 handleImageError 호출');

      const imgElement = event.currentTarget;
      if (imgElement && loadingPlaceholder) {
        imgElement.src = loadingPlaceholder;
        imgElement.alt = '이미지를 불러올 수 없습니다';
        console.log('✅ handleImageError 대체 이미지 설정 완료');
      }
    },
    [loadingPlaceholder]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, imageUrl: string, index: number) => {
      console.log('🔧 handleKeyDown 호출:', {
        key: event.key,
        index,
      });

      if ((event.key === 'Enter' || event.key === ' ') && onImageClick) {
        event.preventDefault();
        handleImageClick(imageUrl, index);
        console.log('✅ handleKeyDown 키보드 클릭 처리 완료');
      }
    },
    [onImageClick, handleImageClick]
  );

  const generateAltText = useCallback(
    (index: number, orderNumber?: number): string => {
      console.log('🔧 generateAltText 호출:', { index, orderNumber });

      const altText = generateImageAltText(index, orderNumber);

      console.log('✅ generateAltText 결과:', { altText });
      return altText;
    },
    []
  );

  console.log('✅ useDynamicLayout 초기화 완료:', {
    isEmpty,
    columns: safeConfig.layout.columns,
    gridType: safeConfig.layout.gridType,
    imageCount: safeConfig.selectedImages.length,
    timestamp: new Date().toLocaleTimeString(),
  });

  return {
    safeConfig,
    gridStyles,
    handleImageClick,
    handleImageError,
    handleKeyDown,
    generateAltText,
    isEmpty,
  };
};
