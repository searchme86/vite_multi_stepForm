// blogMediaStep/imageGallery/utils/layoutUtils.ts - ImageGallery 컴포넌트

export interface ItemSize {
  colSpan: number;
  rowSpan: number;
}

export interface ImageViewConfig {
  selectedImages: string[];
  clickOrder: number[];
  layout: {
    columns: number;
    gridType?: 'grid' | 'masonry';
  };
  filter?: string;
}

export interface LayoutCalculationResult {
  gridColumns: string;
  gridRows: string;
  itemCount: number;
  estimatedHeight: number;
}

export const DEFAULT_GRID_COLUMNS = 3;
export const DEFAULT_ROW_HEIGHT = 120;
export const MAX_COLUMNS = 6;
export const MIN_COLUMNS = 1;

export const DEFAULT_ITEM_SIZES: ItemSize[] = [
  { colSpan: 1, rowSpan: 1 },
  { colSpan: 1, rowSpan: 2 },
  { colSpan: 2, rowSpan: 1 },
  { colSpan: 2, rowSpan: 2 },
];

export const validateColumns = (columns: number): number => {
  console.log('🔧 validateColumns 호출:', { columns });

  const validColumns = Math.max(
    MIN_COLUMNS,
    Math.min(MAX_COLUMNS, columns || DEFAULT_GRID_COLUMNS)
  );

  console.log('✅ validateColumns 결과:', {
    input: columns,
    output: validColumns,
  });
  return validColumns;
};

export const getMasonryItemSize = (
  index: number,
  itemSizes: ItemSize[] = DEFAULT_ITEM_SIZES
): ItemSize => {
  console.log('🔧 getMasonryItemSize 호출:', { index });

  if (index < 0 || !Number.isInteger(index)) {
    console.log('⚠️ 잘못된 인덱스, 기본값 반환');
    return itemSizes[0];
  }

  let size: ItemSize;
  if (index % 6 === 0) {
    size = itemSizes[3] || itemSizes[0];
  } else if (index % 5 === 0) {
    size = itemSizes[2] || itemSizes[0];
  } else if (index % 3 === 0) {
    size = itemSizes[1] || itemSizes[0];
  } else {
    size = itemSizes[0];
  }

  console.log('✅ getMasonryItemSize 결과:', { index, size });
  return size;
};

export const calculateSafeColSpan = (
  colSpan: number,
  maxColumns: number
): number => {
  console.log('🔧 calculateSafeColSpan 호출:', { colSpan, maxColumns });

  const safeColSpan = Math.min(colSpan, maxColumns);

  console.log('✅ calculateSafeColSpan 결과:', { safeColSpan });
  return safeColSpan;
};

export const generateGridStyles = (
  columns: number,
  rowHeight: number = DEFAULT_ROW_HEIGHT
): { gridTemplateColumns: string; gridAutoRows: string } => {
  console.log('🔧 generateGridStyles 호출:', { columns, rowHeight });

  const validColumns = validateColumns(columns);

  const styles = {
    gridTemplateColumns: `repeat(${validColumns}, 1fr)`,
    gridAutoRows: `${rowHeight}px`,
  };

  console.log('✅ generateGridStyles 결과:', styles);
  return styles;
};

export const calculateLayoutMetrics = (
  imageCount: number,
  columns: number,
  rowHeight: number = DEFAULT_ROW_HEIGHT
): LayoutCalculationResult => {
  console.log('🔧 calculateLayoutMetrics 호출:', {
    imageCount,
    columns,
    rowHeight,
  });

  const validColumns = validateColumns(columns);
  const rows = Math.ceil(imageCount / validColumns);
  const estimatedHeight = rows * rowHeight;

  const result: LayoutCalculationResult = {
    gridColumns: `repeat(${validColumns}, 1fr)`,
    gridRows: `repeat(${rows}, ${rowHeight}px)`,
    itemCount: imageCount,
    estimatedHeight,
  };

  console.log('✅ calculateLayoutMetrics 결과:', result);
  return result;
};

export const createSafeImageViewConfig = (
  config: Partial<ImageViewConfig>
): ImageViewConfig => {
  console.log('🔧 createSafeImageViewConfig 호출:', { hasConfig: !!config });

  if (!config) {
    const defaultConfig: ImageViewConfig = {
      selectedImages: [],
      clickOrder: [],
      layout: {
        columns: DEFAULT_GRID_COLUMNS,
        gridType: 'grid',
      },
      filter: 'available',
    };

    console.log('✅ createSafeImageViewConfig 기본값 반환:', defaultConfig);
    return defaultConfig;
  }

  const safeSelectedImages = Array.isArray(config.selectedImages)
    ? config.selectedImages.filter(
        (img) => typeof img === 'string' && img.trim().length > 0
      )
    : [];

  const safeClickOrder = Array.isArray(config.clickOrder)
    ? config.clickOrder.filter(
        (order) => typeof order === 'number' && order > 0
      )
    : [];

  const safeColumns = validateColumns(
    config.layout?.columns || DEFAULT_GRID_COLUMNS
  );

  const safeGridType =
    config.layout?.gridType === 'masonry' ? 'masonry' : 'grid';

  const safeConfig: ImageViewConfig = {
    selectedImages: safeSelectedImages,
    clickOrder: safeClickOrder,
    layout: {
      columns: safeColumns,
      gridType: safeGridType,
    },
    filter: config.filter || 'available',
  };

  console.log('✅ createSafeImageViewConfig 결과:', {
    selectedCount: safeConfig.selectedImages.length,
    columns: safeConfig.layout.columns,
    gridType: safeConfig.layout.gridType,
  });

  return safeConfig;
};

export const generateImageAltText = (
  index: number,
  orderNumber?: number
): string => {
  console.log('🔧 generateImageAltText 호출:', { index, orderNumber });

  const altText = `갤러리 이미지 ${index + 1}${
    orderNumber ? ` (순서: ${orderNumber}번째)` : ''
  }`;

  console.log('✅ generateImageAltText 결과:', { altText });
  return altText;
};
