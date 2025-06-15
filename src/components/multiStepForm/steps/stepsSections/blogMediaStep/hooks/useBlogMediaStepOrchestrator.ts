// blogMediaStep/hooks/useBlogMediaStepOrchestrator.ts - BlogMediaStep 컴포넌트

/**
 * BlogMediaStep 컴포넌트 - 4개 기능 간 상호작용 관리 훅
 * 업로드, 갤러리, 메인이미지, 슬라이더 간의 데이터 흐름과 충돌 방지를 담당
 * 비즈니스 로직의 일관성과 데이터 무결성을 보장
 */

import { useCallback, useMemo } from 'react';
import { useBlogMediaStepIntegration } from './useBlogMediaStepIntegration';

// ✅ 이미지 상태 정보 타입
interface ImageState {
  index: number;
  url: string;
  isMainImage: boolean;
  isInSlider: boolean;
  canSetAsMain: boolean;
  canAddToSlider: boolean;
}

// ✅ 상호작용 결과 타입
interface InteractionResult {
  success: boolean;
  message: string;
  affectedImages?: string[];
}

// ✅ 오케스트레이터 훅 반환 타입
interface BlogMediaStepOrchestratorResult {
  // 이미지 상태 정보
  getImageState: (imageUrl: string, imageIndex: number) => ImageState;
  getAllImageStates: () => ImageState[];

  // 충돌 방지 로직
  handleImageDeletion: (imageUrl: string) => InteractionResult;
  handleMainImageChange: (newMainImage: string) => InteractionResult;
  handleSliderImageToggle: (imageUrl: string) => InteractionResult;

  // 일괄 처리
  handleBulkImageDeletion: (imageUrls: string[]) => InteractionResult;
  validateImageConfiguration: () => { isValid: boolean; issues: string[] };

  // 상태 조회
  isImageInUse: (imageUrl: string) => boolean;
  getImageUsageInfo: (imageUrl: string) => {
    asMain: boolean;
    inSlider: boolean;
  };
}

/**
 * BlogMediaStep 기능 간 상호작용 관리 훅
 * 4개 기능(업로드, 갤러리, 메인이미지, 슬라이더) 간의 데이터 일관성 보장
 */
export const useBlogMediaStepOrchestrator =
  (): BlogMediaStepOrchestratorResult => {
    console.log('🔧 useBlogMediaStepOrchestrator 훅 초기화'); // 디버깅용

    // ✅ 통합 훅에서 필요한 기능들 가져오기
    const {
      currentFormValues,
      setMainImageValue,
      setSliderImagesValue,
      setMediaValue,
      addToast,
    } = useBlogMediaStepIntegration();

    const { media, mainImage, sliderImages } = currentFormValues;

    // ✅ 개별 이미지 상태 정보 생성
    const getImageState = useCallback(
      (imageUrl: string, imageIndex: number): ImageState => {
        console.log('🔧 getImageState 호출:', {
          imageUrl: imageUrl.slice(0, 30) + '...',
          imageIndex,
        }); // 디버깅용

        const isMainImage = mainImage === imageUrl;
        const isInSlider = sliderImages.includes(imageUrl);

        const state: ImageState = {
          index: imageIndex,
          url: imageUrl,
          isMainImage,
          isInSlider,
          canSetAsMain: !isMainImage, // 이미 메인이 아니면 설정 가능
          canAddToSlider: !isMainImage && !isInSlider, // 메인이 아니고 슬라이더에 없으면 추가 가능
        };

        console.log('✅ getImageState 결과:', state); // 디버깅용
        return state;
      },
      [mainImage, sliderImages]
    );

    // ✅ 모든 이미지 상태 정보 생성
    const getAllImageStates = useCallback((): ImageState[] => {
      console.log('🔧 getAllImageStates 호출:', { mediaCount: media.length }); // 디버깅용

      const states = media.map((imageUrl, index) =>
        getImageState(imageUrl, index)
      );

      console.log('✅ getAllImageStates 결과:', {
        totalImages: states.length,
        mainImages: states.filter((s) => s.isMainImage).length,
        sliderImages: states.filter((s) => s.isInSlider).length,
      }); // 디버깅용

      return states;
    }, [media, getImageState]);

    // ✅ 이미지 삭제 시 연관 상태 정리
    const handleImageDeletion = useCallback(
      (imageUrl: string): InteractionResult => {
        console.log('🔧 handleImageDeletion 호출:', {
          imageUrl: imageUrl.slice(0, 30) + '...',
        }); // 디버깅용

        const affectedImages: string[] = [];
        let message = '이미지가 삭제되었습니다.';

        // 메인 이미지인 경우 해제
        if (mainImage === imageUrl) {
          setMainImageValue('');
          affectedImages.push('메인 이미지');
          message += ' 메인 이미지가 해제되었습니다.';

          console.log('📸 메인 이미지 해제됨:', {
            imageUrl: imageUrl.slice(0, 30) + '...',
          }); // 디버깅용
        }

        // 슬라이더에 있는 경우 제거
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
          }); // 디버깅용
        }

        const result: InteractionResult = {
          success: true,
          message,
          affectedImages,
        };

        console.log('✅ handleImageDeletion 완료:', result); // 디버깅용
        return result;
      },
      [mainImage, sliderImages, setMainImageValue, setSliderImagesValue]
    );

    // ✅ 메인 이미지 변경 시 슬라이더에서 제거
    const handleMainImageChange = useCallback(
      (newMainImage: string): InteractionResult => {
        console.log('🔧 handleMainImageChange 호출:', {
          newMainImage: newMainImage.slice(0, 30) + '...',
        }); // 디버깅용

        let message = '메인 이미지가 설정되었습니다.';
        const affectedImages: string[] = ['메인 이미지'];

        // 새로운 메인 이미지가 슬라이더에 있다면 제거
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
          }); // 디버깅용
        }

        // 메인 이미지 설정
        setMainImageValue(newMainImage);

        const result: InteractionResult = {
          success: true,
          message,
          affectedImages,
        };

        console.log('✅ handleMainImageChange 완료:', result); // 디버깅용
        return result;
      },
      [sliderImages, setMainImageValue, setSliderImagesValue]
    );

    // ✅ 슬라이더 이미지 토글 (메인 이미지 충돌 방지)
    const handleSliderImageToggle = useCallback(
      (imageUrl: string): InteractionResult => {
        console.log('🔧 handleSliderImageToggle 호출:', {
          imageUrl: imageUrl.slice(0, 30) + '...',
        }); // 디버깅용

        // 메인 이미지인 경우 경고
        if (mainImage === imageUrl) {
          const result: InteractionResult = {
            success: false,
            message: '메인 이미지는 슬라이더에 추가할 수 없습니다.',
          };

          console.log('⚠️ 메인 이미지 슬라이더 추가 방지:', result); // 디버깅용
          return result;
        }

        // 슬라이더 토글
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
        }); // 디버깅용

        return result;
      },
      [mainImage, sliderImages, setSliderImagesValue]
    );

    // ✅ 일괄 이미지 삭제 처리
    const handleBulkImageDeletion = useCallback(
      (imageUrls: string[]): InteractionResult => {
        console.log('🔧 handleBulkImageDeletion 호출:', {
          count: imageUrls.length,
        }); // 디버깅용

        let totalAffectedImages: string[] = [];
        let hasMainImageDeleted = false;
        let sliderImagesRemoved = 0;

        // 각 이미지별 영향 확인
        imageUrls.forEach((imageUrl) => {
          if (mainImage === imageUrl) {
            hasMainImageDeleted = true;
          }
          if (sliderImages.includes(imageUrl)) {
            sliderImagesRemoved++;
          }
        });

        // 메인 이미지 해제
        if (hasMainImageDeleted) {
          setMainImageValue('');
          totalAffectedImages.push('메인 이미지');
        }

        // 슬라이더에서 제거
        if (sliderImagesRemoved > 0) {
          const newSliderImages = sliderImages.filter(
            (img) => !imageUrls.includes(img)
          );
          setSliderImagesValue(newSliderImages);
          totalAffectedImages.push('슬라이더');
        }

        // 미디어 목록에서 제거
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
        }); // 디버깅용

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

    // ✅ 이미지 구성 유효성 검증
    const validateImageConfiguration = useCallback(() => {
      console.log('🔧 validateImageConfiguration 호출'); // 디버깅용

      const issues: string[] = [];

      // 메인 이미지가 미디어 목록에 있는지 확인
      if (mainImage && !media.includes(mainImage)) {
        issues.push('메인 이미지가 미디어 목록에 없습니다.');
      }

      // 슬라이더 이미지들이 미디어 목록에 있는지 확인
      const invalidSliderImages = sliderImages.filter(
        (img) => !media.includes(img)
      );
      if (invalidSliderImages.length > 0) {
        issues.push(
          `${invalidSliderImages.length}개의 슬라이더 이미지가 미디어 목록에 없습니다.`
        );
      }

      // 메인 이미지가 슬라이더에 있는지 확인 (있으면 안됨)
      if (mainImage && sliderImages.includes(mainImage)) {
        issues.push('메인 이미지가 슬라이더에도 포함되어 있습니다.');
      }

      const isValid = issues.length === 0;

      console.log('✅ validateImageConfiguration 결과:', { isValid, issues }); // 디버깅용
      return { isValid, issues };
    }, [mainImage, sliderImages, media]);

    // ✅ 이미지 사용 여부 확인
    const isImageInUse = useCallback(
      (imageUrl: string): boolean => {
        const inUse = mainImage === imageUrl || sliderImages.includes(imageUrl);

        console.log('🔧 isImageInUse:', {
          imageUrl: imageUrl.slice(0, 30) + '...',
          inUse,
        }); // 디버깅용

        return inUse;
      },
      [mainImage, sliderImages]
    );

    // ✅ 이미지 사용 정보 조회
    const getImageUsageInfo = useCallback(
      (imageUrl: string) => {
        const usage = {
          asMain: mainImage === imageUrl,
          inSlider: sliderImages.includes(imageUrl),
        };

        console.log('🔧 getImageUsageInfo:', {
          imageUrl: imageUrl.slice(0, 30) + '...',
          usage,
        }); // 디버깅용

        return usage;
      },
      [mainImage, sliderImages]
    );

    console.log('✅ useBlogMediaStepOrchestrator 초기화 완료:', {
      mediaCount: media.length,
      hasMainImage: !!mainImage,
      sliderCount: sliderImages.length,
      timestamp: new Date().toLocaleTimeString(),
    }); // 디버깅용

    return {
      // 이미지 상태 정보
      getImageState,
      getAllImageStates,

      // 충돌 방지 로직
      handleImageDeletion,
      handleMainImageChange,
      handleSliderImageToggle,

      // 일괄 처리
      handleBulkImageDeletion,
      validateImageConfiguration,

      // 상태 조회
      isImageInUse,
      getImageUsageInfo,
    };
  };
