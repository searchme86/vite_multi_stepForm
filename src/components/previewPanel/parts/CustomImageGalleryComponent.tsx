// 커스텀 이미지 갤러리 컴포넌트
import DynamicImageLayout from '../../DynamicImageLayout';
import { CustomGalleryView } from '../types/previewPanel.types';

interface CustomImageGalleryComponentProps {
  customGalleryViews: CustomGalleryView[];
}

function CustomImageGalleryComponent({
  customGalleryViews,
}: CustomImageGalleryComponentProps) {
  console.log('🖼️ 커스텀 갤러리 렌더링:', {
    galleryCount: customGalleryViews?.length || 0,
  });

  if (!Array.isArray(customGalleryViews) || customGalleryViews.length === 0) {
    console.log('⚠️ 커스텀 갤러리 뷰 없음 - 컴포넌트 숨김');
    return null;
  }

  return (
    <div className="my-8 space-y-8 not-prose">
      {customGalleryViews.map((galleryView, galleryIndex) => {
        if (!galleryView || typeof galleryView !== 'object') {
          console.log('⚠️ 유효하지 않은 갤러리 뷰:', galleryIndex);
          return null;
        }

        console.log('🎨 갤러리 뷰 렌더링:', {
          index: galleryIndex,
          id: galleryView.id,
          imageCount: galleryView.selectedImages?.length || 0,
        });

        return (
          <div key={galleryView.id || `gallery-${galleryIndex}`}>
            <DynamicImageLayout
              config={{
                selectedImages: Array.isArray(galleryView.selectedImages)
                  ? galleryView.selectedImages
                  : [],
                clickOrder: Array.isArray(galleryView.clickOrder)
                  ? galleryView.clickOrder
                  : [],
                layout:
                  galleryView.layout && typeof galleryView.layout === 'object'
                    ? {
                        columns: galleryView.layout.columns || 3,
                        gridType: (galleryView.layout.gridType === 'masonry'
                          ? 'masonry'
                          : 'grid') as 'grid' | 'masonry',
                      }
                    : { columns: 3, gridType: 'grid' as 'grid' | 'masonry' },
                filter: 'available',
              }}
              showNumbers={false}
              className="rounded-lg"
            />
          </div>
        );
      })}
    </div>
  );
}

export default CustomImageGalleryComponent;
