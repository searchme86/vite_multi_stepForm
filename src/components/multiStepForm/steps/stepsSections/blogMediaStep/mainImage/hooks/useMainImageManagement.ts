// blogMediaStep/mainImage/hooks/useMainImageManagement.ts

import { useCallback } from 'react';
import { useBlogMediaStepState } from '../../hooks/useBlogMediaStepState';

interface MainImageManagementResult {
  setAsMainImageDirect: (index: number) => void;
  cancelMainImage: () => void;
  updateMainImage: (index: number) => void;
  isMainImage: (imageUrl: string) => boolean;
}

export const useMainImageManagement = (): MainImageManagementResult => {
  console.log('🔧 useMainImageManagement 훅 초기화 - Phase1 데이터흐름통일');

  const {
    formValues: currentFormValues,
    setMainImageValue,
    addToast,
  } = useBlogMediaStepState();

  const { media: mediaFilesList, mainImage: currentMainImageUrl } =
    currentFormValues;

  const setAsMainImageDirect = useCallback(
    (imageIndex: number) => {
      const selectedImageUrl = mediaFilesList[imageIndex];
      const hasSelectedImage = selectedImageUrl ? true : false;

      console.log('🔧 setAsMainImageDirect 호출:', {
        imageIndex,
        hasSelectedImage,
        selectedImagePreview: hasSelectedImage
          ? selectedImageUrl.slice(0, 30) + '...'
          : 'none',
        timestamp: new Date().toLocaleTimeString(),
      });

      if (!hasSelectedImage) {
        console.log('❌ 선택된 이미지가 없음:', { imageIndex });
        return;
      }

      setMainImageValue(selectedImageUrl);

      addToast({
        title: '메인 이미지 설정 완료',
        description:
          '블로그 메인 페이지에 표시될 대표 이미지가 선택되었습니다.',
        color: 'success',
        hideCloseButton: false,
      });

      console.log('✅ 메인 이미지 설정 완료:', {
        imageIndex,
        selectedImagePreview: selectedImageUrl.slice(0, 30) + '...',
      });
    },
    [mediaFilesList, setMainImageValue, addToast]
  );

  const cancelMainImage = useCallback(() => {
    console.log('🔧 cancelMainImage 호출 - 메인 이미지 해제');

    setMainImageValue('');

    addToast({
      title: '메인 이미지 해제 완료',
      description: '메인 이미지 설정이 해제되었습니다.',
      color: 'warning',
      hideCloseButton: false,
    });

    console.log('✅ 메인 이미지 해제 완료');
  }, [setMainImageValue, addToast]);

  const updateMainImage = useCallback(
    (imageIndex: number) => {
      const selectedImageUrl = mediaFilesList[imageIndex];
      const hasSelectedImage = selectedImageUrl ? true : false;

      console.log('🔧 updateMainImage 호출:', {
        imageIndex,
        hasSelectedImage,
        selectedImagePreview: hasSelectedImage
          ? selectedImageUrl.slice(0, 30) + '...'
          : 'none',
        timestamp: new Date().toLocaleTimeString(),
      });

      if (!hasSelectedImage) {
        console.log('❌ updateMainImage - 선택된 이미지가 없음:', {
          imageIndex,
        });
        return;
      }

      setMainImageValue(selectedImageUrl);

      addToast({
        title: '메인 이미지 설정 완료',
        description:
          '블로그 메인 페이지에 표시될 대표 이미지가 선택되었습니다.',
        color: 'success',
        hideCloseButton: false,
      });

      console.log('✅ updateMainImage 완료:', {
        imageIndex,
        selectedImagePreview: selectedImageUrl.slice(0, 30) + '...',
      });
    },
    [mediaFilesList, setMainImageValue, addToast]
  );

  const isMainImage = useCallback(
    (imageUrl: string): boolean => {
      const isCurrentMainImage = currentMainImageUrl === imageUrl;

      console.log('🔧 isMainImage 호출:', {
        imageUrlPreview: imageUrl.slice(0, 30) + '...',
        isCurrentMainImage,
        currentMainImagePreview: currentMainImageUrl
          ? currentMainImageUrl.slice(0, 30) + '...'
          : 'none',
      });

      return isCurrentMainImage;
    },
    [currentMainImageUrl]
  );

  const hasMainImage = currentMainImageUrl ? true : false;

  console.log('✅ useMainImageManagement 초기화 완료 - Phase1:', {
    hasMainImage,
    mediaFileCount: mediaFilesList.length,
    currentMainImagePreview:
      hasMainImage && currentMainImageUrl
        ? currentMainImageUrl.slice(0, 30) + '...'
        : 'none',
    timestamp: new Date().toLocaleTimeString(),
  });

  return {
    setAsMainImageDirect,
    cancelMainImage,
    updateMainImage,
    isMainImage,
  };
};
