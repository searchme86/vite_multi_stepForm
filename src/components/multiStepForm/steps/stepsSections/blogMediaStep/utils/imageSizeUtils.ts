// blogMediaStep/utils/imageSizeUtils.ts - BlogMediaStep 컴포넌트

/**
 * BlogMediaStep 컴포넌트 - 이미지 크기 및 처리 관련 유틸리티 함수들
 * 이미지 크기 계산, 리사이징, 썸네일 생성 로직을 제공
 */

// ✅ 이미지 크기 정보 타입
export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

// ✅ 썸네일 옵션 타입
export interface ThumbnailOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number; // 0.1 ~ 1.0
}

/**
 * 이미지 URL에서 실제 크기 정보 추출
 * @param imageUrl - 이미지 URL (base64 또는 일반 URL)
 * @returns Promise<ImageDimensions> - 이미지 크기 정보
 */
export const getImageDimensions = (
  imageUrl: string
): Promise<ImageDimensions> => {
  console.log('🔧 getImageDimensions 호출:', {
    imageUrl: imageUrl.slice(0, 50) + '...',
    timestamp: new Date().toLocaleTimeString(),
  }); // 디버깅용

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const dimensions: ImageDimensions = {
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height,
      };

      console.log('✅ getImageDimensions 성공:', dimensions); // 디버깅용
      resolve(dimensions);
    };

    img.onerror = (error) => {
      console.error('❌ getImageDimensions 실패:', error); // 디버깅용
      reject(new Error('이미지 로드 실패'));
    };

    img.src = imageUrl;
  });
};

/**
 * 이미지 파일 크기 추정 (임시 함수)
 * 실제로는 파일에서 읽어와야 하지만 현재는 랜덤 값 생성
 * @param imageUrl - 이미지 URL
 * @returns 추정 파일 크기 (바이트)
 */
export const estimateImageFileSize = (imageUrl: string): number => {
  console.log('🔧 estimateImageFileSize 호출:', {
    imageUrl: imageUrl.slice(0, 30) + '...',
  }); // 디버깅용

  // 실제 프로덕션에서는 File 객체에서 크기를 가져와야 함
  // 현재는 기존 코드와 동일하게 임시 크기 생성
  const estimatedSize = Math.floor(1024 * 1024 * (Math.random() * 5 + 1)); // 1-6MB 랜덤

  console.log('✅ estimateImageFileSize 결과:', {
    imageUrl: imageUrl.slice(0, 30) + '...',
    estimatedSize,
  }); // 디버깅용

  return estimatedSize;
};

/**
 * 이미지 썸네일 생성
 * @param imageUrl - 원본 이미지 URL
 * @param options - 썸네일 옵션
 * @returns Promise<string> - 썸네일 base64 URL
 */
export const createImageThumbnail = (
  imageUrl: string,
  options: ThumbnailOptions
): Promise<string> => {
  console.log('🔧 createImageThumbnail 호출:', {
    imageUrl: imageUrl.slice(0, 30) + '...',
    options,
  }); // 디버깅용

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas context를 생성할 수 없습니다');
        }

        // 비율을 유지하면서 리사이징
        const scale = Math.min(
          options.maxWidth / img.width,
          options.maxHeight / img.height
        );

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // base64로 변환
        const thumbnailUrl = canvas.toDataURL('image/jpeg', options.quality);

        console.log('✅ createImageThumbnail 성공:', {
          originalSize: `${img.width}x${img.height}`,
          thumbnailSize: `${canvas.width}x${canvas.height}`,
          scale,
        }); // 디버깅용

        resolve(thumbnailUrl);
      } catch (error) {
        console.error('❌ createImageThumbnail 실패:', error); // 디버깅용
        reject(error);
      }
    };

    img.onerror = (error) => {
      console.error('❌ 이미지 로드 실패:', error); // 디버깅용
      reject(new Error('이미지 로드 실패'));
    };

    img.src = imageUrl;
  });
};

/**
 * 이미지 최적화 (크기 및 품질 조정)
 * @param imageUrl - 원본 이미지 URL
 * @param maxSizeBytes - 최대 파일 크기 (바이트)
 * @returns Promise<string> - 최적화된 이미지 URL
 */
export const optimizeImageSize = (
  imageUrl: string,
  maxSizeBytes: number = 5 * 1024 * 1024 // 기본 5MB
): Promise<string> => {
  console.log('🔧 optimizeImageSize 호출:', {
    imageUrl: imageUrl.slice(0, 30) + '...',
    maxSizeBytes,
  }); // 디버깅용

  return new Promise((resolve) => {
    // 현재는 기본적인 최적화만 수행
    // 실제로는 progressive JPEG 변환, WebP 변환 등이 필요

    // 임시로 원본 URL 반환 (추후 실제 최적화 로직 구현)
    console.log('✅ optimizeImageSize 완료 (현재는 원본 반환)'); // 디버깅용
    resolve(imageUrl);
  });
};

/**
 * 기본 썸네일 옵션
 */
export const DEFAULT_THUMBNAIL_OPTIONS: ThumbnailOptions = {
  maxWidth: 200,
  maxHeight: 200,
  quality: 0.8,
};

/**
 * 갤러리 썸네일 옵션 (작은 크기)
 */
export const GALLERY_THUMBNAIL_OPTIONS: ThumbnailOptions = {
  maxWidth: 80,
  maxHeight: 80,
  quality: 0.7,
};

/**
 * 프리뷰 썸네일 옵션 (중간 크기)
 */
export const PREVIEW_THUMBNAIL_OPTIONS: ThumbnailOptions = {
  maxWidth: 400,
  maxHeight: 400,
  quality: 0.9,
};
