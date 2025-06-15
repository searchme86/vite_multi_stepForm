// blogMediaStep/imageSlider/hooks/useSliderSelection.ts

import { useCallback } from 'react';
import { useBlogMediaStepState } from '../../hooks/useBlogMediaStepState';

interface SliderSelectionResult {
  selectedSliderImages: number[];
  handleSliderImageSelect: (index: number) => void;
  clearSliderSelection: () => void;
  selectAllForSlider: (mediaFiles: string[]) => void;
  getSelectedImageUrls: (mediaFiles: string[]) => string[];
  isImageSelected: (index: number) => boolean;
  getSelectedCount: () => number;
}

export const useSliderSelection = (): SliderSelectionResult => {
  console.log('🔧 useSliderSelection 훅 초기화');

  const { selectionState, setSelectedSliderImages } = useBlogMediaStepState();

  const { selectedSliderImages } = selectionState;

  const handleSliderImageSelect = useCallback(
    (index: number) => {
      console.log('🔧 handleSliderImageSelect 호출:', { index });

      setSelectedSliderImages((prev) => {
        if (prev.includes(index)) {
          const newSelection = prev.filter((i) => i !== index);
          console.log('✅ 이미지 선택 해제:', {
            index,
            newCount: newSelection.length,
          });
          return newSelection;
        } else {
          const newSelection = [...prev, index];
          console.log('✅ 이미지 선택 추가:', {
            index,
            newCount: newSelection.length,
          });
          return newSelection;
        }
      });
    },
    [setSelectedSliderImages]
  );

  const clearSliderSelection = useCallback(() => {
    console.log('🔧 clearSliderSelection 호출');

    setSelectedSliderImages([]);

    console.log('✅ 슬라이더 선택 초기화 완료');
  }, [setSelectedSliderImages]);

  const selectAllForSlider = useCallback(
    (mediaFiles: string[]) => {
      console.log('🔧 selectAllForSlider 호출:', {
        mediaFileCount: mediaFiles.length,
      });

      const allIndices = mediaFiles.map((_, index) => index);
      setSelectedSliderImages(allIndices);

      console.log('✅ 모든 이미지 선택 완료:', {
        selectedCount: allIndices.length,
      });
    },
    [setSelectedSliderImages]
  );

  const getSelectedImageUrls = useCallback(
    (mediaFiles: string[]): string[] => {
      console.log('🔧 getSelectedImageUrls 호출:', {
        selectedCount: selectedSliderImages.length,
        mediaFileCount: mediaFiles.length,
      });

      const urls = selectedSliderImages
        .filter((index) => index < mediaFiles.length)
        .map((index) => mediaFiles[index])
        .filter(Boolean);

      console.log('✅ getSelectedImageUrls 결과:', { urlCount: urls.length });
      return urls;
    },
    [selectedSliderImages]
  );

  const isImageSelected = useCallback(
    (index: number): boolean => {
      const result = selectedSliderImages.includes(index);
      console.log('🔧 isImageSelected:', { index, result });
      return result;
    },
    [selectedSliderImages]
  );

  const getSelectedCount = useCallback((): number => {
    const count = selectedSliderImages.length;
    console.log('🔧 getSelectedCount:', { count });
    return count;
  }, [selectedSliderImages]);

  console.log('✅ useSliderSelection 초기화 완료:', {
    selectedCount: selectedSliderImages.length,
  });

  return {
    selectedSliderImages,
    handleSliderImageSelect,
    clearSliderSelection,
    selectAllForSlider,
    getSelectedImageUrls,
    isImageSelected,
    getSelectedCount,
  };
};
