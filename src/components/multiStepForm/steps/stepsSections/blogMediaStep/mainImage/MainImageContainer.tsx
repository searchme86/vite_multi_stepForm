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
  imageUrl: targetImageUrl,
  imageIndex: targetImageIndex,
  renderMode: displayRenderMode = 'both',
  showInactive: shouldShowInactiveButtons = true,
  className: additionalCssClasses = '',
}: MainImageContainerProps): React.ReactNode {
  console.log('🚀 MainImageContainer 렌더링 시작:', {
    targetImageIndex,
    displayRenderMode,
    imageUrlPreview: targetImageUrl.slice(0, 30) + '...',
    shouldShowInactiveButtons,
    hasAdditionalClasses: additionalCssClasses ? true : false,
    timestamp: new Date().toLocaleTimeString(),
  });

  const mainImageManagementHook = useMainImageManagement();
  const {
    setAsMainImageDirect: setImageAsMainDirectly,
    cancelMainImage: cancelCurrentMainImage,
    isMainImage: checkIsMainImageFunction,
  } = mainImageManagementHook;

  const mainImageValidationHook = useMainImageValidation();
  const {
    canSetAsMainImage: checkCanSetAsMainImageFunction,
    validateMainImageSelection: validateMainImageSelectionFunction,
  } = mainImageValidationHook;

  console.log('📊 MainImage 훅 초기화 완료:', {
    hasManagementHook: mainImageManagementHook ? true : false,
    hasValidationHook: mainImageValidationHook ? true : false,
    timestamp: new Date().toLocaleTimeString(),
  });

  const isCurrentMainImage = checkIsMainImageFunction(targetImageUrl);
  const canSetAsMainImage = checkCanSetAsMainImageFunction(targetImageUrl);

  console.log('📊 MainImageContainer 현재 상태:', {
    isCurrentMainImage,
    canSetAsMainImage,
    targetImageIndex,
    displayRenderMode,
    timestamp: new Date().toLocaleTimeString(),
  });

  const handleSetImageAsMainDirectly = () => {
    console.log('🔧 handleSetImageAsMainDirectly 호출:', {
      targetImageIndex,
      targetImageUrl: targetImageUrl.slice(0, 30) + '...',
    });

    const validationResult = validateMainImageSelectionFunction(targetImageUrl);
    const { isValid: isValidSelection, message: validationMessage } =
      validationResult;

    if (!isValidSelection) {
      console.log('❌ 메인 이미지 설정 불가능:', {
        validationMessage,
        targetImageIndex,
      });
      return;
    }

    setImageAsMainDirectly(targetImageIndex);

    console.log('✅ 메인 이미지 설정 완료:', {
      targetImageIndex,
      targetImageUrl: targetImageUrl.slice(0, 30) + '...',
    });
  };

  const handleCancelCurrentMainImage = () => {
    console.log('🔧 handleCancelCurrentMainImage 호출:', {
      currentMainImageUrl: targetImageUrl.slice(0, 30) + '...',
      targetImageIndex,
    });

    cancelCurrentMainImage();

    console.log('✅ 메인 이미지 취소 완료:', {
      previousMainImageIndex: targetImageIndex,
    });
  };

  const checkShouldShowSetButton = (): boolean => {
    const isButtonsMode = displayRenderMode === 'buttons';
    const isBothMode = displayRenderMode === 'both';
    const isModeValid = isButtonsMode || isBothMode;

    const shouldShowInactive = shouldShowInactiveButtons || canSetAsMainImage;
    const isNotCurrentMain = !isCurrentMainImage;

    const shouldShow = isModeValid && shouldShowInactive && isNotCurrentMain;

    console.log('🔍 checkShouldShowSetButton:', {
      isButtonsMode,
      isBothMode,
      isModeValid,
      shouldShowInactive,
      isNotCurrentMain,
      shouldShow,
    });

    return shouldShow;
  };

  const checkShouldShowCancelButton = (): boolean => {
    const isButtonsMode = displayRenderMode === 'buttons';
    const isBothMode = displayRenderMode === 'both';
    const isModeValid = isButtonsMode || isBothMode;

    const shouldShow = isModeValid && isCurrentMainImage;

    console.log('🔍 checkShouldShowCancelButton:', {
      isButtonsMode,
      isBothMode,
      isModeValid,
      isCurrentMainImage,
      shouldShow,
    });

    return shouldShow;
  };

  const checkShouldShowIndicator = (): boolean => {
    const isIndicatorMode = displayRenderMode === 'indicator';
    const isBothMode = displayRenderMode === 'both';
    const isModeValid = isIndicatorMode || isBothMode;

    const shouldShow = isModeValid && isCurrentMainImage;

    console.log('🔍 checkShouldShowIndicator:', {
      isIndicatorMode,
      isBothMode,
      isModeValid,
      isCurrentMainImage,
      shouldShow,
    });

    return shouldShow;
  };

  const checkShouldShowCurrentStatusButton = (): boolean => {
    const isBothMode = displayRenderMode === 'both';
    const shouldShow = isCurrentMainImage && isBothMode;

    console.log('🔍 checkShouldShowCurrentStatusButton:', {
      isBothMode,
      isCurrentMainImage,
      shouldShow,
    });

    return shouldShow;
  };

  const shouldShowSetButton = checkShouldShowSetButton();
  const shouldShowCancelButton = checkShouldShowCancelButton();
  const shouldShowIndicator = checkShouldShowIndicator();
  const shouldShowCurrentStatusButton = checkShouldShowCurrentStatusButton();

  console.log('🎨 MainImageContainer 표시 옵션 계산 완료:', {
    shouldShowSetButton,
    shouldShowCancelButton,
    shouldShowIndicator,
    shouldShowCurrentStatusButton,
    timestamp: new Date().toLocaleTimeString(),
  });

  const renderMainImageIndicator = () => {
    console.log('🔄 renderMainImageIndicator 호출:', {
      shouldShowIndicator,
      isCurrentMainImage,
    });

    return shouldShowIndicator ? (
      <MainImageIndicator
        isMainImage={true}
        position="top-right"
        size="md"
        showLabel={false}
      />
    ) : null;
  };

  const renderMainImageSetButton = () => {
    console.log('🔄 renderMainImageSetButton 호출:', {
      shouldShowSetButton,
      canSetAsMainImage,
      targetImageIndex,
    });

    return shouldShowSetButton ? (
      <MainImageSetButton
        imageIndex={targetImageIndex}
        onSetAsMainImage={handleSetImageAsMainDirectly}
        isDisabled={!canSetAsMainImage}
        tooltipText={
          canSetAsMainImage ? '메인 이미지로 설정' : '설정할 수 없음'
        }
      />
    ) : null;
  };

  const renderMainImageCancelButton = () => {
    console.log('🔄 renderMainImageCancelButton 호출:', {
      shouldShowCancelButton,
      isCurrentMainImage,
    });

    return shouldShowCancelButton ? (
      <MainImageCancelButton
        onCancelMainImage={handleCancelCurrentMainImage}
        tooltipText="메인 이미지 해제"
        confirmBeforeCancel={false}
      />
    ) : null;
  };

  const renderCurrentMainImageStatusButton = () => {
    console.log('🔄 renderCurrentMainImageStatusButton 호출:', {
      shouldShowCurrentStatusButton,
      isCurrentMainImage,
      displayRenderMode,
    });

    return shouldShowCurrentStatusButton ? (
      <div className="flex items-center gap-1">
        <MainImageSetButton
          imageIndex={targetImageIndex}
          onSetAsMainImage={() => {
            console.log('🔧 현재 메인 이미지 상태 버튼 클릭 (비활성)');
          }}
          isDisabled={true}
          tooltipText="현재 메인 이미지"
          color="primary"
          variant="light"
        />
      </div>
    ) : null;
  };

  const combinedCssClasses = `relative ${additionalCssClasses}`.trim();

  console.log('🎨 MainImageContainer 최종 렌더링 준비:', {
    combinedCssClasses,
    hasIndicator: shouldShowIndicator,
    hasSetButton: shouldShowSetButton,
    hasCancelButton: shouldShowCancelButton,
    hasStatusButton: shouldShowCurrentStatusButton,
    timestamp: new Date().toLocaleTimeString(),
  });

  return (
    <section
      className={combinedCssClasses}
      role="region"
      aria-labelledby="main-image-management-section-title"
      aria-describedby="main-image-management-section-description"
    >
      <div className="sr-only">
        <h3 id="main-image-management-section-title">
          메인 이미지 관리 컨트롤
        </h3>
        <p id="main-image-management-section-description">
          이미지를 메인 이미지로 설정하거나 해제할 수 있습니다.
        </p>
      </div>

      {renderMainImageIndicator()}

      <div
        className="flex items-center gap-1"
        role="group"
        aria-label="메인 이미지 관리 버튼"
      >
        {renderMainImageSetButton()}

        {renderMainImageCancelButton()}

        {renderCurrentMainImageStatusButton()}
      </div>
    </section>
  );
}

export default MainImageContainer;
