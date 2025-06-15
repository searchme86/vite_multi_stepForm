// blogMediaStep/imageGallery/hooks/layout/useLayoutCalculation.ts - ImageGallery 컴포넌트

import { useCallback, useMemo } from 'react';
import {
  calculateLayoutMetrics,
  validateColumns,
  LayoutCalculationResult,
  DEFAULT_ROW_HEIGHT,
} from '../../utils/layoutUtils';

export interface LayoutCalculationActions {
  calculateMetrics: (
    imageCount: number,
    columns: number
  ) => LayoutCalculationResult;
  estimateHeight: (imageCount: number, columns: number) => number;
  calculateRows: (imageCount: number, columns: number) => number;
  validateLayoutColumns: (columns: number) => number;
  generateGridTemplate: (columns: number) => string;
  getOptimalColumns: (imageCount: number, containerWidth?: number) => number;
}

export const useLayoutCalculation = (): LayoutCalculationActions => {
  console.log('🔧 useLayoutCalculation 훅 초기화');

  const calculateMetrics = useCallback(
    (imageCount: number, columns: number): LayoutCalculationResult => {
      console.log('🔧 calculateMetrics 호출:', { imageCount, columns });

      const result = calculateLayoutMetrics(imageCount, columns);

      console.log('✅ calculateMetrics 결과:', result);
      return result;
    },
    []
  );

  const estimateHeight = useCallback(
    (imageCount: number, columns: number): number => {
      console.log('🔧 estimateHeight 호출:', { imageCount, columns });

      const validColumns = validateColumns(columns);
      const rows = Math.ceil(imageCount / validColumns);
      const height = rows * DEFAULT_ROW_HEIGHT;

      console.log('✅ estimateHeight 결과:', {
        validColumns,
        rows,
        height,
        rowHeight: DEFAULT_ROW_HEIGHT,
      });

      return height;
    },
    []
  );

  const calculateRows = useCallback(
    (imageCount: number, columns: number): number => {
      console.log('🔧 calculateRows 호출:', { imageCount, columns });

      const validColumns = validateColumns(columns);
      const rows = Math.ceil(imageCount / validColumns);

      console.log('✅ calculateRows 결과:', { rows, validColumns });
      return rows;
    },
    []
  );

  const validateLayoutColumns = useCallback((columns: number): number => {
    console.log('🔧 validateLayoutColumns 호출:', { columns });

    const validColumns = validateColumns(columns);

    console.log('✅ validateLayoutColumns 결과:', {
      input: columns,
      output: validColumns,
    });

    return validColumns;
  }, []);

  const generateGridTemplate = useCallback((columns: number): string => {
    console.log('🔧 generateGridTemplate 호출:', { columns });

    const validColumns = validateColumns(columns);
    const template = `repeat(${validColumns}, 1fr)`;

    console.log('✅ generateGridTemplate 결과:', { template });
    return template;
  }, []);

  const getOptimalColumns = useCallback(
    (imageCount: number, containerWidth: number = 1200): number => {
      console.log('🔧 getOptimalColumns 호출:', { imageCount, containerWidth });

      let optimalColumns = 3;

      if (containerWidth >= 1200) {
        optimalColumns = imageCount >= 12 ? 4 : 3;
      } else if (containerWidth >= 768) {
        optimalColumns = 3;
      } else {
        optimalColumns = 2;
      }

      const validColumns = validateColumns(optimalColumns);

      console.log('✅ getOptimalColumns 결과:', {
        optimalColumns: validColumns,
        imageCount,
        containerWidth,
      });

      return validColumns;
    },
    []
  );

  const memoizedActions = useMemo(
    () => ({
      calculateMetrics,
      estimateHeight,
      calculateRows,
      validateLayoutColumns,
      generateGridTemplate,
      getOptimalColumns,
    }),
    [
      calculateMetrics,
      estimateHeight,
      calculateRows,
      validateLayoutColumns,
      generateGridTemplate,
      getOptimalColumns,
    ]
  );

  console.log('✅ useLayoutCalculation 초기화 완료:', {
    timestamp: new Date().toLocaleTimeString(),
  });

  return memoizedActions;
};
