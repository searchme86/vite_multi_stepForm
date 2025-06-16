import {
  ImageViewConfig,
  CustomGalleryView,
} from '../../../../types/galleryTypes.ts';

export const validateImageUrl = (url: string): boolean => {
  console.log('🖼️ imageGalleryActions: 이미지 URL 검증', url);

  try {
    new URL(url);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasValidExtension = imageExtensions.some((ext) =>
      url.toLowerCase().includes(ext)
    );

    console.log('🖼️ imageGalleryActions: URL 검증 결과', hasValidExtension);
    return hasValidExtension;
  } catch {
    console.log('🖼️ imageGalleryActions: 잘못된 URL 형식');
    return false;
  }
};

export const generateImageViewConfig = (
  layout: string = 'grid',
  columns: number = 3
): ImageViewConfig => {
  console.log('🖼️ imageGalleryActions: 이미지 뷰 설정 생성', {
    layout,
    columns,
  });

  return {
    id: `config-${Date.now()}`,
    layout,
    columns,
    spacing: 8,
    borderRadius: 4,
    showTitles: true,
  };
};

export const sortGalleryViews = (
  views: CustomGalleryView[],
  sortBy: 'name' | 'createdAt' = 'createdAt'
): CustomGalleryView[] => {
  console.log('🖼️ imageGalleryActions: 갤러리 뷰 정렬', sortBy);

  return [...views].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
};

export const filterGalleryViews = (
  views: CustomGalleryView[],
  searchTerm: string
): CustomGalleryView[] => {
  console.log('🖼️ imageGalleryActions: 갤러리 뷰 필터링', searchTerm);

  if (!searchTerm.trim()) return views;

  const filtered = views.filter((view) =>
    view.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('🖼️ imageGalleryActions: 필터링 결과', filtered.length);
  return filtered;
};

export const exportGalleryData = (views: CustomGalleryView[]) => {
  console.log('🖼️ imageGalleryActions: 갤러리 데이터 내보내기');

  const exportData = {
    timestamp: new Date().toISOString(),
    totalViews: views.length,
    views: views.map((view) => ({
      id: view.id,
      name: view.name,
      config: view.config,
      imageCount: view.images.length,
      createdAt: view.createdAt,
    })),
  };

  return exportData;
};
