// 📁 mainImage/hooks/useMainImageManagement.ts

import { useCallback } from 'react';
import { useBlogMediaStepOrchestrator } from '../../hooks/useBlogMediaStepOrchestrator';
import { useBlogMediaStepIntegration } from '../../hooks/useBlogMediaStepIntegration';

interface MainImageManagementResult {
  setAsMainImageDirect: (imageIndex: number) => void;
  clearMainImageDirect: () => void;
  isMainImageValid: (imageIndex: number) => boolean;
  getMainImageIndex: () => number;
}

export const useMainImageManagement = (): MainImageManagementResult => {
  console.log('🔧 [MAIN_IMAGE_MANAGEMENT] 강화된 메인 이미지 관리 훅 초기화');

  const { currentFormValues, setMainImageValue, addToast, imageGalleryStore } =
    useBlogMediaStepIntegration();

  const { handleMainImageChange, validateImageConfiguration } =
    useBlogMediaStepOrchestrator();

  const { media: mediaFilesList, mainImage: currentMainImageUrl } =
    currentFormValues;

  // 🚨 강화된 메인 이미지 설정 로직
  const setAsMainImageDirect = useCallback(
    (imageIndex: number) => {
      console.log('🔧 [SET_AS_MAIN] 강화된 메인 이미지 직접 설정:', {
        imageIndex,
        mediaFilesCount: mediaFilesList.length,
        강화된설정로직: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      // 유효성 검사
      const isValidIndex =
        imageIndex >= 0 && imageIndex < mediaFilesList.length;
      if (!isValidIndex) {
        console.error('❌ [SET_AS_MAIN] 유효하지 않은 이미지 인덱스:', {
          imageIndex,
          mediaFilesCount: mediaFilesList.length,
        });

        addToast({
          title: '오류',
          description: '유효하지 않은 이미지를 선택했습니다.',
          color: 'danger',
        });
        return;
      }

      const selectedImageUrl = mediaFilesList[imageIndex];
      const isValidImageUrl = selectedImageUrl && selectedImageUrl.length > 0;

      if (!isValidImageUrl) {
        console.error('❌ [SET_AS_MAIN] 유효하지 않은 이미지 URL:', {
          imageIndex,
          imageUrl: selectedImageUrl,
        });

        addToast({
          title: '오류',
          description: '선택한 이미지를 불러올 수 없습니다.',
          color: 'danger',
        });
        return;
      }

      // 🚨 핵심: 강화된 setMainImageValue 호출 (다중 영속성 저장 포함)
      try {
        console.log('💾 [SET_AS_MAIN] 강화된 메인 이미지 영속성 저장 시작:', {
          selectedImageUrl: selectedImageUrl.slice(0, 30) + '...',
          imageIndex,
          다중영속성저장시작: true,
        });

        // 1단계: React Hook Form + Zustand + localStorage 모두 저장
        setMainImageValue(selectedImageUrl);

        // 2단계: 오케스트레이터로 추가 검증 및 동기화
        const orchestratorResult = handleMainImageChange(selectedImageUrl);

        const isOrchestrationSuccess = orchestratorResult.success;
        if (!isOrchestrationSuccess) {
          console.error(
            '❌ [SET_AS_MAIN] 오케스트레이터 동기화 실패:',
            orchestratorResult
          );

          addToast({
            title: '동기화 오류',
            description: orchestratorResult.message,
            color: 'warning',
          });
          return;
        }

        // 3단계: 갤러리 스토어 직접 동기화 (추가 보험)
        if (imageGalleryStore && typeof imageGalleryStore === 'object') {
          const currentGalleryConfig = (
            imageGalleryStore as any
          ).getImageViewConfig?.();
          if (currentGalleryConfig) {
            const updatedConfig = {
              ...currentGalleryConfig,
              mainImage: selectedImageUrl,
              lastMainImageUpdate: Date.now(),
            };

            (imageGalleryStore as any).updateImageViewConfig?.(updatedConfig);

            console.log('💾 [SET_AS_MAIN] 갤러리 스토어 직접 동기화 완료:', {
              mainImage: selectedImageUrl.slice(0, 30) + '...',
              갤러리스토어직접동기화: true,
            });
          }
        }

        // 4단계: localStorage 추가 백업 (Race Condition 방지)
        try {
          const enhancedBackupData = {
            mainImage: selectedImageUrl,
            imageIndex,
            timestamp: Date.now(),
            source: 'setAsMainImageDirect',
            mediaCount: mediaFilesList.length,
          };
          localStorage.setItem(
            'blogMediaMainImageBackup',
            JSON.stringify(enhancedBackupData)
          );
          console.log(
            '💾 [SET_AS_MAIN] localStorage 강화된 백업 완료:',
            enhancedBackupData
          );
        } catch (backupError) {
          console.warn('⚠️ [SET_AS_MAIN] localStorage 백업 실패:', backupError);
        }

        // 5단계: 설정 검증
        const validationResult = validateImageConfiguration();
        if (!validationResult.isValid) {
          console.warn(
            '⚠️ [SET_AS_MAIN] 설정 검증 실패:',
            validationResult.issues
          );
        }

        // 성공 토스트
        addToast({
          title: '메인 이미지 설정 완료',
          description: '메인 이미지가 성공적으로 설정되었습니다.',
          color: 'success',
        });

        console.log('✅ [SET_AS_MAIN] 강화된 메인 이미지 설정 완료:', {
          selectedImageUrl: selectedImageUrl.slice(0, 30) + '...',
          imageIndex,
          orchestrationSuccess: isOrchestrationSuccess,
          validationPassed: validationResult.isValid,
          affectedAreas: orchestratorResult.affectedImages,
          강화된메인이미지설정완료: true,
        });
      } catch (mainImageSetError) {
        console.error('❌ [SET_AS_MAIN] 강화된 메인 이미지 설정 실패:', {
          error: mainImageSetError,
          selectedImageUrl: selectedImageUrl.slice(0, 30) + '...',
          imageIndex,
        });

        addToast({
          title: '설정 실패',
          description: '메인 이미지 설정 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    },
    [
      mediaFilesList,
      setMainImageValue,
      handleMainImageChange,
      validateImageConfiguration,
      addToast,
      imageGalleryStore,
    ]
  );

  // 🚨 강화된 메인 이미지 해제 로직
  const clearMainImageDirect = useCallback(() => {
    console.log('🔧 [CLEAR_MAIN] 강화된 메인 이미지 해제:', {
      currentMainImage: currentMainImageUrl
        ? currentMainImageUrl.slice(0, 30) + '...'
        : 'none',
      강화된해제로직: true,
    });

    try {
      // 1단계: React Hook Form + Zustand + localStorage 모두 해제
      setMainImageValue('');

      // 2단계: localStorage 백업도 해제
      try {
        const clearBackupData = {
          mainImage: null,
          timestamp: Date.now(),
          source: 'clearMainImageDirect',
          action: 'clear',
        };
        localStorage.setItem(
          'blogMediaMainImageBackup',
          JSON.stringify(clearBackupData)
        );
        console.log('💾 [CLEAR_MAIN] localStorage 백업 해제 완료');
      } catch (clearBackupError) {
        console.warn(
          '⚠️ [CLEAR_MAIN] localStorage 백업 해제 실패:',
          clearBackupError
        );
      }

      // 3단계: 갤러리 스토어 직접 해제
      if (imageGalleryStore && typeof imageGalleryStore === 'object') {
        const currentGalleryConfig = (
          imageGalleryStore as any
        ).getImageViewConfig?.();
        if (currentGalleryConfig) {
          const updatedConfig = {
            ...currentGalleryConfig,
            mainImage: null,
            lastMainImageUpdate: Date.now(),
          };

          (imageGalleryStore as any).updateImageViewConfig?.(updatedConfig);

          console.log('💾 [CLEAR_MAIN] 갤러리 스토어 직접 해제 완료');
        }
      }

      addToast({
        title: '메인 이미지 해제',
        description: '메인 이미지가 해제되었습니다.',
        color: 'primary',
      });

      console.log('✅ [CLEAR_MAIN] 강화된 메인 이미지 해제 완료:', {
        강화된메인이미지해제완료: true,
      });
    } catch (clearError) {
      console.error('❌ [CLEAR_MAIN] 메인 이미지 해제 실패:', clearError);

      addToast({
        title: '해제 실패',
        description: '메인 이미지 해제 중 오류가 발생했습니다.',
        color: 'danger',
      });
    }
  }, [currentMainImageUrl, setMainImageValue, addToast, imageGalleryStore]);

  const isMainImageValid = useCallback(
    (imageIndex: number): boolean => {
      const isValidIndex =
        imageIndex >= 0 && imageIndex < mediaFilesList.length;
      const imageUrl = isValidIndex ? mediaFilesList[imageIndex] : null;
      const isValidUrl = Boolean(imageUrl && imageUrl.length > 0);

      return Boolean(isValidIndex && isValidUrl);
    },
    [mediaFilesList]
  );

  const getMainImageIndex = useCallback((): number => {
    if (!currentMainImageUrl) {
      return -1;
    }

    const mainImageIndex = mediaFilesList.indexOf(currentMainImageUrl);
    return mainImageIndex;
  }, [currentMainImageUrl, mediaFilesList]);

  console.log(
    '✅ [MAIN_IMAGE_MANAGEMENT] 강화된 메인 이미지 관리 훅 초기화 완료:',
    {
      mediaFilesCount: mediaFilesList.length,
      hasMainImage: !!currentMainImageUrl,
      currentMainImagePreview: currentMainImageUrl
        ? currentMainImageUrl.slice(0, 30) + '...'
        : 'none',
      mainImageIndex: getMainImageIndex(),
      강화된메인이미지관리: true,
      다중영속성지원: true,
      갤러리스토어직접동기화: true,
      localStorage백업지원: true,
      timestamp: new Date().toLocaleTimeString(),
    }
  );

  return {
    setAsMainImageDirect,
    clearMainImageDirect,
    isMainImageValid,
    getMainImageIndex,
  };
};
