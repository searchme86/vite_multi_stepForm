// 📁 store/shared/storage/imageGalleryCompression.ts

import type { ImageGalleryCompressionOptions } from './imageGalleryMetadata';

export interface ImageGalleryCompressionResult {
  readonly originalBlob: Blob;
  readonly compressedBlob: Blob;
  readonly thumbnailDataUrl: string;
  readonly originalDataUrl: string;
  readonly compressionRatio: number;
  readonly originalSize: number;
  readonly compressedSize: number;
  readonly dimensions: {
    readonly width: number;
    readonly height: number;
  };
}

export const createImageGalleryCanvas = (
  width: number,
  height: number
): HTMLCanvasElement => {
  console.log('🎨 [CANVAS] 이미지 갤러리 캔버스 생성:', {
    width,
    height,
    timestamp: new Date().toLocaleTimeString(),
  });

  const canvasElement = document.createElement('canvas');
  canvasElement.width = width;
  canvasElement.height = height;

  return canvasElement;
};

export const loadImageGalleryFromFile = (
  file: File
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    console.log('📁 [IMAGE_LOAD] 이미지 갤러리 파일 로드 시작:', {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      timestamp: new Date().toLocaleTimeString(),
    });

    const imageElement = new Image();
    const fileReader = new FileReader();

    fileReader.onload = (loadEvent) => {
      const { target } = loadEvent;
      const result = target?.result;

      const isValidResult = typeof result === 'string';
      if (!isValidResult) {
        console.error('❌ [IMAGE_LOAD] FileReader 결과가 문자열이 아님');
        reject(new Error('FileReader result is not a string'));
        return;
      }

      imageElement.onload = () => {
        console.log('✅ [IMAGE_LOAD] 이미지 로드 완료:', {
          width: imageElement.naturalWidth,
          height: imageElement.naturalHeight,
          timestamp: new Date().toLocaleTimeString(),
        });

        resolve(imageElement);
      };

      imageElement.onerror = (imageError) => {
        console.error('❌ [IMAGE_LOAD] 이미지 로드 실패:', {
          error: imageError,
          fileName: file.name,
        });

        reject(new Error(`Image load failed: ${file.name}`));
      };

      imageElement.src = result;
    };

    fileReader.onerror = (readerError) => {
      console.error('❌ [FILE_READER] 파일 읽기 실패:', {
        error: readerError,
        fileName: file.name,
      });

      reject(new Error(`File read failed: ${file.name}`));
    };

    fileReader.readAsDataURL(file);
  });
};

export const calculateImageGalleryOptimalDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  console.log('📐 [DIMENSIONS] 이미지 갤러리 최적 크기 계산:', {
    original: { width: originalWidth, height: originalHeight },
    max: { width: maxWidth, height: maxHeight },
  });

  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;
  const scalingRatio = Math.min(widthRatio, heightRatio, 1);

  const optimizedWidth = Math.floor(originalWidth * scalingRatio);
  const optimizedHeight = Math.floor(originalHeight * scalingRatio);

  console.log('✅ [DIMENSIONS] 최적 크기 계산 완료:', {
    optimized: { width: optimizedWidth, height: optimizedHeight },
    scalingRatio,
  });

  return {
    width: optimizedWidth,
    height: optimizedHeight,
  };
};

export const resizeImageGalleryWithCanvas = (
  imageElement: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement => {
  console.log('🔄 [RESIZE] 이미지 갤러리 캔버스 리사이징:', {
    original: {
      width: imageElement.naturalWidth,
      height: imageElement.naturalHeight,
    },
    target: { width: targetWidth, height: targetHeight },
    timestamp: new Date().toLocaleTimeString(),
  });

  const canvasElement = createImageGalleryCanvas(targetWidth, targetHeight);
  const context = canvasElement.getContext('2d');

  const hasValidContext = context !== null;
  if (!hasValidContext) {
    console.error('❌ [RESIZE] Canvas context 생성 실패');
    throw new Error('Canvas context creation failed');
  }

  // 이미지 품질 최적화 설정
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  context.drawImage(
    imageElement,
    0,
    0,
    imageElement.naturalWidth,
    imageElement.naturalHeight,
    0,
    0,
    targetWidth,
    targetHeight
  );

  console.log('✅ [RESIZE] 이미지 리사이징 완료:', {
    finalSize: { width: targetWidth, height: targetHeight },
  });

  return canvasElement;
};

export const convertImageGalleryCanvasToBlob = (
  canvasElement: HTMLCanvasElement,
  format: 'webp' | 'jpeg' | 'png' = 'webp',
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    console.log('🔄 [BLOB_CONVERT] 이미지 갤러리 Blob 변환 시작:', {
      format,
      quality,
      canvasSize: { width: canvasElement.width, height: canvasElement.height },
    });

    const mimeType = `image/${format}`;

    canvasElement.toBlob(
      (resultBlob) => {
        const isBlobValid = resultBlob !== null;
        if (!isBlobValid) {
          console.error('❌ [BLOB_CONVERT] Blob 변환 실패');
          reject(new Error('Canvas to Blob conversion failed'));
          return;
        }

        console.log('✅ [BLOB_CONVERT] Blob 변환 완료:', {
          blobSize: resultBlob.size,
          mimeType: resultBlob.type,
        });

        resolve(resultBlob);
      },
      mimeType,
      quality
    );
  });
};

export const generateImageGalleryThumbnail = async (
  imageElement: HTMLImageElement,
  thumbnailSize: number = 150
): Promise<string> => {
  console.log('🖼️ [THUMBNAIL] 이미지 갤러리 썸네일 생성:', {
    thumbnailSize,
    originalSize: {
      width: imageElement.naturalWidth,
      height: imageElement.naturalHeight,
    },
  });

  const { width: originalWidth, height: originalHeight } = imageElement;
  const { width: thumbnailWidth, height: thumbnailHeight } =
    calculateImageGalleryOptimalDimensions(
      originalWidth,
      originalHeight,
      thumbnailSize,
      thumbnailSize
    );

  const thumbnailCanvas = resizeImageGalleryWithCanvas(
    imageElement,
    thumbnailWidth,
    thumbnailHeight
  );
  const thumbnailDataUrl = thumbnailCanvas.toDataURL('image/webp', 0.7);

  console.log('✅ [THUMBNAIL] 썸네일 생성 완료:', {
    thumbnailSize: { width: thumbnailWidth, height: thumbnailHeight },
    dataUrlLength: thumbnailDataUrl.length,
  });

  return thumbnailDataUrl;
};

export const compressImageGalleryFile = async (
  file: File,
  compressionOptions: ImageGalleryCompressionOptions
): Promise<ImageGalleryCompressionResult> => {
  const {
    quality,
    maxWidth,
    maxHeight,
    format,
    thumbnailSize,
    enableThumbnail,
  } = compressionOptions;

  console.log('🗜️ [COMPRESS] 이미지 갤러리 파일 압축 시작:', {
    fileName: file.name,
    originalSize: file.size,
    compressionOptions,
    timestamp: new Date().toLocaleTimeString(),
  });

  try {
    const imageElement = await loadImageGalleryFromFile(file);
    const { naturalWidth: originalWidth, naturalHeight: originalHeight } =
      imageElement;

    // 원본 이미지 DataURL 생성
    const originalDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const { target } = event;
        const result = target?.result;
        const dataUrl = typeof result === 'string' ? result : '';
        resolve(dataUrl);
      };
      reader.readAsDataURL(file);
    });

    // 최적 크기 계산
    const { width: optimizedWidth, height: optimizedHeight } =
      calculateImageGalleryOptimalDimensions(
        originalWidth,
        originalHeight,
        maxWidth,
        maxHeight
      );

    // 이미지 리사이징
    const resizedCanvas = resizeImageGalleryWithCanvas(
      imageElement,
      optimizedWidth,
      optimizedHeight
    );

    // 압축된 Blob 생성
    const compressedBlob = await convertImageGalleryCanvasToBlob(
      resizedCanvas,
      format,
      quality
    );

    // 썸네일 생성 (옵션에 따라)
    const thumbnailDataUrl = enableThumbnail
      ? await generateImageGalleryThumbnail(imageElement, thumbnailSize)
      : '';

    // 원본 파일을 Blob으로 변환
    const originalBlob = new Blob([file], { type: file.type });

    // 압축률 계산
    const compressionRatio =
      ((originalBlob.size - compressedBlob.size) / originalBlob.size) * 100;

    const compressionResult: ImageGalleryCompressionResult = {
      originalBlob,
      compressedBlob,
      thumbnailDataUrl,
      originalDataUrl,
      compressionRatio,
      originalSize: originalBlob.size,
      compressedSize: compressedBlob.size,
      dimensions: {
        width: optimizedWidth,
        height: optimizedHeight,
      },
    };

    console.log('✅ [COMPRESS] 이미지 갤러리 압축 완료:', {
      fileName: file.name,
      originalSize: originalBlob.size,
      compressedSize: compressedBlob.size,
      compressionRatio: `${compressionRatio.toFixed(2)}%`,
      finalDimensions: { width: optimizedWidth, height: optimizedHeight },
      timestamp: new Date().toLocaleTimeString(),
    });

    return compressionResult;
  } catch (compressionError) {
    console.error('❌ [COMPRESS] 이미지 갤러리 압축 실패:', {
      fileName: file.name,
      error: compressionError,
      timestamp: new Date().toLocaleTimeString(),
    });

    throw new Error(`Image compression failed: ${file.name}`);
  }
};

export const calculateImageGalleryOptimalQuality = (
  fileSizeBytes: number
): number => {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);

  console.log('📊 [QUALITY] 이미지 갤러리 최적 품질 계산:', {
    fileSizeBytes,
    fileSizeMB: fileSizeMB.toFixed(2),
  });

  // 파일 크기에 따른 품질 조정
  const optimalQuality =
    fileSizeMB > 5 ? 0.6 : fileSizeMB > 2 ? 0.7 : fileSizeMB > 1 ? 0.8 : 0.9;

  console.log('✅ [QUALITY] 최적 품질 계산 완료:', {
    optimalQuality,
    fileSizeMB: fileSizeMB.toFixed(2),
  });

  return optimalQuality;
};
