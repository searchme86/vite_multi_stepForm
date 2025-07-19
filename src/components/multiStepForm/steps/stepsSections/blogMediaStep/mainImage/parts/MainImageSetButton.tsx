// blogMediaStep/mainImage/parts/MainImageSetButton.tsx

import React, { useCallback } from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useFormContext } from 'react-hook-form';
import { useMultiStepFormStore } from '../../../../../store/multiStepForm/multiStepFormStore';
import type { FormValues } from '../../../../../../../store/shared/commonTypes';

interface MainImageSetButtonProps {
  imageIndex: number;
  onSetAsMainImage: (index: number) => void;
  isDisabled?: boolean;
  tooltipText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?:
    | 'solid'
    | 'flat'
    | 'light'
    | 'bordered'
    | 'faded'
    | 'shadow'
    | 'ghost';
  color?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'default';
}

function MainImageSetButton({
  imageIndex,
  onSetAsMainImage,
  isDisabled = false,
  tooltipText = '메인 이미지로 설정',
  size = 'sm',
  variant = 'light',
  color = 'default',
}: MainImageSetButtonProps): React.ReactNode {
  console.log(
    '🔧 [MAIN_IMAGE_SET_BUTTON] MainImageSetButton 렌더링 - 스토어 연동 강화 버전:',
    {
      imageIndex,
      isDisabled,
      hasOnSetAsMainImage: !!onSetAsMainImage,
      storeIntegrationEnhanced: true,
      timestamp: new Date().toLocaleTimeString(),
    }
  );

  // 🚨 핵심 추가: 스토어 연동 강화를 위한 훅들
  const formContext = useFormContext<FormValues>();
  const { getValues } = formContext;
  const multiStepFormStore = useMultiStepFormStore();

  // 🚨 추가: 현재 미디어 목록에서 이미지 URL 가져오기
  const getCurrentImageUrl = useCallback((): string => {
    try {
      const currentFormValues = getValues();
      const { media: currentMediaArray } = currentFormValues;

      const isValidMediaArray = Array.isArray(currentMediaArray);
      if (!isValidMediaArray) {
        console.warn('⚠️ [MAIN_IMAGE_SET_BUTTON] 미디어 배열이 유효하지 않음');
        return '';
      }

      const isValidImageIndex =
        imageIndex >= 0 && imageIndex < currentMediaArray.length;
      if (!isValidImageIndex) {
        console.warn(
          '⚠️ [MAIN_IMAGE_SET_BUTTON] 유효하지 않은 이미지 인덱스:',
          {
            imageIndex,
            mediaArrayLength: currentMediaArray.length,
          }
        );
        return '';
      }

      const targetImageUrl = currentMediaArray[imageIndex];
      const isValidImageUrl =
        typeof targetImageUrl === 'string' && targetImageUrl.length > 0;

      if (!isValidImageUrl) {
        console.warn('⚠️ [MAIN_IMAGE_SET_BUTTON] 유효하지 않은 이미지 URL:', {
          imageIndex,
          targetImageUrl,
        });
        return '';
      }

      console.log('✅ [MAIN_IMAGE_SET_BUTTON] 현재 이미지 URL 가져오기 성공:', {
        imageIndex,
        imageUrlPreview: targetImageUrl.slice(0, 30) + '...',
      });

      return targetImageUrl;
    } catch (getImageUrlError) {
      console.error('❌ [MAIN_IMAGE_SET_BUTTON] 이미지 URL 가져오기 실패:', {
        error: getImageUrlError,
        imageIndex,
      });
      return '';
    }
  }, [getValues, imageIndex]);

  // 🚨 추가: 스토어 연동 검증 함수
  const verifyStoreSync = useCallback(
    (targetImageUrl: string) => {
      console.log('🔍 [MAIN_IMAGE_SET_BUTTON] 스토어 동기화 검증 시작:', {
        targetImageUrl: targetImageUrl
          ? targetImageUrl.slice(0, 30) + '...'
          : 'none',
      });

      try {
        // React Hook Form 상태 확인
        const currentFormValues = getValues();
        const formMainImage = currentFormValues.mainImage ?? '';

        // multiStepFormStore 상태 확인
        const currentStoreValues = multiStepFormStore.getFormValues();
        const storeMainImage = currentStoreValues.mainImage ?? '';

        const isFormSynced = formMainImage === targetImageUrl;
        const isStoreSynced = storeMainImage === targetImageUrl;
        const areBothStoresSynced = isFormSynced && isStoreSynced;

        console.log('📊 [MAIN_IMAGE_SET_BUTTON] 스토어 동기화 상태:', {
          targetImageUrl: targetImageUrl.slice(0, 30) + '...',
          formMainImage: formMainImage
            ? formMainImage.slice(0, 30) + '...'
            : 'none',
          storeMainImage: storeMainImage
            ? storeMainImage.slice(0, 30) + '...'
            : 'none',
          isFormSynced,
          isStoreSynced,
          areBothStoresSynced,
          syncVerificationComplete: true,
        });

        return {
          isFormSynced,
          isStoreSynced,
          areBothStoresSynced,
        };
      } catch (verificationError) {
        console.error('❌ [MAIN_IMAGE_SET_BUTTON] 스토어 동기화 검증 실패:', {
          error: verificationError,
          targetImageUrl,
        });

        return {
          isFormSynced: false,
          isStoreSynced: false,
          areBothStoresSynced: false,
        };
      }
    },
    [getValues, multiStepFormStore]
  );

  // 🚨 강화된 클릭 핸들러
  const handleClick = useCallback(() => {
    const currentTimestamp = new Date().toLocaleTimeString();

    console.log(
      '🔧 [MAIN_IMAGE_SET_BUTTON] MainImageSetButton 클릭 - 스토어 연동 강화:',
      {
        imageIndex,
        isDisabled,
        hasOnSetAsMainImage: !!onSetAsMainImage,
        timestamp: currentTimestamp,
      }
    );

    // 비활성화 상태 확인
    if (isDisabled) {
      console.warn(
        '⚠️ [MAIN_IMAGE_SET_BUTTON] 버튼이 비활성화 상태로 클릭 무시'
      );
      return;
    }

    // 핸들러 함수 유효성 확인
    const isValidHandler =
      onSetAsMainImage && typeof onSetAsMainImage === 'function';
    if (!isValidHandler) {
      console.error(
        '❌ [MAIN_IMAGE_SET_BUTTON] onSetAsMainImage 핸들러가 유효하지 않음:',
        {
          hasHandler: !!onSetAsMainImage,
          handlerType: typeof onSetAsMainImage,
        }
      );
      return;
    }

    // 현재 이미지 URL 가져오기
    const currentImageUrl = getCurrentImageUrl();
    const hasValidImageUrl = currentImageUrl.length > 0;

    if (!hasValidImageUrl) {
      console.error(
        '❌ [MAIN_IMAGE_SET_BUTTON] 유효한 이미지 URL을 가져올 수 없음:',
        {
          imageIndex,
          currentImageUrl,
        }
      );
      return;
    }

    console.log(
      '✅ [MAIN_IMAGE_SET_BUTTON] 메인 이미지 설정 호출 전 검증 완료:',
      {
        imageIndex,
        imageUrlPreview: currentImageUrl.slice(0, 30) + '...',
        handlerValid: true,
        readyToExecute: true,
      }
    );

    // 기존 핸들러 호출
    onSetAsMainImage(imageIndex);

    // 설정 후 잠시 뒤 동기화 상태 검증 (비동기 처리 고려)
    setTimeout(() => {
      const syncStatus = verifyStoreSync(currentImageUrl);

      if (!syncStatus.areBothStoresSynced) {
        console.warn('⚠️ [MAIN_IMAGE_SET_BUTTON] 스토어 동기화 불완전 감지:', {
          imageIndex,
          syncStatus,
          retryRecommended: true,
        });
      } else {
        console.log('✅ [MAIN_IMAGE_SET_BUTTON] 스토어 동기화 검증 성공:', {
          imageIndex,
          imageUrlPreview: currentImageUrl.slice(0, 30) + '...',
          allStoresSynced: true,
        });
      }
    }, 200); // 200ms 후 검증
  }, [
    imageIndex,
    isDisabled,
    onSetAsMainImage,
    getCurrentImageUrl,
    verifyStoreSync,
  ]);

  // 🚨 추가: 버튼 상태 최종 검증
  const buttonStateValidation = useCallback(() => {
    const currentImageUrl = getCurrentImageUrl();
    const hasValidImage = currentImageUrl.length > 0;
    const isHandlerValid =
      onSetAsMainImage && typeof onSetAsMainImage === 'function';

    const shouldDisableButton = isDisabled || !hasValidImage || !isHandlerValid;

    console.log('🔍 [MAIN_IMAGE_SET_BUTTON] 버튼 상태 최종 검증:', {
      imageIndex,
      hasValidImage,
      isHandlerValid,
      isDisabled,
      shouldDisableButton,
      stateValidationComplete: true,
    });

    return {
      hasValidImage,
      isHandlerValid,
      shouldDisableButton,
    };
  }, [imageIndex, isDisabled, onSetAsMainImage, getCurrentImageUrl]);

  const { shouldDisableButton } = buttonStateValidation();

  console.log('🎨 [MAIN_IMAGE_SET_BUTTON] 컴포넌트 렌더링 준비 완료:', {
    imageIndex,
    shouldDisableButton,
    tooltipText,
    size,
    variant,
    color,
    storeIntegrationEnhanced: true,
    renderReady: true,
  });

  return (
    <Button
      isIconOnly
      size={size}
      variant={variant}
      color={color}
      onPress={handleClick}
      isDisabled={shouldDisableButton}
      aria-label={`이미지 ${imageIndex + 1} 메인 이미지로 선택`}
      title={shouldDisableButton ? '선택할 수 없는 이미지' : tooltipText}
      type="button"
      className={`transition-all duration-200 ${
        shouldDisableButton
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:scale-110 hover:shadow-md'
      }`}
    >
      <Icon
        icon="lucide:home"
        className={`text-sm transition-colors duration-200 ${
          shouldDisableButton ? 'text-gray-400' : 'text-current'
        }`}
      />
    </Button>
  );
}

export default MainImageSetButton;
