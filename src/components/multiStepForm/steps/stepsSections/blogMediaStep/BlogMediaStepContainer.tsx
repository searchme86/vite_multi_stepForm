// src/components/multiStepForm/steps/stepsSections/blogMediaStep/BlogMediaStepContainer.tsx

import React from 'react';
import { Icon } from '@iconify/react';

import AccordionField from '../../../../accordion-field';
import { useBlogMediaStepState } from './hooks/useBlogMediaStepState';

import ImageUploadContainer from './imageUpload/ImageUploadContainer';
import ImageGalleryContainer from './imageGallery/ImageGalleryContainer';
import ImageSliderContainer from './imageSlider/ImageSliderContainer';
import MainImageContainer from './mainImage/MainImageContainer';
import DynamicLayoutRenderer from './imageGallery/parts/layout/DynamicLayoutRenderer';
import ImageViewBuilderPanel from './imageGallery/parts/viewBuilder/ImageViewBuilderPanel';

interface ImageViewConfig {
  selectedImages: string[];
  clickOrder: number[];
  layout: {
    columns: number;
    gridType: 'grid' | 'masonry';
  };
  filter: string;
}

interface GalleryStoreWithMethods {
  togglePreviewPanel?: () => void;
  getImageViewConfig?: () => ImageViewConfig | null;
}

function isGalleryStoreWithMethods(
  obj: unknown
): obj is GalleryStoreWithMethods {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const hasTogglePreviewPanel =
    'togglePreviewPanel' in obj &&
    typeof obj['togglePreviewPanel'] === 'function';
  const hasGetImageViewConfig =
    'getImageViewConfig' in obj &&
    typeof obj['getImageViewConfig'] === 'function';

  return hasTogglePreviewPanel || hasGetImageViewConfig;
}

function isValidImageViewConfig(obj: unknown): obj is ImageViewConfig {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const hasSelectedImages =
    'selectedImages' in obj && Array.isArray(obj['selectedImages']);
  const hasClickOrder = 'clickOrder' in obj && Array.isArray(obj['clickOrder']);
  const hasLayout =
    'layout' in obj &&
    obj['layout'] !== null &&
    typeof obj['layout'] === 'object';
  const hasFilter = 'filter' in obj && typeof obj['filter'] === 'string';

  if (!hasSelectedImages || !hasClickOrder || !hasLayout || !hasFilter) {
    return false;
  }

  const layoutObject = obj['layout'];
  if (layoutObject === null || typeof layoutObject !== 'object') {
    return false;
  }

  const hasColumns =
    'columns' in layoutObject && typeof layoutObject['columns'] === 'number';
  const hasGridType =
    'gridType' in layoutObject &&
    (layoutObject['gridType'] === 'grid' ||
      layoutObject['gridType'] === 'masonry');

  return hasColumns && hasGridType;
}

function BlogMediaStepContainer(): React.ReactNode {
  const blogMediaStepState = useBlogMediaStepState();

  const {
    formValues: currentFormValues,
    uiState: userInterfaceState,
    imageGalleryStore: galleryStoreInstance,
  } = blogMediaStepState;

  const {
    media: uploadedMediaFiles,
    mainImage: selectedMainImageUrl,
    sliderImages: configuredSliderImages,
  } = currentFormValues;

  const { isMobile: isMobileViewport } = userInterfaceState;

  const handlePreviewPanelToggle = () => {
    try {
      if (isGalleryStoreWithMethods(galleryStoreInstance)) {
        const toggleFunction = galleryStoreInstance.togglePreviewPanel;
        if (toggleFunction) {
          toggleFunction();
        }
      } else {
        console.warn('togglePreviewPanel function not available');
      }
    } catch (error) {
      console.warn('Preview panel toggle failed:', error);
    }
  };

  const createDefaultImageViewConfig = (): ImageViewConfig => {
    return {
      selectedImages: [],
      clickOrder: [],
      layout: {
        columns: 3,
        gridType: 'grid',
      },
      filter: 'available',
    };
  };

  const getImageViewConfig = (): ImageViewConfig => {
    try {
      if (isGalleryStoreWithMethods(galleryStoreInstance)) {
        const configFunction = galleryStoreInstance.getImageViewConfig;
        if (configFunction) {
          const result = configFunction();
          if (isValidImageViewConfig(result)) {
            return result;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get image view config:', error);
    }

    return createDefaultImageViewConfig();
  };

  const handleDynamicLayoutImageClick = (
    clickedImageUrl: string,
    clickedImageIndex: number
  ) => {
    console.log('동적 레이아웃 이미지 클릭됨:', {
      imageUrl: clickedImageUrl,
      imageIndex: clickedImageIndex,
    });
  };

  const handleKeyboardInteraction = (
    keyboardInteractionEvent: React.KeyboardEvent
  ) => {
    const { key: pressedKey } = keyboardInteractionEvent;
    if (pressedKey === 'Enter' || pressedKey === ' ') {
      keyboardInteractionEvent.preventDefault();
      handlePreviewPanelToggle();
    }
  };

  const getUploadedImagesDescription = (): string => {
    const imageCount = uploadedMediaFiles.length;
    return imageCount > 0
      ? `업로드된 이미지가 아래에 표시됩니다. (${imageCount}개)`
      : '업로드된 이미지가 여기에 표시됩니다.';
  };

  const getMainImageIndex = (): number => {
    if (!selectedMainImageUrl) {
      return -1;
    }
    return uploadedMediaFiles.indexOf(selectedMainImageUrl);
  };

  const getMainImageUrl = (): string => {
    return selectedMainImageUrl || '';
  };

  const shouldShowImageSections = (): boolean => {
    return uploadedMediaFiles.length > 0;
  };

  const renderMobilePreviewButton = () => {
    return (
      <button
        type="button"
        className={`absolute top-0 right-0 bg-primary text-white px-4 py-2 rounded-full shadow-lg transition-all hover:bg-primary-600 active:scale-95 flex items-center gap-2 ${
          isMobileViewport ? 'block' : 'hidden'
        }`}
        onClick={handlePreviewPanelToggle}
        aria-label="미리보기 패널 토글 버튼"
        aria-expanded={false}
        aria-controls="preview-panel"
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyboardInteraction}
      >
        <Icon icon="lucide:eye" aria-hidden="true" role="presentation" />
        <span className="text-sm font-medium">미리보기</span>
      </button>
    );
  };

  const renderGuideSection = () => {
    return (
      <section
        className="relative p-4 mb-6 mt-[46px] rounded-lg bg-default-50"
        role="region"
        aria-labelledby="media-guide-title"
      >
        <h3
          id="media-guide-title"
          className="mb-2 text-lg font-medium"
          role="heading"
          aria-level={3}
        >
          블로그 미디어 입력 안내
        </h3>
        <p
          className="text-default-600"
          id="media-guide-description"
          role="text"
        >
          블로그에 첨부할 이미지를 업로드해주세요. 파일을 드래그하여
          업로드하거나 파일 선택 버튼을 클릭하여 업로드할 수 있습니다. 지원
          형식: JPG, PNG, SVG (최대 10MB).
        </p>
      </section>
    );
  };

  const renderUploadSection = () => {
    return (
      <AccordionField
        title="미디어 업로드"
        description="이미지 파일을 업로드해주세요."
        defaultExpanded={true}
        id="media-upload-section"
      >
        <ImageUploadContainer />
      </AccordionField>
    );
  };

  const renderGallerySection = () => {
    return (
      <AccordionField
        title="업로드된 이미지"
        description={getUploadedImagesDescription()}
        defaultExpanded={true}
      >
        <ImageGalleryContainer
          mediaFiles={uploadedMediaFiles}
          mainImage={selectedMainImageUrl}
          sliderImages={configuredSliderImages}
        />
      </AccordionField>
    );
  };

  const renderMainImageSection = () => {
    return (
      <AccordionField
        title="메인 이미지 관리"
        description="블로그 대표 이미지를 설정하고 관리해주세요."
        defaultExpanded={true}
      >
        <MainImageContainer
          imageUrl={getMainImageUrl()}
          imageIndex={getMainImageIndex()}
        />
      </AccordionField>
    );
  };

  const renderImageViewBuilderSection = () => {
    if (!shouldShowImageSections()) {
      return null;
    }

    return (
      <AccordionField
        title="이미지 뷰 만들기"
        description="사용 가능한 이미지로 나만의 갤러리를 만들어보세요."
        defaultExpanded={true}
      >
        <ImageViewBuilderPanel
          mediaFiles={uploadedMediaFiles}
          mainImage={selectedMainImageUrl}
          sliderImages={configuredSliderImages}
        />
      </AccordionField>
    );
  };

  const renderDynamicLayoutSection = () => {
    if (!shouldShowImageSections()) {
      return null;
    }

    return (
      <AccordionField
        title="동적 이미지 레이아웃"
        description="선택된 이미지들을 다양한 레이아웃으로 미리보기할 수 있습니다."
        defaultExpanded={false}
      >
        <DynamicLayoutRenderer
          config={getImageViewConfig()}
          showNumbers={true}
          onImageClick={handleDynamicLayoutImageClick}
        />
      </AccordionField>
    );
  };

  const renderSliderSection = () => {
    return (
      <AccordionField
        title="이미지 슬라이더"
        description="블로그 하단에 표시될 이미지 슬라이더를 위한 이미지들을 선택해주세요."
        defaultExpanded={true}
      >
        <ImageSliderContainer />
      </AccordionField>
    );
  };

  return (
    <main role="main" aria-label="블로그 미디어 관리">
      {renderMobilePreviewButton()}
      {renderGuideSection()}
      {renderUploadSection()}
      {renderGallerySection()}
      {renderMainImageSection()}
      {renderImageViewBuilderSection()}
      {renderDynamicLayoutSection()}
      {renderSliderSection()}
    </main>
  );
}

export default BlogMediaStepContainer;
