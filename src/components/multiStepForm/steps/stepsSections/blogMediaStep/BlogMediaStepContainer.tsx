// blogMediaStep/BlogMediaStepContainer.tsx - BlogMediaStep 컴포넌트

/**
 * BlogMediaStep 컴포넌트 - 메인 통합 컨테이너
 * 4개 기능 컨테이너(업로드, 갤러리, 메인이미지, 슬라이더)를 조합하여 완전한 미디어 관리 기능 제공
 * 기존 BlogMediaStep 컴포넌트의 구조와 기능을 유지하면서 모듈화된 형태로 재구성
 */

import React from 'react';
import { Button, Icon } from '@heroui/react';
import AccordionField from '../components/accordion-field';
import { useBlogMediaStepState } from './hooks/useBlogMediaStepState';

// ✅ 4개 기능 컨테이너들 import
import ImageUploadContainer from './imageUpload/ImageUploadContainer';
import ImageGalleryContainer from './imageGallery/ImageGalleryContainer';
import ImageSliderContainer from './imageSlider/ImageSliderContainer';
import ImageViewBuilder from './components/multiStepForm/steps/ImageViewBuilder';

// ✅ 컨테이너 props 타입 (기존과 동일하게 빈 props)
interface BlogMediaStepContainerProps {}

/**
 * BlogMediaStep 메인 컨테이너 컴포넌트
 * 4개 기능 컨테이너를 AccordionField로 구성하여 통합 관리
 */
function BlogMediaStepContainer(
  props: BlogMediaStepContainerProps
): React.ReactNode {
  console.log('🔧 BlogMediaStepContainer 렌더링 시작:', {
    timestamp: new Date().toLocaleTimeString(),
  }); // 디버깅용

  // ✅ 통합 상태 관리 훅
  const { formValues, uiState, imageGalleryStore } = useBlogMediaStepState();

  const { media: mediaFiles, mainImage, sliderImages } = formValues;
  const { isMobile } = uiState;

  // ✅ 미리보기 패널 토글 함수 (기존 로직 유지)
  const togglePreviewPanel = imageGalleryStore.togglePreviewPanel;

  console.log('📊 BlogMediaStepContainer 상태:', {
    mediaCount: mediaFiles.length,
    hasMainImage: !!mainImage,
    sliderCount: sliderImages.length,
    isMobile,
  }); // 디버깅용

  return (
    <>
      {/* ✅ 모바일 미리보기 토글 버튼 (기존 위치와 스타일 유지) */}
      <button
        type="button"
        className={`absolute top-0 right-0 bg-primary text-white px-4 py-2 rounded-full shadow-lg transition-all hover:bg-primary-600 active:scale-95 flex items-center gap-2 ${
          isMobile ? 'block' : 'hidden'
        }`}
        onClick={togglePreviewPanel}
        aria-label="미리보기 패널 토글"
      >
        <Icon icon="lucide:eye" />
        <span className="text-sm font-medium">미리보기</span>
      </button>

      {/* ✅ 안내 메시지 (기존과 동일) */}
      <div className="relative p-4 mb-6 mt-[46px] rounded-lg bg-default-50">
        <h3 className="mb-2 text-lg font-medium">블로그 미디어 입력 안내</h3>
        <p className="text-default-600">
          블로그에 첨부할 이미지를 업로드해주세요. 파일을 드래그하여
          업로드하거나 파일 선택 버튼을 클릭하여 업로드할 수 있습니다. 지원
          형식: JPG, PNG, SVG (최대 10MB).
        </p>
      </div>

      {/* ✅ 1. 이미지 업로드 섹션 */}
      <AccordionField
        title="미디어 업로드"
        description="이미지 파일을 업로드해주세요."
        defaultExpanded={true}
        id="media-upload-section"
      >
        <ImageUploadContainer />
      </AccordionField>

      {/* ✅ 2. 업로드된 이미지 갤러리 섹션 */}
      <AccordionField
        title="업로드된 이미지"
        description={
          mediaFiles.length > 0
            ? `업로드된 이미지가 아래에 표시됩니다. (${mediaFiles.length}개)`
            : '업로드된 이미지가 여기에 표시됩니다.'
        }
        defaultExpanded={true}
      >
        <ImageGalleryContainer />
      </AccordionField>

      {/* ✅ 3. 이미지 뷰 빌더 섹션 (기존 조건부 렌더링 유지) */}
      {mediaFiles.length > 0 && (
        <ImageViewBuilder
          mediaFiles={mediaFiles}
          mainImage={mainImage}
          sliderImages={sliderImages}
        />
      )}

      {/* ✅ 4. 이미지 슬라이더 섹션 */}
      <AccordionField
        title="이미지 슬라이더"
        description="블로그 하단에 표시될 이미지 슬라이더를 위한 이미지들을 선택해주세요."
        defaultExpanded={true}
      >
        <ImageSliderContainer />
      </AccordionField>
    </>
  );
}

export default BlogMediaStepContainer;
