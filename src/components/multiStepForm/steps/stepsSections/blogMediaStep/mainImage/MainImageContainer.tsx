// blogMediaStep/mainImage/MainImageContainer.tsx

import React from 'react';
import { useMainImageManagement } from './hooks/useMainImageManagement';
import { useMainImageValidation } from './hooks/useMainImageValidation';
import MainImageSetButton from './parts/MainImageSetButton';
import MainImageCancelButton from './parts/MainImageCancelButton';
import MainImageIndicator from './parts/MainImageIndicator';

interface MainImageContainerProps {
  imageUrl: string;
  imageIndex: number;
  renderMode?: 'buttons' | 'indicator' | 'both';
  showInactive?: boolean;
  className?: string;
}

function MainImageContainer({
  imageUrl,
  imageIndex,
  renderMode = 'both',
  showInactive = true,
  className = '',
}: MainImageContainerProps): React.ReactNode {
  console.log('🔧 MainImageContainer 렌더링:', {
    imageIndex,
    renderMode,
    imageUrl: imageUrl.slice(0, 30) + '...',
  });

  const { setAsMainImageDirect, cancelMainImage, isMainImage } =
    useMainImageManagement();

  const { canSetAsMainImage, validateMainImageSelection } =
    useMainImageValidation();

  const isMain = isMainImage(imageUrl);
  const canSet = canSetAsMainImage(imageUrl);

  console.log('📊 MainImageContainer 상태:', {
    isMain,
    canSet,
    imageIndex,
  });

  const handleSetAsMainImage = () => {
    console.log('🔧 MainImageContainer handleSetAsMainImage:', { imageIndex });

    const validation = validateMainImageSelection(imageUrl);
    if (!validation.isValid) {
      console.log('❌ 메인 이미지 설정 불가:', validation.message);
      return;
    }

    setAsMainImageDirect(imageIndex);
  };

  const handleCancelMainImage = () => {
    console.log('🔧 MainImageContainer handleCancelMainImage');
    cancelMainImage();
  };

  const shouldShowSetButton =
    (renderMode === 'buttons' || renderMode === 'both') &&
    (showInactive || canSet) &&
    !isMain;

  const shouldShowCancelButton =
    (renderMode === 'buttons' || renderMode === 'both') && isMain;

  const shouldShowIndicator =
    (renderMode === 'indicator' || renderMode === 'both') && isMain;

  console.log('🎨 MainImageContainer 표시 옵션:', {
    shouldShowSetButton,
    shouldShowCancelButton,
    shouldShowIndicator,
  });

  return (
    <div className={`relative ${className}`}>
      {shouldShowIndicator && (
        <MainImageIndicator
          isMainImage={true}
          position="top-right"
          size="md"
          showLabel={false}
        />
      )}

      <div className="flex items-center gap-1">
        {shouldShowSetButton && (
          <MainImageSetButton
            imageIndex={imageIndex}
            onSetAsMainImage={handleSetAsMainImage}
            isDisabled={!canSet}
            tooltipText={canSet ? '메인 이미지로 설정' : '설정할 수 없음'}
          />
        )}

        {shouldShowCancelButton && (
          <MainImageCancelButton
            onCancelMainImage={handleCancelMainImage}
            tooltipText="메인 이미지 해제"
            confirmBeforeCancel={false}
          />
        )}

        {isMain && renderMode === 'both' && (
          <div className="flex items-center gap-1">
            <MainImageSetButton
              imageIndex={imageIndex}
              onSetAsMainImage={() => {}}
              isDisabled={true}
              tooltipText="현재 메인 이미지"
              color="primary"
              variant="light"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default MainImageContainer;
