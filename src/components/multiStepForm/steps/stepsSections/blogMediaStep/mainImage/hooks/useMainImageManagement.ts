// blogMediaStep/mainImage/hooks/useMainImageManagement.ts

import { useCallback } from 'react';
import { useBlogMediaStepIntegration } from '../../hooks/useBlogMediaStepIntegration';

interface MainImageManagementResult {
  setAsMainImageDirect: (index: number) => void;
  cancelMainImage: () => void;
  updateMainImage: (index: number) => void;
  isMainImage: (imageUrl: string) => boolean;
}

export const useMainImageManagement = (): MainImageManagementResult => {
  console.log('🔧 useMainImageManagement 훅 초기화');

  const { currentFormValues, setMainImageValue, addToast } =
    useBlogMediaStepIntegration();

  const { media: mediaFiles, mainImage } = currentFormValues;

  const setAsMainImageDirect = useCallback(
    (index: number) => {
      const selectedImage = mediaFiles[index];

      console.log('🔧 setAsMainImageDirect 호출:', {
        index,
        hasImage: !!selectedImage,
      });

      if (selectedImage) {
        setMainImageValue(selectedImage);

        addToast({
          title: '메인 이미지 설정 완료',
          description:
            '블로그 메인 페이지에 표시될 대표 이미지가 선택되었습니다.',
          color: 'success',
          hideCloseButton: false,
        });

        console.log('✅ 메인 이미지 설정 완료:', { index });
      }
    },
    [mediaFiles, setMainImageValue, addToast]
  );

  const cancelMainImage = useCallback(() => {
    console.log('🔧 cancelMainImage 호출');

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
    (index: number) => {
      const selectedImage = mediaFiles[index];

      console.log('🔧 updateMainImage 호출:', {
        index,
        hasImage: !!selectedImage,
      });

      if (selectedImage) {
        setMainImageValue(selectedImage);

        addToast({
          title: '메인 이미지 설정 완료',
          description:
            '블로그 메인 페이지에 표시될 대표 이미지가 선택되었습니다.',
          color: 'success',
          hideCloseButton: false,
        });

        console.log('✅ updateMainImage 완료:', { index });
      }
    },
    [mediaFiles, setMainImageValue, addToast]
  );

  const isMainImage = useCallback(
    (imageUrl: string): boolean => {
      const result = mainImage === imageUrl;
      console.log('🔧 isMainImage 호출:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
        result,
      });
      return result;
    },
    [mainImage]
  );

  console.log('✅ useMainImageManagement 초기화 완료:', {
    hasMainImage: !!mainImage,
    mediaCount: mediaFiles.length,
  });

  return {
    setAsMainImageDirect,
    cancelMainImage,
    updateMainImage,
    isMainImage,
  };
};
