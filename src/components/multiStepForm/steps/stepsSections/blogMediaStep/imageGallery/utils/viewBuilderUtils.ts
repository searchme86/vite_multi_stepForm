// blogMediaStep/imageGallery/utils/viewBuilderUtils.ts - ImageGallery 컴포넌트

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

  const id = Date.now().toString();

  console.log('✅ generateGalleryViewId 결과:', { id });
  return id;
};

export const generateGalleryViewName = (): string => {
  console.log('🔧 generateGalleryViewName 호출');

  const name = `갤러리 뷰 ${new Date().toLocaleTimeString()}`;

  console.log('✅ generateGalleryViewName 결과:', { name });
  return name;
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
    name: generateGalleryViewName(),
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

  const isValid = selectedImages.length > 0;

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
