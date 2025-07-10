// blogMediaStep/hooks/useBlogMediaStepOrchestrator.ts

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

  // ✅ 새로 추가: Zustand 관련 기능
  saveCurrentConfigAsGalleryView: (viewName?: string) => InteractionResult;
  syncCurrentStateToGalleryStore: () => InteractionResult;
}

export const useBlogMediaStepOrchestrator =
  (): BlogMediaStepOrchestratorResult => {
    console.log('🔧 useBlogMediaStepOrchestrator 훅 초기화 - Zustand연동');

    const {
      currentFormValues,
      setMainImageValue,
      setSliderImagesValue,
      setMediaValue,
      imageGalleryStore, // ✅ 추가: 갤러리 스토어
      syncToImageGalleryStore, // ✅ 추가: 동기화 함수
    } = useBlogMediaStepIntegration();

    const { media, mainImage, sliderImages } = currentFormValues;

    // ✅ 새로 추가: 현재 설정을 갤러리 뷰로 저장
    const saveCurrentConfigAsGalleryView = useCallback(
      (viewName?: string): InteractionResult => {
        console.log('💾 [SAVE_GALLERY_VIEW] 현재 설정을 갤러리 뷰로 저장:', {
          viewName: viewName || 'auto-generated',
          mediaCount: media.length,
          hasMainImage: !!mainImage,
          sliderCount: sliderImages.length,
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
          // 타입 안전한 메서드 접근
          const addCustomGalleryView = Reflect.get(
            imageGalleryStore,
            'addCustomGalleryView'
          );

          if (typeof addCustomGalleryView !== 'function') {
            throw new Error('addCustomGalleryView 함수를 찾을 수 없습니다');
          }

          // 메인 이미지가 있는 경우 해당 인덱스를 첫 번째로 설정
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

    // ✅ 새로 추가: 현재 상태를 갤러리 스토어에 동기화
    const syncCurrentStateToGalleryStore =
      useCallback((): InteractionResult => {
        console.log(
          '🔄 [SYNC_TO_GALLERY] 현재 상태를 갤러리 스토어에 동기화:',
          {
            mediaCount: media.length,
            hasMainImage: !!mainImage,
            timestamp: new Date().toLocaleTimeString(),
          }
        );

        try {
          // 메인 이미지가 있는 경우 해당 인덱스를 첫 번째로 설정
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

          console.log(
            '✅ [SYNC_TO_GALLERY] 갤러리 스토어 동기화 완료:',
            result
          );
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
        console.log('🔧 getImageState 호출:', {
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

        console.log('✅ getImageState 결과:', state);
        return state;
      },
      [mainImage, sliderImages]
    );

    const getAllImageStates = useCallback((): ImageState[] => {
      console.log('🔧 getAllImageStates 호출:', { mediaCount: media.length });

      const states = media.map((imageUrl, index) =>
        getImageState(imageUrl, index)
      );

      console.log('✅ getAllImageStates 결과:', {
        totalImages: states.length,
        mainImages: states.filter((s) => s.isMainImage).length,
        sliderImages: states.filter((s) => s.isInSlider).length,
      });

      return states;
    }, [media, getImageState]);

    const handleImageDeletion = useCallback(
      (imageUrl: string): InteractionResult => {
        console.log('🔧 handleImageDeletion 호출 - Zustand연동:', {
          imageUrl: imageUrl.slice(0, 30) + '...',
        });

        const affectedImages: string[] = [];
        let message = '이미지가 삭제되었습니다.';

        if (mainImage === imageUrl) {
          setMainImageValue('');
          affectedImages.push('메인 이미지');
          message += ' 메인 이미지가 해제되었습니다.';

          console.log('📸 메인 이미지 해제됨:', {
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

          console.log('🎠 슬라이더에서 제거됨:', {
            imageUrl: imageUrl.slice(0, 30) + '...',
            remainingCount: newSliderImages.length,
          });
        }

        // ✅ 새로 추가: 갤러리 스토어 동기화
        setTimeout(() => {
          syncCurrentStateToGalleryStore();
          console.log('🔄 [DELETE_SYNC] 삭제 후 갤러리 스토어 동기화 완료');
        }, 100);

        const result: InteractionResult = {
          success: true,
          message,
          affectedImages,
        };

        console.log('✅ handleImageDeletion 완료 - Zustand연동:', result);
        return result;
      },
      [
        mainImage,
        sliderImages,
        setMainImageValue,
        setSliderImagesValue,
        syncCurrentStateToGalleryStore,
      ]
    );

    const handleMainImageChange = useCallback(
      (newMainImage: string): InteractionResult => {
        console.log('🔧 handleMainImageChange 호출 - Zustand연동:', {
          newMainImage: newMainImage.slice(0, 30) + '...',
        });

        let message = '메인 이미지가 설정되었습니다.';
        const affectedImages: string[] = ['메인 이미지'];

        if (sliderImages.includes(newMainImage)) {
          const newSliderImages = sliderImages.filter(
            (img) => img !== newMainImage
          );
          setSliderImagesValue(newSliderImages);
          affectedImages.push('슬라이더');
          message += ' 슬라이더에서 자동 제거되었습니다.';

          console.log('🎠 슬라이더에서 자동 제거:', {
            newMainImage: newMainImage.slice(0, 30) + '...',
            remainingSliderCount: newSliderImages.length,
          });
        }

        setMainImageValue(newMainImage);

        // ✅ 새로 추가: 갤러리 스토어 동기화
        setTimeout(() => {
          syncCurrentStateToGalleryStore();
          console.log(
            '🔄 [MAIN_IMAGE_SYNC] 메인 이미지 변경 후 갤러리 스토어 동기화 완료'
          );
        }, 100);

        const result: InteractionResult = {
          success: true,
          message,
          affectedImages,
        };

        console.log('✅ handleMainImageChange 완료 - Zustand연동:', result);
        return result;
      },
      [
        sliderImages,
        setMainImageValue,
        setSliderImagesValue,
        syncCurrentStateToGalleryStore,
      ]
    );

    const handleSliderImageToggle = useCallback(
      (imageUrl: string): InteractionResult => {
        console.log('🔧 handleSliderImageToggle 호출:', {
          imageUrl: imageUrl.slice(0, 30) + '...',
        });

        if (mainImage === imageUrl) {
          const result: InteractionResult = {
            success: false,
            message: '메인 이미지는 슬라이더에 추가할 수 없습니다.',
          };

          console.log('⚠️ 메인 이미지 슬라이더 추가 방지:', result);
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

        console.log('✅ handleSliderImageToggle 완료:', {
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
        console.log('🔧 handleBulkImageDeletion 호출 - Zustand연동:', {
          count: imageUrls.length,
        });

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

        // ✅ 새로 추가: 갤러리 스토어 동기화
        setTimeout(() => {
          syncCurrentStateToGalleryStore();
          console.log(
            '🔄 [BULK_DELETE_SYNC] 대량 삭제 후 갤러리 스토어 동기화 완료'
          );
        }, 200);

        let message = `${imageUrls.length}개의 이미지가 삭제되었습니다.`;
        if (hasMainImageDeleted) message += ' 메인 이미지가 해제되었습니다.';
        if (sliderImagesRemoved > 0)
          message += ` ${sliderImagesRemoved}개가 슬라이더에서 제거되었습니다.`;

        const result: InteractionResult = {
          success: true,
          message,
          affectedImages: totalAffectedImages,
        };

        console.log('✅ handleBulkImageDeletion 완료 - Zustand연동:', {
          deletedCount: imageUrls.length,
          hasMainImageDeleted,
          sliderImagesRemoved,
          remainingMediaCount: newMediaFiles.length,
          result,
        });

        return result;
      },
      [
        mainImage,
        sliderImages,
        media,
        setMainImageValue,
        setSliderImagesValue,
        setMediaValue,
        syncCurrentStateToGalleryStore,
      ]
    );

    const validateImageConfiguration = useCallback(() => {
      console.log('🔧 validateImageConfiguration 호출');

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

      console.log('✅ validateImageConfiguration 결과:', { isValid, issues });
      return { isValid, issues };
    }, [mainImage, sliderImages, media]);

    const isImageInUse = useCallback(
      (imageUrl: string): boolean => {
        const inUse = mainImage === imageUrl || sliderImages.includes(imageUrl);

        console.log('🔧 isImageInUse:', {
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

        console.log('🔧 getImageUsageInfo:', {
          imageUrl: imageUrl.slice(0, 30) + '...',
          usage,
        });

        return usage;
      },
      [mainImage, sliderImages]
    );

    console.log('✅ useBlogMediaStepOrchestrator 초기화 완료 - Zustand연동:', {
      mediaCount: media.length,
      hasMainImage: !!mainImage,
      sliderCount: sliderImages.length,
      hasImageGalleryStore: !!imageGalleryStore,
      zustandSyncEnabled: true,
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

      // ✅ 새로 추가: Zustand 관련 기능
      saveCurrentConfigAsGalleryView,
      syncCurrentStateToGalleryStore,
    };
  };
