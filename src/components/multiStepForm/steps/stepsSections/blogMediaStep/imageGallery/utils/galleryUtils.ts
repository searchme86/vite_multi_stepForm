// blogMediaStep/imageGallery/utils/galleryUtils.ts - ImageGallery 컴포넌트

export type SortByType = 'index' | 'name' | 'size';
export type SortOrderType = 'asc' | 'desc';

export interface ImageFileInfo {
  url: string;
  index: number;
  name: string;
  size: number;
}

export interface SortedImageResult {
  images: ImageFileInfo[];
  totalCount: number;
}

export const estimateFileSize = (imageUrl: string): number => {
  console.log('🔧 estimateFileSize 호출:', {
    imageUrl: imageUrl.slice(0, 30) + '...',
  });

  const hash = imageUrl.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const size = Math.abs(hash % 5000000) + 500000;

  console.log('✅ estimateFileSize 결과:', { size });
  return size;
};

export const extractFileName = (imageUrl: string, index: number): string => {
  console.log('🔧 extractFileName 호출:', {
    imageUrl: imageUrl.slice(0, 30) + '...',
    index,
  });

  try {
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    if (fileName && fileName.includes('.')) {
      const decoded = decodeURIComponent(fileName);
      console.log('✅ extractFileName 성공:', { decoded });
      return decoded;
    }
  } catch (e) {
    console.log('⚠️ extractFileName URL 디코딩 실패');
  }

  const defaultName = `이미지_${index + 1}.jpg`;
  console.log('✅ extractFileName 기본값 사용:', { defaultName });
  return defaultName;
};

export const formatFileSize = (bytes: number): string => {
  console.log('🔧 formatFileSize 호출:', { bytes });

  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const result =
    parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];

  console.log('✅ formatFileSize 결과:', { result });
  return result;
};

export const createImageFileInfo = (
  imageUrl: string,
  index: number
): ImageFileInfo => {
  console.log('🔧 createImageFileInfo 호출:', {
    imageUrl: imageUrl.slice(0, 30) + '...',
    index,
  });

  const info: ImageFileInfo = {
    url: imageUrl,
    index,
    name: extractFileName(imageUrl, index),
    size: estimateFileSize(imageUrl),
  };

  console.log('✅ createImageFileInfo 결과:', {
    name: info.name,
    size: info.size,
  });
  return info;
};

export const filterAvailableImages = (
  mediaFiles: string[],
  mainImage: string | null,
  sliderImages: string[]
): string[] => {
  console.log('🔧 filterAvailableImages 호출:', {
    mediaCount: mediaFiles.length,
    hasMainImage: !!mainImage,
    sliderCount: sliderImages.length,
  });

  const safeMediaFiles = Array.isArray(mediaFiles) ? mediaFiles : [];
  const safeSliderImages = Array.isArray(sliderImages) ? sliderImages : [];

  const filtered = safeMediaFiles.filter(
    (img) =>
      (!mainImage || mainImage !== img) && !safeSliderImages.includes(img)
  );

  console.log('✅ filterAvailableImages 결과:', {
    originalCount: safeMediaFiles.length,
    filteredCount: filtered.length,
  });

  return filtered;
};

export const sortImageFiles = (
  images: ImageFileInfo[],
  sortBy: SortByType,
  sortOrder: SortOrderType
): ImageFileInfo[] => {
  console.log('🔧 sortImageFiles 호출:', {
    imageCount: images.length,
    sortBy,
    sortOrder,
  });

  const sortedImages = [...images].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'index':
      default:
        comparison = a.index - b.index;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  console.log('✅ sortImageFiles 결과:', { sortedCount: sortedImages.length });
  return sortedImages;
};

export const processImageFiles = (
  mediaFiles: string[],
  mainImage: string | null,
  sliderImages: string[],
  sortBy: SortByType,
  sortOrder: SortOrderType
): SortedImageResult => {
  console.log('🔧 processImageFiles 호출:', {
    mediaCount: mediaFiles.length,
    sortBy,
    sortOrder,
  });

  const availableImages = filterAvailableImages(
    mediaFiles,
    mainImage,
    sliderImages
  );

  const imageInfos = availableImages.map((url, index) =>
    createImageFileInfo(url, index)
  );

  const sortedImages = sortImageFiles(imageInfos, sortBy, sortOrder);

  const result: SortedImageResult = {
    images: sortedImages,
    totalCount: sortedImages.length,
  };

  console.log('✅ processImageFiles 결과:', {
    totalCount: result.totalCount,
    timestamp: new Date().toLocaleTimeString(),
  });

  return result;
};
