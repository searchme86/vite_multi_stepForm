// blogMediaStep/hooks/useBlogMediaStepOrchestrator.ts

import { useCallback } from 'react';
import { useBlogMediaStepIntegration } from './useBlogMediaStepIntegration';

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
}

export const useBlogMediaStepOrchestrator =
  (): BlogMediaStepOrchestratorResult => {
    console.log('🔧 useBlogMediaStepOrchestrator 훅 초기화');

    const {
      currentFormValues,
      setMainImageValue,
      setSliderImagesValue,
      setMediaValue,
    } = useBlogMediaStepIntegration();

    const { media, mainImage, sliderImages } = currentFormValues;

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
        console.log('🔧 handleImageDeletion 호출:', {
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

        const result: InteractionResult = {
          success: true,
          message,
          affectedImages,
        };

        console.log('✅ handleImageDeletion 완료:', result);
        return result;
      },
      [mainImage, sliderImages, setMainImageValue, setSliderImagesValue]
    );

    const handleMainImageChange = useCallback(
      (newMainImage: string): InteractionResult => {
        console.log('🔧 handleMainImageChange 호출:', {
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

        const result: InteractionResult = {
          success: true,
          message,
          affectedImages,
        };

        console.log('✅ handleMainImageChange 완료:', result);
        return result;
      },
      [sliderImages, setMainImageValue, setSliderImagesValue]
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
        console.log('🔧 handleBulkImageDeletion 호출:', {
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

        let message = `${imageUrls.length}개의 이미지가 삭제되었습니다.`;
        if (hasMainImageDeleted) message += ' 메인 이미지가 해제되었습니다.';
        if (sliderImagesRemoved > 0)
          message += ` ${sliderImagesRemoved}개가 슬라이더에서 제거되었습니다.`;

        const result: InteractionResult = {
          success: true,
          message,
          affectedImages: totalAffectedImages,
        };

        console.log('✅ handleBulkImageDeletion 완료:', {
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

    console.log('✅ useBlogMediaStepOrchestrator 초기화 완료:', {
      mediaCount: media.length,
      hasMainImage: !!mainImage,
      sliderCount: sliderImages.length,
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
    };
  };
