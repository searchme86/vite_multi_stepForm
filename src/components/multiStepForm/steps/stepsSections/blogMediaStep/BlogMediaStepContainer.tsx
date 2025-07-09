// src/components/multiStepForm/steps/stepsSections/blogMediaStep/BlogMediaStepContainer.tsx

import React from 'react';

import AccordionField from '../../../../accordion-field';
import { useBlogMediaStepState } from './hooks/useBlogMediaStepState';

import ImageUploadContainer from './imageUpload/ImageUploadContainer';
import ImageSliderContainer from './imageSlider/ImageSliderContainer';
import MainImageContainer from './mainImage/MainImageContainer';
import ImageGalleryContainer from './imageGallery/ImageGalleryContainer';

function BlogMediaStepContainer(): React.ReactNode {
  const blogMediaStepState = useBlogMediaStepState();

  const { formValues: currentFormValues } = blogMediaStepState;

  const {
    media: uploadedMediaFiles,
    mainImage: selectedMainImageUrl,
    sliderImages: configuredSliderImages,
  } = currentFormValues;

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

  const renderGuideSection = () => {
    return (
      <section
        className="relative p-4 mb-6 rounded-lg bg-default-50"
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

  const renderImageGallerySection = () => {
    console.log('🔧 renderImageGallerySection 호출:', {
      shouldShow: shouldShowImageSections(),
      mediaCount: uploadedMediaFiles.length,
    });

    if (!shouldShowImageSections()) {
      console.log('📋 이미지가 없어서 갤러리 섹션 숨김');
      return null;
    }

    console.log('🎨 ImageGallery 섹션 렌더링:', {
      mediaFiles: uploadedMediaFiles.length,
      mainImage: selectedMainImageUrl,
      sliderImages: configuredSliderImages.length,
    });

    return (
      <ImageGalleryContainer
        mediaFiles={uploadedMediaFiles}
        mainImage={selectedMainImageUrl}
        sliderImages={configuredSliderImages}
      />
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

  console.log('🔧 BlogMediaStepContainer 렌더링:', {
    mediaCount: uploadedMediaFiles.length,
    hasMainImage: !!selectedMainImageUrl,
    sliderCount: configuredSliderImages.length,
    shouldShowImageSections: shouldShowImageSections(),
    timestamp: new Date().toLocaleTimeString(),
  });

  return (
    <main role="main" aria-label="블로그 미디어 관리">
      {renderGuideSection()}
      {renderUploadSection()}
      {renderMainImageSection()}
      {renderImageGallerySection()}
      {renderSliderSection()}
    </main>
  );
}

export default BlogMediaStepContainer;
