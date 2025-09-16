// 📁 blogMediaStep/hooks/useBlogMediaStepOrchestrator.ts

import { useCallback } from 'react';
import { useBlogMediaStepIntegration } from './useBlogMediaStepIntegration';
import type {
  ImageViewConfig,
  CustomGalleryView,
} from '../../../../../../store/shared/commonTypes';

interface ImageState {
  index: number;
  url: string;
  isMainImage: boolean;
  isInSlider: boolean;
  canSetAsMain: boolean;
  canAddToSlider: boolean;
}

interface InteractionResult {
  success: boolean;
  message: string;
  affectedImages?: string[];
}

interface BlogMediaStepOrchestratorResult {
  getImageState: (imageUrl: string, imageIndex: number) => ImageState;
  getAllImageStates: () => ImageState[];
  handleImageDeletion: (imageUrl: string) => InteractionResult;
  handleMainImageChange: (newMainImage: string) => InteractionResult;
  handleSliderImageToggle: (imageUrl: string) => InteractionResult;
  handleBulkImageDeletion: (imageUrls: string[]) => InteractionResult;
  validateImageConfiguration: () => { isValid: boolean; issues: string[] };
  isImageInUse: (imageUrl: string) => boolean;
  getImageUsageInfo: (imageUrl: string) => {
    asMain: boolean;
    inSlider: boolean;
  };

  saveCurrentConfigAsGalleryView: (viewName?: string) => InteractionResult;
  syncCurrentStateToGalleryStore: () => InteractionResult;
}

export const useBlogMediaStepOrchestrator =
  (): BlogMediaStepOrchestratorResult => {
    console.log('🔧 [ORCHESTRATOR] 단순화된 오케스트레이터 훅 초기화');

    const {
      currentFormValues,
      setMainImageValue,
      setSliderImagesValue,
      setMediaValue,
      imageGalleryStore,
      syncToImageGalleryStore,
    } = useBlogMediaStepIntegration();

    const { media, mainImage, sliderImages } = currentFormValues;

    const saveCurrentConfigAsGalleryView = useCallback(
      (viewName?: string): InteractionResult => {
        console.log('💾 [SAVE_GALLERY_VIEW] 현재 설정을 갤러리 뷰로 저장:', {
          viewName: viewName || 'auto-generated',
          mediaCount: media.length,
          hasMainImage: !!mainImage,
          sliderCount: sliderImages.length,
          simplifiedSave: true,
        });

        if (!imageGalleryStore) {
          const result: InteractionResult = {
            success: false,
            message: '갤러리 스토어를 사용할 수 없습니다.',
          };
          console.log('❌ [SAVE_GALLERY_VIEW] 갤러리 스토어 없음:', result);
          return result;
        }

        try {
          const addCustomGalleryView = Reflect.get(
            imageGalleryStore,
            'addCustomGalleryView'
          );

          if (typeof addCustomGalleryView !== 'function') {
            throw new Error('addCustomGalleryView 함수를 찾을 수 없습니다');
          }

          let clickOrderArray = media.map((_, imageIndex) => imageIndex);

          if (mainImage) {
            const mainImageIndex = media.indexOf(mainImage);
            if (mainImageIndex >= 0) {
              clickOrderArray = [
                mainImageIndex,
                ...clickOrderArray.filter((index) => index !== mainImageIndex),
              ];
            }
          }

          const galleryViewName =
            viewName || `설정-${new Date().toLocaleTimeString()}`;
          const newGalleryView: CustomGalleryView = {
            id: `view-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 9)}`,
            name: galleryViewName,
            selectedImages: media,
            clickOrder: clickOrderArray,
            layout: {
              columns: 3,
              gridType: 'grid',
            },
            createdAt: new Date(),
          };

          addCustomGalleryView(newGalleryView);

          const result: InteractionResult = {
            success: true,
            message: `"${galleryViewName}" 갤러리 뷰가 저장되었습니다.`,
            affectedImages: ['갤러리 뷰'],
          };

          console.log('✅ [SAVE_GALLERY_VIEW] 갤러리 뷰 저장 완료:', {
            viewId: newGalleryView.id,
            viewName: galleryViewName,
            result,
            simplifiedSaveCompleted: true,
          });

          return result;
        } catch (saveError) {
          const result: InteractionResult = {
            success: false,
            message: `갤러리 뷰 저장 실패: ${saveError}`,
          };

          console.error('❌ [SAVE_GALLERY_VIEW] 갤러리 뷰 저장 실패:', {
            error: saveError,
            result,
          });

          return result;
        }
      },
      [media, mainImage, sliderImages, imageGalleryStore]
    );

    const syncCurrentStateToGalleryStore =
      useCallback((): InteractionResult => {
        console.log(
          '🔄 [SYNC_TO_GALLERY] 현재 상태를 갤러리 스토어에 직접 동기화:',
          {
            mediaCount: media.length,
            hasMainImage: !!mainImage,
            directSync: true,
            timestamp: new Date().toLocaleTimeString(),
          }
        );

        try {
          let clickOrderArray = media.map((_, imageIndex) => imageIndex);

          if (mainImage) {
            const mainImageIndex = media.indexOf(mainImage);
            if (mainImageIndex >= 0) {
              clickOrderArray = [
                mainImageIndex,
                ...clickOrderArray.filter((index) => index !== mainImageIndex),
              ];
            }
          }

          const galleryConfig: Partial<ImageViewConfig> = {
            selectedImages: media,
            clickOrder: clickOrderArray,
            layout: {
              columns: 3,
              gridType: 'grid',
            },
            filter: 'all',
          };

          syncToImageGalleryStore(galleryConfig);

          const result: InteractionResult = {
            success: true,
            message: '갤러리 스토어 동기화가 완료되었습니다.',
            affectedImages: ['갤러리 스토어'],
          };

          console.log('✅ [SYNC_TO_GALLERY] 갤러리 스토어 직접 동기화 완료:', {
            result,
            directSyncCompleted: true,
          });
          return result;
        } catch (syncError) {
          const result: InteractionResult = {
            success: false,
            message: `갤러리 스토어 동기화 실패: ${syncError}`,
          };

          console.error('❌ [SYNC_TO_GALLERY] 갤러리 스토어 동기화 실패:', {
            error: syncError,
            result,
          });

          return result;
        }
      }, [media, mainImage, syncToImageGalleryStore]);

    const getImageState = useCallback(
      (imageUrl: string, imageIndex: number): ImageState => {
        console.log('🔧 [GET_IMAGE_STATE] 이미지 상태 조회:', {
          imageUrl: imageUrl.slice(0, 30) + '...',
          imageIndex,
        });

        const isMainImage = mainImage === imageUrl;
        const isInSlider = sliderImages.includes(imageUrl);

        const state: ImageState = {
          index: imageIndex,
          url: imageUrl,
          isMainImage,
          isInSlider,
          canSetAsMain: !isMainImage,
          canAddToSlider: !isMainImage && !isInSlider,
        };

        console.log('✅ [GET_IMAGE_STATE] 이미지 상태 조회 완료:', state);
        return state;
      },
      [mainImage, sliderImages]
    );

    const getAllImageStates = useCallback((): ImageState[] => {
      console.log('🔧 [GET_ALL_STATES] 모든 이미지 상태 조회:', {
        mediaCount: media.length,
      });

      const states = media.map((imageUrl, index) =>
        getImageState(imageUrl, index)
      );

      console.log('✅ [GET_ALL_STATES] 모든 이미지 상태 조회 완료:', {
        totalImages: states.length,
        mainImages: states.filter((s) => s.isMainImage).length,
        sliderImages: states.filter((s) => s.isInSlider).length,
      });

      return states;
    }, [media, getImageState]);

    const handleImageDeletion = useCallback(
      (imageUrl: string): InteractionResult => {
        console.log('🔧 [HANDLE_DELETE] 이미지 삭제 처리 - 단순화된 로직:', {
          imageUrl: imageUrl.slice(0, 30) + '...',
          directProcessing: true,
        });

        const affectedImages: string[] = [];
        let message = '이미지가 삭제되었습니다.';

        if (mainImage === imageUrl) {
          setMainImageValue('');
          affectedImages.push('메인 이미지');
          message += ' 메인 이미지가 해제되었습니다.';

          console.log('📸 [HANDLE_DELETE] 메인 이미지 해제됨:', {
            imageUrl: imageUrl.slice(0, 30) + '...',
          });
        }

        if (sliderImages.includes(imageUrl)) {
          const newSliderImages = sliderImages.filter(
            (img) => img !== imageUrl
          );
          setSliderImagesValue(newSliderImages);
          affectedImages.push('슬라이더');
          message += ' 슬라이더에서 제거되었습니다.';

          console.log('🎠 [HANDLE_DELETE] 슬라이더에서 제거됨:', {
            imageUrl: imageUrl.slice(0, 30) + '...',
            remainingCount: newSliderImages.length,
          });
        }

        const result: InteractionResult = {
          success: true,
          message,
          affectedImages,
        };

        console.log(
          '✅ [HANDLE_DELETE] 이미지 삭제 처리 완료 - 단순화된 로직:',
          {
            result,
            directProcessingCompleted: true,
          }
        );
        return result;
      },
      [mainImage, sliderImages, setMainImageValue, setSliderImagesValue]
    );

    const handleMainImageChange = useCallback(
      (newMainImage: string): InteractionResult => {
        console.log(
          '🔧 [HANDLE_MAIN_CHANGE] 메인 이미지 변경 처리 - 단순화된 로직:',
          {
            newMainImage: newMainImage.slice(0, 30) + '...',
            directProcessing: true,
          }
        );

        let message = '메인 이미지가 설정되었습니다.';
        const affectedImages: string[] = ['메인 이미지'];

        if (sliderImages.includes(newMainImage)) {
          const newSliderImages = sliderImages.filter(
            (img) => img !== newMainImage
          );
          setSliderImagesValue(newSliderImages);
          affectedImages.push('슬라이더');
          message += ' 슬라이더에서 자동 제거되었습니다.';

          console.log('🎠 [HANDLE_MAIN_CHANGE] 슬라이더에서 자동 제거:', {
            newMainImage: newMainImage.slice(0, 30) + '...',
            remainingSliderCount: newSliderImages.length,
          });
        }

        setMainImageValue(newMainImage);

        const result: InteractionResult = {
          success: true,
          message,
          affectedImages,
        };

        console.log(
          '✅ [HANDLE_MAIN_CHANGE] 메인 이미지 변경 처리 완료 - 단순화된 로직:',
          {
            result,
            directProcessingCompleted: true,
          }
        );
        return result;
      },
      [sliderImages, setMainImageValue, setSliderImagesValue]
    );

    const handleSliderImageToggle = useCallback(
      (imageUrl: string): InteractionResult => {
        console.log('🔧 [HANDLE_SLIDER_TOGGLE] 슬라이더 이미지 토글:', {
          imageUrl: imageUrl.slice(0, 30) + '...',
        });

        if (mainImage === imageUrl) {
          const result: InteractionResult = {
            success: false,
            message: '메인 이미지는 슬라이더에 추가할 수 없습니다.',
          };

          console.log(
            '⚠️ [HANDLE_SLIDER_TOGGLE] 메인 이미지 슬라이더 추가 방지:',
            result
          );
          return result;
        }

        const isCurrentlyInSlider = sliderImages.includes(imageUrl);
        const newSliderImages = isCurrentlyInSlider
          ? sliderImages.filter((img) => img !== imageUrl)
          : [...sliderImages, imageUrl];

        setSliderImagesValue(newSliderImages);

        const result: InteractionResult = {
          success: true,
          message: isCurrentlyInSlider
            ? '슬라이더에서 제거되었습니다.'
            : '슬라이더에 추가되었습니다.',
          affectedImages: ['슬라이더'],
        };

        console.log('✅ [HANDLE_SLIDER_TOGGLE] 슬라이더 토글 완료:', {
          action: isCurrentlyInSlider ? 'removed' : 'added',
          newSliderCount: newSliderImages.length,
          result,
        });

        return result;
      },
      [mainImage, sliderImages, setSliderImagesValue]
    );

    const handleBulkImageDeletion = useCallback(
      (imageUrls: string[]): InteractionResult => {
        console.log(
          '🔧 [HANDLE_BULK_DELETE] 대량 이미지 삭제 처리 - 단순화된 로직:',
          {
            count: imageUrls.length,
            directProcessing: true,
          }
        );

        let totalAffectedImages: string[] = [];
        let hasMainImageDeleted = false;
        let sliderImagesRemoved = 0;

        imageUrls.forEach((imageUrl) => {
          if (mainImage === imageUrl) {
            hasMainImageDeleted = true;
          }
          if (sliderImages.includes(imageUrl)) {
            sliderImagesRemoved++;
          }
        });

        if (hasMainImageDeleted) {
          setMainImageValue('');
          totalAffectedImages.push('메인 이미지');
        }

        if (sliderImagesRemoved > 0) {
          const newSliderImages = sliderImages.filter(
            (img) => !imageUrls.includes(img)
          );
          setSliderImagesValue(newSliderImages);
          totalAffectedImages.push('슬라이더');
        }

        const newMediaFiles = media.filter((img) => !imageUrls.includes(img));
        setMediaValue(newMediaFiles);

        let message = `${imageUrls.length}개의 이미지가 삭제되었습니다.`;
        if (hasMainImageDeleted) message += ' 메인 이미지가 해제되었습니다.';
        if (sliderImagesRemoved > 0)
          message += ` ${sliderImagesRemoved}개가 슬라이더에서 제거되었습니다.`;

        const result: InteractionResult = {
          success: true,
          message,
          affectedImages: totalAffectedImages,
        };

        console.log(
          '✅ [HANDLE_BULK_DELETE] 대량 삭제 처리 완료 - 단순화된 로직:',
          {
            deletedCount: imageUrls.length,
            hasMainImageDeleted,
            sliderImagesRemoved,
            remainingMediaCount: newMediaFiles.length,
            result,
            directProcessingCompleted: true,
          }
        );

        return result;
      },
      [
        mainImage,
        sliderImages,
        media,
        setMainImageValue,
        setSliderImagesValue,
        setMediaValue,
      ]
    );

    const validateImageConfiguration = useCallback(() => {
      console.log('🔧 [VALIDATE_CONFIG] 이미지 설정 검증');

      const issues: string[] = [];

      if (mainImage && !media.includes(mainImage)) {
        issues.push('메인 이미지가 미디어 목록에 없습니다.');
      }

      const invalidSliderImages = sliderImages.filter(
        (img) => !media.includes(img)
      );
      if (invalidSliderImages.length > 0) {
        issues.push(
          `${invalidSliderImages.length}개의 슬라이더 이미지가 미디어 목록에 없습니다.`
        );
      }

      if (mainImage && sliderImages.includes(mainImage)) {
        issues.push('메인 이미지가 슬라이더에도 포함되어 있습니다.');
      }

      const isValid = issues.length === 0;

      console.log('✅ [VALIDATE_CONFIG] 이미지 설정 검증 완료:', {
        isValid,
        issues,
      });
      return { isValid, issues };
    }, [mainImage, sliderImages, media]);

    const isImageInUse = useCallback(
      (imageUrl: string): boolean => {
        const inUse = mainImage === imageUrl || sliderImages.includes(imageUrl);

        console.log('🔧 [IS_IMAGE_IN_USE] 이미지 사용 여부 확인:', {
          imageUrl: imageUrl.slice(0, 30) + '...',
          inUse,
        });

        return inUse;
      },
      [mainImage, sliderImages]
    );

    const getImageUsageInfo = useCallback(
      (imageUrl: string) => {
        const usage = {
          asMain: mainImage === imageUrl,
          inSlider: sliderImages.includes(imageUrl),
        };

        console.log('🔧 [GET_USAGE_INFO] 이미지 사용 정보 조회:', {
          imageUrl: imageUrl.slice(0, 30) + '...',
          usage,
        });

        return usage;
      },
      [mainImage, sliderImages]
    );

    console.log('✅ [ORCHESTRATOR] 단순화된 오케스트레이터 훅 초기화 완료:', {
      mediaCount: media.length,
      hasMainImage: !!mainImage,
      sliderCount: sliderImages.length,
      hasImageGalleryStore: !!imageGalleryStore,
      simplifiedLogicEnabled: true,
      directProcessingEnabled: true,
      timestamp: new Date().toLocaleTimeString(),
    });

    return {
      getImageState,
      getAllImageStates,
      handleImageDeletion,
      handleMainImageChange,
      handleSliderImageToggle,
      handleBulkImageDeletion,
      validateImageConfiguration,
      isImageInUse,
      getImageUsageInfo,

      saveCurrentConfigAsGalleryView,
      syncCurrentStateToGalleryStore,
    };
  };
