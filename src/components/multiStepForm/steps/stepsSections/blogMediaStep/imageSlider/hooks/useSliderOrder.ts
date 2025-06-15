// blogMediaStep/imageSlider/hooks/useSliderOrder.ts

import { useCallback } from 'react';
import { useBlogMediaStepIntegration } from '../../hooks/useBlogMediaStepIntegration';

interface SliderOrderResult {
  moveSliderImage: (fromIndex: number, toIndex: number) => void;
  moveToFirst: (imageUrl: string) => void;
  moveToLast: (imageUrl: string) => void;
  swapSliderImages: (index1: number, index2: number) => void;
  reorderSliderImages: (newOrder: string[]) => void;
  getImagePosition: (imageUrl: string) => number;
}

export const useSliderOrder = (): SliderOrderResult => {
  console.log('🔧 useSliderOrder 훅 초기화');

  const { currentFormValues, setSliderImagesValue, addToast } =
    useBlogMediaStepIntegration();

  const { sliderImages } = currentFormValues;

  const moveSliderImage = useCallback(
    (fromIndex: number, toIndex: number) => {
      console.log('🔧 moveSliderImage 호출:', { fromIndex, toIndex });

      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= sliderImages.length ||
        toIndex >= sliderImages.length
      ) {
        console.log('⚠️ 잘못된 이동 인덱스:', {
          fromIndex,
          toIndex,
          length: sliderImages.length,
        });
        return;
      }

      const newSliderImages = [...sliderImages];
      const [movedImage] = newSliderImages.splice(fromIndex, 1);
      newSliderImages.splice(toIndex, 0, movedImage);

      setSliderImagesValue(newSliderImages);

      console.log('✅ moveSliderImage 완료:', {
        fromIndex,
        toIndex,
        movedImage: movedImage.slice(0, 30) + '...',
      });
    },
    [sliderImages, setSliderImagesValue]
  );

  const moveToFirst = useCallback(
    (imageUrl: string) => {
      console.log('🔧 moveToFirst 호출:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
      });

      const currentIndex = sliderImages.indexOf(imageUrl);
      if (currentIndex === -1) {
        console.log('⚠️ 이미지를 슬라이더에서 찾을 수 없음');
        return;
      }

      if (currentIndex === 0) {
        console.log('⚠️ 이미 첫 번째 위치');
        return;
      }

      moveSliderImage(currentIndex, 0);

      addToast({
        title: '순서 변경 완료',
        description: '이미지가 첫 번째로 이동되었습니다.',
        color: 'success',
      });

      console.log('✅ moveToFirst 완료');
    },
    [sliderImages, moveSliderImage, addToast]
  );

  const moveToLast = useCallback(
    (imageUrl: string) => {
      console.log('🔧 moveToLast 호출:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
      });

      const currentIndex = sliderImages.indexOf(imageUrl);
      if (currentIndex === -1) {
        console.log('⚠️ 이미지를 슬라이더에서 찾을 수 없음');
        return;
      }

      if (currentIndex === sliderImages.length - 1) {
        console.log('⚠️ 이미 마지막 위치');
        return;
      }

      moveSliderImage(currentIndex, sliderImages.length - 1);

      addToast({
        title: '순서 변경 완료',
        description: '이미지가 마지막으로 이동되었습니다.',
        color: 'success',
      });

      console.log('✅ moveToLast 완료');
    },
    [sliderImages, moveSliderImage, addToast]
  );

  const swapSliderImages = useCallback(
    (index1: number, index2: number) => {
      console.log('🔧 swapSliderImages 호출:', { index1, index2 });

      if (
        index1 === index2 ||
        index1 < 0 ||
        index2 < 0 ||
        index1 >= sliderImages.length ||
        index2 >= sliderImages.length
      ) {
        console.log('⚠️ 잘못된 교환 인덱스:', {
          index1,
          index2,
          length: sliderImages.length,
        });
        return;
      }

      const newSliderImages = [...sliderImages];
      [newSliderImages[index1], newSliderImages[index2]] = [
        newSliderImages[index2],
        newSliderImages[index1],
      ];

      setSliderImagesValue(newSliderImages);

      console.log('✅ swapSliderImages 완료:', { index1, index2 });
    },
    [sliderImages, setSliderImagesValue]
  );

  const reorderSliderImages = useCallback(
    (newOrder: string[]) => {
      console.log('🔧 reorderSliderImages 호출:', {
        newCount: newOrder.length,
      });

      if (newOrder.length !== sliderImages.length) {
        console.log('⚠️ 순서 변경 실패 - 길이가 다름:', {
          originalLength: sliderImages.length,
          newLength: newOrder.length,
        });
        return;
      }

      const allImagesExist = newOrder.every((url) =>
        sliderImages.includes(url)
      );
      if (!allImagesExist) {
        console.log('⚠️ 순서 변경 실패 - 존재하지 않는 이미지 포함');
        return;
      }

      setSliderImagesValue(newOrder);

      addToast({
        title: '순서 변경 완료',
        description: '슬라이더 이미지 순서가 변경되었습니다.',
        color: 'success',
      });

      console.log('✅ reorderSliderImages 완료');
    },
    [sliderImages, setSliderImagesValue, addToast]
  );

  const getImagePosition = useCallback(
    (imageUrl: string): number => {
      const position = sliderImages.indexOf(imageUrl);
      console.log('🔧 getImagePosition:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
        position,
      });
      return position;
    },
    [sliderImages]
  );

  console.log('✅ useSliderOrder 초기화 완료:', {
    sliderCount: sliderImages.length,
  });

  return {
    moveSliderImage,
    moveToFirst,
    moveToLast,
    swapSliderImages,
    reorderSliderImages,
    getImagePosition,
  };
};
