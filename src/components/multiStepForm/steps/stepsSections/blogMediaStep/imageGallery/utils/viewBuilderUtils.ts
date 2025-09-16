// blogMediaStep/imageGallery/utils/viewBuilderUtils.ts

export interface GalleryViewConfig {
  id: string;
  name: string;
  selectedImages: string[];
  clickOrder: number[];
  layout: {
    columns: number;
    gridType: 'grid' | 'masonry';
  };
  createdAt: Date;
}

export interface ViewBuilderState {
  selectedImages: string[];
  clickOrder: number[];
  layout: {
    columns: number;
    gridType: 'grid' | 'masonry';
  };
  filter: string;
}

export interface ImageSelectionUpdate {
  selectedImages: string[];
  clickOrder: number[];
}

export interface ButtonStates {
  allModeEnabled: boolean;
  selectedModeEnabled: boolean;
  resetEnabled: boolean;
}

export interface ModeConfiguration {
  canSelectImages: boolean;
  showSelectionIndicators: boolean;
  enableImageHover: boolean;
  cursorStyle: 'default' | 'pointer' | 'not-allowed';
}

export const createDefaultViewBuilderState = (): ViewBuilderState => {
  console.log('🔧 createDefaultViewBuilderState 호출');

  const state: ViewBuilderState = {
    selectedImages: [],
    clickOrder: [],
    layout: {
      columns: 3,
      gridType: 'grid',
    },
    filter: 'available',
  };

  console.log('✅ createDefaultViewBuilderState 결과:', state);
  return state;
};

export const generateGalleryViewId = (): string => {
  console.log('🔧 generateGalleryViewId 호출');

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const id = `gallery_${timestamp}_${randomSuffix}`;

  console.log('✅ generateGalleryViewId 결과:', { id });
  return id;
};

export const generateGalleryViewName = (
  imageCount?: number,
  viewType?: 'grid' | 'masonry'
): string => {
  console.log('🔧 generateGalleryViewName 호출:', { imageCount, viewType });

  const timeString = new Date().toLocaleTimeString();
  let baseName = `갤러리 뷰 ${timeString}`;

  if (imageCount !== undefined) {
    baseName = `갤러리 뷰 (${imageCount}개) ${timeString}`;
  }

  if (viewType) {
    const layoutName = viewType === 'grid' ? '그리드' : '매스너리';
    baseName = `${layoutName} ${baseName}`;
  }

  console.log('✅ generateGalleryViewName 결과:', { baseName });
  return baseName;
};

export const createGalleryViewConfig = (
  selectedImages: string[],
  clickOrder: number[],
  columns: number,
  gridType: 'grid' | 'masonry'
): GalleryViewConfig => {
  console.log('🔧 createGalleryViewConfig 호출:', {
    selectedCount: selectedImages.length,
    columns,
    gridType,
  });

  const config: GalleryViewConfig = {
    id: generateGalleryViewId(),
    name: generateGalleryViewName(selectedImages.length, gridType),
    selectedImages: [...selectedImages],
    clickOrder: [...clickOrder],
    layout: {
      columns,
      gridType,
    },
    createdAt: new Date(),
  };

  console.log('✅ createGalleryViewConfig 결과:', {
    id: config.id,
    name: config.name,
    selectedCount: config.selectedImages.length,
  });

  return config;
};

export const createAllImagesGalleryConfig = (
  allImages: string[],
  columns: number,
  gridType: 'grid' | 'masonry'
): GalleryViewConfig => {
  console.log('🔧 createAllImagesGalleryConfig 호출:', {
    imageCount: allImages.length,
    columns,
    gridType,
  });

  const clickOrder = allImages.map((_, index) => index + 1);

  const config: GalleryViewConfig = {
    id: generateGalleryViewId(),
    name: generateGalleryViewName(allImages.length, gridType),
    selectedImages: [...allImages],
    clickOrder,
    layout: {
      columns,
      gridType,
    },
    createdAt: new Date(),
  };

  console.log('✅ createAllImagesGalleryConfig 결과:', {
    id: config.id,
    name: config.name,
    imageCount: config.selectedImages.length,
    clickOrderCount: config.clickOrder.length,
  });

  return config;
};

export const calculateImageSelection = (
  currentSelectedImages: string[],
  currentClickOrder: number[],
  imageUrl: string
): ImageSelectionUpdate => {
  console.log('🔧 calculateImageSelection 호출:', {
    currentCount: currentSelectedImages.length,
    imageUrl: imageUrl.slice(0, 30) + '...',
  });

  const isAlreadySelected = currentSelectedImages.includes(imageUrl);

  if (isAlreadySelected) {
    const selectedIndex = currentSelectedImages.indexOf(imageUrl);
    const newSelectedImages = currentSelectedImages.filter(
      (img: string) => img !== imageUrl
    );
    const newClickOrder = currentClickOrder.filter(
      (_: number, i: number) => i !== selectedIndex
    );

    const adjustedClickOrder = newClickOrder.map((order: number) =>
      order > selectedIndex + 1 ? order - 1 : order
    );

    const result: ImageSelectionUpdate = {
      selectedImages: newSelectedImages,
      clickOrder: adjustedClickOrder,
    };

    console.log('✅ calculateImageSelection 제거:', {
      removedIndex: selectedIndex,
      newCount: result.selectedImages.length,
    });

    return result;
  } else {
    const result: ImageSelectionUpdate = {
      selectedImages: [...currentSelectedImages, imageUrl],
      clickOrder: [...currentClickOrder, currentSelectedImages.length + 1],
    };

    console.log('✅ calculateImageSelection 추가:', {
      newCount: result.selectedImages.length,
      newOrder: result.clickOrder[result.clickOrder.length - 1],
    });

    return result;
  }
};

export const resetViewBuilderSelection = (): ViewBuilderState => {
  console.log('🔧 resetViewBuilderSelection 호출');

  const resetState = createDefaultViewBuilderState();

  console.log('✅ resetViewBuilderSelection 완료');
  return resetState;
};

export const validateViewBuilderSelection = (
  selectedImages: string[]
): boolean => {
  console.log('🔧 validateViewBuilderSelection 호출:', {
    selectedCount: selectedImages.length,
  });

  const isValid = Array.isArray(selectedImages) && selectedImages.length > 0;

  console.log('✅ validateViewBuilderSelection 결과:', { isValid });
  return isValid;
};

export const generateViewTypeDisplayName = (
  gridType: 'grid' | 'masonry'
): string => {
  console.log('🔧 generateViewTypeDisplayName 호출:', { gridType });

  const displayName = gridType === 'grid' ? '균등 그리드' : '매스너리 레이아웃';

  console.log('✅ generateViewTypeDisplayName 결과:', { displayName });
  return displayName;
};

export const generateSuccessMessage = (
  selectedCount: number,
  viewType: 'grid' | 'masonry'
): string => {
  console.log('🔧 generateSuccessMessage 호출:', { selectedCount, viewType });

  const displayName = generateViewTypeDisplayName(viewType);
  const message = `${selectedCount}개 이미지로 구성된 ${displayName} 갤러리가 미리보기에 추가되었습니다.`;

  console.log('✅ generateSuccessMessage 결과:', { message });
  return message;
};

export const createColumnOptions = (): number[] => {
  console.log('🔧 createColumnOptions 호출');

  const options = [2, 3, 4, 5, 6];

  console.log('✅ createColumnOptions 결과:', { options });
  return options;
};

export const calculateButtonStates = (
  mode: 'all' | 'selected',
  totalCount: number,
  selectedCount: number
): ButtonStates => {
  console.log('🔧 calculateButtonStates 호출:', {
    mode,
    totalCount,
    selectedCount,
  });

  const states: ButtonStates = {
    allModeEnabled: mode === 'all' && totalCount > 0,
    selectedModeEnabled: mode === 'selected' && selectedCount > 0,
    resetEnabled: mode === 'selected' && selectedCount > 0,
  };

  console.log('✅ calculateButtonStates 결과:', states);
  return states;
};

export const getModeConfiguration = (
  mode: 'all' | 'selected',
  isDisabled: boolean = false
): ModeConfiguration => {
  console.log('🔧 getModeConfiguration 호출:', { mode, isDisabled });

  if (isDisabled) {
    const config: ModeConfiguration = {
      canSelectImages: false,
      showSelectionIndicators: false,
      enableImageHover: false,
      cursorStyle: 'not-allowed',
    };

    console.log('✅ getModeConfiguration 비활성화:', config);
    return config;
  }

  const config: ModeConfiguration = {
    canSelectImages: mode === 'selected',
    showSelectionIndicators: mode === 'selected',
    enableImageHover: mode === 'selected',
    cursorStyle: mode === 'selected' ? 'pointer' : 'default',
  };

  console.log('✅ getModeConfiguration 결과:', config);
  return config;
};

export const validateImageUrl = (imageUrl: string): boolean => {
  console.log('🔧 validateImageUrl 호출:', {
    imageUrl: imageUrl.slice(0, 30) + '...',
  });

  const isValid =
    typeof imageUrl === 'string' &&
    imageUrl.trim().length > 0 &&
    (imageUrl.startsWith('http') || imageUrl.startsWith('data:image'));

  console.log('✅ validateImageUrl 결과:', { isValid });
  return isValid;
};

export const sanitizeImageList = (images: string[]): string[] => {
  console.log('🔧 sanitizeImageList 호출:', { inputCount: images.length });

  if (!Array.isArray(images)) {
    console.log('⚠️ 입력이 배열이 아님');
    return [];
  }

  const sanitizedImages = images.filter(validateImageUrl);

  console.log('✅ sanitizeImageList 결과:', {
    inputCount: images.length,
    outputCount: sanitizedImages.length,
    filteredCount: images.length - sanitizedImages.length,
  });

  return sanitizedImages;
};

export const generateImageOrderNumbers = (imageCount: number): number[] => {
  console.log('🔧 generateImageOrderNumbers 호출:', { imageCount });

  if (imageCount <= 0) {
    console.log('⚠️ 이미지 개수가 0 이하');
    return [];
  }

  const orderNumbers = Array.from(
    { length: imageCount },
    (_, index) => index + 1
  );

  console.log('✅ generateImageOrderNumbers 결과:', {
    imageCount,
    orderCount: orderNumbers.length,
    firstOrder: orderNumbers[0],
    lastOrder: orderNumbers[orderNumbers.length - 1],
  });

  return orderNumbers;
};

export const createBulkSelectionUpdate = (
  imageUrls: string[]
): ImageSelectionUpdate => {
  console.log('🔧 createBulkSelectionUpdate 호출:', {
    imageCount: imageUrls.length,
  });

  const sanitizedImages = sanitizeImageList(imageUrls);
  const clickOrder = generateImageOrderNumbers(sanitizedImages.length);

  const result: ImageSelectionUpdate = {
    selectedImages: sanitizedImages,
    clickOrder,
  };

  console.log('✅ createBulkSelectionUpdate 결과:', {
    selectedCount: result.selectedImages.length,
    clickOrderCount: result.clickOrder.length,
  });

  return result;
};

export const formatImageCount = (count: number): string => {
  console.log('🔧 formatImageCount 호출:', { count });

  if (count === 0) {
    return '이미지 없음';
  }

  if (count === 1) {
    return '1개 이미지';
  }

  const formatted = `${count}개 이미지`;

  console.log('✅ formatImageCount 결과:', { formatted });
  return formatted;
};

export const createModeDisplayText = (
  mode: 'all' | 'selected',
  totalCount: number,
  selectedCount: number
): { allModeText: string; selectedModeText: string } => {
  console.log('🔧 createModeDisplayText 호출:', {
    mode,
    totalCount,
    selectedCount,
  });

  const allModeText =
    totalCount > 0 ? `전체 이미지 (${totalCount}개)` : '전체 이미지';

  const selectedModeText =
    selectedCount > 0 ? `선택 이미지 (${selectedCount}개)` : '선택 이미지';

  const result = { allModeText, selectedModeText };

  console.log('✅ createModeDisplayText 결과:', result);
  return result;
};

export const validateGalleryViewConfig = (
  config: Partial<GalleryViewConfig>
): boolean => {
  console.log('🔧 validateGalleryViewConfig 호출');

  const hasValidId = typeof config.id === 'string' && config.id.length > 0;
  const hasValidName =
    typeof config.name === 'string' && config.name.length > 0;
  const hasValidImages =
    Array.isArray(config.selectedImages) && config.selectedImages.length > 0;
  const hasValidClickOrder =
    Array.isArray(config.clickOrder) && config.clickOrder.length > 0;
  const hasValidLayout =
    config.layout !== undefined &&
    config.layout !== null &&
    typeof config.layout.columns === 'number' &&
    config.layout.columns > 0 &&
    (config.layout.gridType === 'grid' || config.layout.gridType === 'masonry');

  const isValid =
    hasValidId &&
    hasValidName &&
    hasValidImages &&
    hasValidClickOrder &&
    hasValidLayout;

  console.log('✅ validateGalleryViewConfig 결과:', {
    isValid,
    hasValidId,
    hasValidName,
    hasValidImages,
    hasValidClickOrder,
    hasValidLayout,
  });

  return isValid;
};

export const createErrorMessage = (
  errorType:
    | 'no-images'
    | 'invalid-selection'
    | 'mode-mismatch'
    | 'validation-failed',
  context?: { mode?: string; count?: number }
): string => {
  console.log('🔧 createErrorMessage 호출:', { errorType, context });

  let message: string;

  switch (errorType) {
    case 'no-images':
      message = '사용 가능한 이미지가 없습니다. 먼저 이미지를 업로드해주세요.';
      break;
    case 'invalid-selection':
      message = '선택된 이미지가 없습니다. 이미지를 먼저 선택해주세요.';
      break;
    case 'mode-mismatch':
      message = `${
        context?.mode || '현재'
      } 모드에서는 이 작업을 수행할 수 없습니다.`;
      break;
    case 'validation-failed':
      message = '갤러리 설정이 올바르지 않습니다. 다시 시도해주세요.';
      break;
    default:
      message = '알 수 없는 오류가 발생했습니다.';
  }

  console.log('✅ createErrorMessage 결과:', { message });
  return message;
};
