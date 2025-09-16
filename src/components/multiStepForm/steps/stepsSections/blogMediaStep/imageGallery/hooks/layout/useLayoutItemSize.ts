// blogMediaStep/imageGallery/hooks/layout/useLayoutItemSize.ts - ImageGallery 컴포넌트

import { useCallback, useMemo } from 'react';
import {
  getMasonryItemSize,
  calculateSafeColSpan,
  ItemSize,
  DEFAULT_ITEM_SIZES,
} from '../../utils/layoutUtils.ts';

export interface LayoutItemSizeResult {
  getItemSize: (index: number) => ItemSize;
  getSafeColSpan: (colSpan: number, maxColumns: number) => number;
  getItemStyles: (
    index: number,
    gridType: 'grid' | 'masonry',
    maxColumns: number
  ) => {
    gridColumn: string;
    gridRow: string;
  };
  getUniformItemSize: () => ItemSize;
}

export const useLayoutItemSize = (): LayoutItemSizeResult => {
  console.log('🔧 useLayoutItemSize 훅 초기화');

  const itemSizes = useMemo(() => {
    console.log('🔧 itemSizes 메모이제이션 계산');

    console.log('✅ itemSizes 결과:', {
      count: DEFAULT_ITEM_SIZES.length,
      sizes: DEFAULT_ITEM_SIZES,
    });

    return DEFAULT_ITEM_SIZES;
  }, []);

  const getItemSize = useCallback(
    (index: number): ItemSize => {
      console.log('🔧 getItemSize 호출:', { index });

      const size = getMasonryItemSize(index, itemSizes);

      console.log('✅ getItemSize 결과:', { index, size });
      return size;
    },
    [itemSizes]
  );

  const getSafeColSpan = useCallback(
    (colSpan: number, maxColumns: number): number => {
      console.log('🔧 getSafeColSpan 호출:', { colSpan, maxColumns });

      const safeColSpan = calculateSafeColSpan(colSpan, maxColumns);

      console.log('✅ getSafeColSpan 결과:', { safeColSpan });
      return safeColSpan;
    },
    []
  );

  const getItemStyles = useCallback(
    (
      index: number,
      gridType: 'grid' | 'masonry',
      maxColumns: number
    ): { gridColumn: string; gridRow: string } => {
      console.log('🔧 getItemStyles 호출:', { index, gridType, maxColumns });

      const { colSpan, rowSpan } =
        gridType === 'masonry'
          ? getItemSize(index)
          : { colSpan: 1, rowSpan: 1 };

      const safeColSpan = getSafeColSpan(colSpan, maxColumns);

      const styles = {
        gridColumn: `span ${safeColSpan}`,
        gridRow: `span ${rowSpan}`,
      };

      console.log('✅ getItemStyles 결과:', {
        index,
        gridType,
        originalColSpan: colSpan,
        safeColSpan,
        rowSpan,
        styles,
      });

      return styles;
    },
    [getItemSize, getSafeColSpan]
  );

  const getUniformItemSize = useCallback((): ItemSize => {
    console.log('🔧 getUniformItemSize 호출');

    const uniformSize: ItemSize = { colSpan: 1, rowSpan: 1 };

    console.log('✅ getUniformItemSize 결과:', uniformSize);
    return uniformSize;
  }, []);

  console.log('✅ useLayoutItemSize 초기화 완료:', {
    itemSizesCount: itemSizes.length,
    timestamp: new Date().toLocaleTimeString(),
  });

  return {
    getItemSize,
    getSafeColSpan,
    getItemStyles,
    getUniformItemSize,
  };
};
