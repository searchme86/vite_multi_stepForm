// src/components/multiStepForm/steps/stepsSections/blogMediaStep/imageSlider/hooks/useSliderSelection.ts

import { useState, useCallback } from 'react';

interface UseSliderSelectionReturn {
  selectedSliderImages: number[];
  handleSliderImageSelect: (index: number) => void;
  resetSliderSelection: () => void;
  setSelectedSliderImages: React.Dispatch<React.SetStateAction<number[]>>;
}

export function useSliderSelection(): UseSliderSelectionReturn {
  const [selectedSliderImages, setSelectedSliderImages] = useState<number[]>(
    []
  );

  const handleSliderImageSelect = useCallback((index: number) => {
    setSelectedSliderImages((prev: number[]) => {
      if (prev.includes(index)) {
        return prev.filter((i: number) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  }, []);

  const resetSliderSelection = useCallback(() => {
    setSelectedSliderImages([]);
  }, []);

  return {
    selectedSliderImages,
    handleSliderImageSelect,
    resetSliderSelection,
    setSelectedSliderImages,
  };
}
