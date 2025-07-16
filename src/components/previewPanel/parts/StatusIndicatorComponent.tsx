// src/components/previewPanel/parts/StatusIndicatorComponent.tsx

import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';

// 에디터 상태 정보 타입 정의
interface EditorStatusInfo {
  isCompleted: boolean;
  contentLength: number;
  hasContainers: boolean;
  hasParagraphs: boolean;
  hasEditor: boolean;
  containerCount: number;
  paragraphCount: number;
}

// 디스플레이 콘텐츠 타입 정의
interface DisplayContent {
  text: string;
  source: 'editor' | 'basic';
}

// 커스텀 갤러리 뷰 타입 정의
interface CustomGalleryView {
  id: string;
  name: string;
  images: string[];
}

// 컴포넌트 Props 타입 정의
interface StatusIndicatorComponentProps {
  mainImage: string | null;
  media: string[];
  sliderImages: string[];
  customGalleryViews: CustomGalleryView[];
  editorStatusInfo: EditorStatusInfo;
  displayContent: DisplayContent;
  isUsingFallbackImage: boolean;
}

/**
 * 상태 표시기 컴포넌트 - 데이터 구조 변경 반영 버전
 *
 * 변경사항:
 * - 1-3단계에서 변경된 데이터 구조에 맞춰 조정
 * - 타입 안전성 향상
 * - 기존 UI 동작 방식 유지
 *
 * @param props - 컴포넌트 props
 * @returns 상태 표시기 JSX
 */
function StatusIndicatorComponent({
  mainImage,
  media,
  sliderImages,
  customGalleryViews,
  editorStatusInfo,
  displayContent,
  isUsingFallbackImage,
}: StatusIndicatorComponentProps): React.ReactNode {
  console.log(
    '📊 [STATUS_INDICATOR] 상태 표시기 렌더링 시작 (데이터 구조 조정 버전)'
  );

  // 🎯 Props 데이터 유효성 검증
  const hasMainImage = mainImage !== null && mainImage !== undefined;
  const hasMedia = Array.isArray(media) && media.length > 0;
  const hasSliderImages =
    Array.isArray(sliderImages) && sliderImages.length > 0;
  const hasCustomGalleryViews =
    Array.isArray(customGalleryViews) && customGalleryViews.length > 0;
  const hasEditorStatusInfo =
    editorStatusInfo !== null && editorStatusInfo !== undefined;
  const hasDisplayContent =
    displayContent !== null && displayContent !== undefined;

  console.log('📊 [STATUS_INDICATOR] Props 데이터 유효성 검증:', {
    hasMainImage,
    hasMedia,
    mediaCount: hasMedia ? media.length : 0,
    hasSliderImages,
    sliderImagesCount: hasSliderImages ? sliderImages.length : 0,
    hasCustomGalleryViews,
    customGalleryViewsCount: hasCustomGalleryViews
      ? customGalleryViews.length
      : 0,
    hasEditorStatusInfo,
    hasDisplayContent,
    isUsingFallbackImage,
    timestamp: new Date().toISOString(),
  });

  // 🎯 에디터 상태 정보 안전한 접근
  const safeEditorStatusInfo = useMemo(() => {
    if (!hasEditorStatusInfo) {
      return {
        isCompleted: false,
        contentLength: 0,
        hasContainers: false,
        hasParagraphs: false,
        hasEditor: false,
        containerCount: 0,
        paragraphCount: 0,
      };
    }

    return {
      isCompleted: editorStatusInfo.isCompleted ?? false,
      contentLength: editorStatusInfo.contentLength ?? 0,
      hasContainers: editorStatusInfo.hasContainers ?? false,
      hasParagraphs: editorStatusInfo.hasParagraphs ?? false,
      hasEditor: editorStatusInfo.hasEditor ?? false,
      containerCount: editorStatusInfo.containerCount ?? 0,
      paragraphCount: editorStatusInfo.paragraphCount ?? 0,
    };
  }, [hasEditorStatusInfo, editorStatusInfo]);

  // 🎯 디스플레이 콘텐츠 안전한 접근
  const safeDisplayContent = useMemo(() => {
    if (!hasDisplayContent) {
      return {
        text: '',
        source: 'basic' as const,
      };
    }

    return {
      text: displayContent.text ?? '',
      source: displayContent.source ?? ('basic' as const),
    };
  }, [hasDisplayContent, displayContent]);

  console.log('📊 [STATUS_INDICATOR] 안전한 데이터 처리 완료:', {
    safeEditorStatusInfo,
    safeDisplayContent,
    timestamp: new Date().toISOString(),
  });

  // 🎯 각 상태별 표시기 렌더링 함수들
  const renderFallbackImageWarning = () => {
    const shouldShowWarning = isUsingFallbackImage && hasMedia;

    if (!shouldShowWarning) return null;

    console.log('⚠️ [STATUS_INDICATOR] 폴백 이미지 경고 표시');

    return (
      <div className="flex items-center gap-2 p-2 mb-4 border rounded-md bg-warning-50 border-warning-200">
        <Icon
          icon="lucide:alert-triangle"
          className="flex-shrink-0 text-warning"
        />
        <p className="text-xs text-warning-700">
          메인 이미지가 선택되지 않아 첫 번째 이미지가 자동으로 사용됩니다.
        </p>
      </div>
    );
  };

  const renderMainImageStatus = () => {
    if (!hasMainImage) return null;

    console.log('✅ [STATUS_INDICATOR] 메인 이미지 상태 표시');

    return (
      <div className="flex items-center gap-2 p-2 mb-4 border rounded-md bg-success-50 border-success-200">
        <Icon
          icon="lucide:check-circle"
          className="flex-shrink-0 text-success"
        />
        <p className="text-xs text-success-700">
          메인 이미지가 설정되어 미리보기에 표시됩니다. (실시간 연동)
        </p>
      </div>
    );
  };

  const renderSliderImagesStatus = () => {
    if (!hasSliderImages) return null;

    console.log('🎬 [STATUS_INDICATOR] 슬라이더 이미지 상태 표시');

    return (
      <div className="flex items-center gap-2 p-2 mb-4 border rounded-md bg-info-50 border-info-200">
        <Icon icon="lucide:play-circle" className="flex-shrink-0 text-info" />
        <p className="text-xs text-info-700">
          슬라이더 이미지 {sliderImages.length}개가 설정되어 갤러리로
          표시됩니다. (실시간 연동)
        </p>
      </div>
    );
  };

  const renderCustomGalleryViewsStatus = () => {
    if (!hasCustomGalleryViews) return null;

    console.log('🎨 [STATUS_INDICATOR] 커스텀 갤러리 뷰 상태 표시');

    return (
      <div className="flex items-center gap-2 p-2 mb-4 border rounded-md bg-success-50 border-success-200">
        <Icon
          icon="lucide:check-circle"
          className="flex-shrink-0 text-success"
        />
        <p className="text-xs text-success-700">
          사용자 정의 갤러리 {customGalleryViews.length}개가 표시됩니다.
        </p>
      </div>
    );
  };

  const renderEditorStatus = () => {
    if (!safeEditorStatusInfo.hasEditor) return null;

    const statusColorClass = safeEditorStatusInfo.isCompleted
      ? 'bg-success-50 border-success-200'
      : 'bg-info-50 border-info-200';

    const iconName = safeEditorStatusInfo.isCompleted
      ? 'lucide:check-circle'
      : 'lucide:edit';

    const iconColorClass = safeEditorStatusInfo.isCompleted
      ? 'text-success'
      : 'text-info';

    const textColorClass = safeEditorStatusInfo.isCompleted
      ? 'text-success-700'
      : 'text-info-700';

    const statusMessage = safeEditorStatusInfo.isCompleted
      ? `모듈화된 에디터로 작성 완료! (컨테이너 ${safeEditorStatusInfo.containerCount}개, 단락 ${safeEditorStatusInfo.paragraphCount}개 조합)`
      : `모듈화된 에디터 사용 중 (컨테이너 ${safeEditorStatusInfo.containerCount}개, 할당된 단락 ${safeEditorStatusInfo.paragraphCount}개)`;

    console.log('📝 [STATUS_INDICATOR] 에디터 상태 표시:', {
      isCompleted: safeEditorStatusInfo.isCompleted,
      containerCount: safeEditorStatusInfo.containerCount,
      paragraphCount: safeEditorStatusInfo.paragraphCount,
    });

    return (
      <div
        className={`flex items-center gap-2 p-2 mb-4 border rounded-md ${statusColorClass}`}
      >
        <Icon icon={iconName} className={`flex-shrink-0 ${iconColorClass}`} />
        <p className={`text-xs ${textColorClass}`}>{statusMessage}</p>
      </div>
    );
  };

  const renderEditorSourceStatus = () => {
    const isEditorSource = safeDisplayContent.source === 'editor';

    if (!isEditorSource) return null;

    console.log('✨ [STATUS_INDICATOR] 에디터 소스 상태 표시');

    return (
      <div className="flex items-center gap-2 p-2 mb-4 border border-purple-200 rounded-md bg-purple-50">
        <Icon
          icon="lucide:sparkles"
          className="flex-shrink-0 text-purple-600"
        />
        <p className="text-xs text-purple-700">
          ✨ 현재 모듈화된 에디터 결과가 표시되고 있습니다. (레고 블록식 조합)
        </p>
      </div>
    );
  };

  console.log('📊 [STATUS_INDICATOR] 상태 표시기 렌더링 완료');

  return (
    <>
      {renderFallbackImageWarning()}
      {renderMainImageStatus()}
      {renderSliderImagesStatus()}
      {renderCustomGalleryViewsStatus()}
      {renderEditorStatus()}
      {renderEditorSourceStatus()}
    </>
  );
}

export default StatusIndicatorComponent;
