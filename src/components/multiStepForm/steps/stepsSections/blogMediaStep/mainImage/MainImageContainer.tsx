// blogMediaStep/mainImage/MainImageContainer.tsx

import React from 'react';
import { useBlogMediaStepState } from '../hooks/useBlogMediaStepState';
import { useMainImageValidation } from './hooks/useMainImageValidation';

interface MainImageContainerProps {
  className?: string;
}

function MainImageContainer({
  className: additionalCssClasses = '',
}: MainImageContainerProps): React.ReactNode {
  console.log('🚀 MainImageContainer 렌더링 시작 - 미리보기 전용:', {
    hasAdditionalClasses: additionalCssClasses ? true : false,
    timestamp: new Date().toLocaleTimeString(),
  });

  const blogMediaStepState = useBlogMediaStepState();
  const { formValues: currentFormValues } = blogMediaStepState ?? {};
  const safeFormValues = currentFormValues ?? {};
  const { media: mediaFilesList = [], mainImage: currentMainImageUrl = '' } =
    safeFormValues;

  console.log('🔧 MainImageContainer 상태 확인:', {
    hasFormValues: currentFormValues ? true : false,
    mediaFilesCount: mediaFilesList.length,
    hasMainImage: currentMainImageUrl ? true : false,
    timestamp: new Date().toLocaleTimeString(),
  });

  const mainImageValidationHook = useMainImageValidation({
    formValues: currentFormValues ?? {},
  });
  const { getMainImageValidationStatus } = mainImageValidationHook;

  const hasMainImage = currentMainImageUrl ? true : false;
  const hasMediaFiles = mediaFilesList.length > 0;
  const validationStatus = getMainImageValidationStatus();
  const { isValidMainImage, issues: validationIssueList } = validationStatus;

  console.log('📊 MainImageContainer 현재 상태:', {
    hasMainImage,
    hasMediaFiles,
    isValidMainImage,
    validationIssuesCount: validationIssueList.length,
    timestamp: new Date().toLocaleTimeString(),
  });

  const calculateMainImageSizeInKB = (imageUrl: string): number => {
    return Math.round(imageUrl.length / 1024);
  };

  const renderEmptyMainImageState = () => {
    console.log('🔄 renderEmptyMainImageState 호출');

    const shouldShowUploadGuide = !hasMediaFiles;
    const shouldShowSelectionGuide = hasMediaFiles && !hasMainImage;

    return (
      <div className="flex items-center justify-center p-8 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z"
              />
            </svg>
          </div>

          {shouldShowUploadGuide ? (
            <>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                메인 이미지 없음
              </h3>
              <p className="text-gray-600">
                먼저 이미지를 업로드한 후 메인 이미지를 선택해주세요.
              </p>
            </>
          ) : shouldShowSelectionGuide ? (
            <>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                메인 이미지를 선택해주세요
              </h3>
              <p className="text-gray-600">
                업로드된 이미지에 마우스를 올리고 🏠 버튼을 클릭하여
                <br />
                메인 이미지로 설정할 수 있습니다.
              </p>
            </>
          ) : null}
        </div>
      </div>
    );
  };

  const renderMainImagePreview = () => {
    if (!hasMainImage || !currentMainImageUrl) {
      return null;
    }

    console.log('🔄 renderMainImagePreview 호출:', {
      currentMainImagePreview: currentMainImageUrl.slice(0, 30) + '...',
      isValidMainImage,
    });

    const mainImageSizeKB = calculateMainImageSizeInKB(currentMainImageUrl);

    return (
      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* 헤더 영역 - 해제 버튼 제거됨 */}
        <header className="p-4 border-b border-gray-200 bg-blue-50">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-900">
              현재 메인 이미지
            </h3>
            <p className="text-sm text-blue-700">
              블로그에 표시될 대표 이미지입니다
            </p>
            <p className="mt-1 text-xs text-blue-600">
              💡 다른 이미지로 변경하려면 상단 업로드 영역에서 🏠 버튼을
              클릭하세요
            </p>
          </div>
        </header>

        {/* 이미지 미리보기 영역 */}
        <main className="p-4">
          <div className="relative overflow-hidden bg-gray-100 rounded-lg aspect-video">
            <img
              src={currentMainImageUrl}
              alt="현재 메인 이미지 미리보기"
              className="object-cover w-full h-full"
              onLoad={(loadEvent) => {
                const { currentTarget: loadedImageElement } = loadEvent;
                const { naturalWidth, naturalHeight } = loadedImageElement;
                console.log('🖼️ [MAIN_IMAGE_PREVIEW] 메인 이미지 로드 완료:', {
                  naturalWidth,
                  naturalHeight,
                });
              }}
              onError={(errorEvent) => {
                console.error(
                  '❌ [MAIN_IMAGE_PREVIEW] 메인 이미지 로드 실패:',
                  {
                    errorEvent,
                  }
                );
              }}
            />
          </div>

          {/* 이미지 정보 표시 */}
          <div className="mt-3 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>파일 크기: {mainImageSizeKB} KB</span>
              {!isValidMainImage && (
                <span className="px-2 py-1 text-xs text-red-700 bg-red-100 rounded">
                  ⚠️ 검증 실패
                </span>
              )}
            </div>
          </div>

          {/* 검증 이슈 표시 */}
          {validationIssueList.length > 0 && (
            <div className="p-3 mt-3 border border-red-200 rounded-lg bg-red-50">
              <h4 className="mb-1 text-sm font-medium text-red-800">
                검증 오류
              </h4>
              <ul className="space-y-1 text-sm text-red-700">
                {validationIssueList.map((issueMessage, issueIndex) => (
                  <li
                    key={`validation-issue-${issueIndex}`}
                    className="flex items-start gap-1"
                  >
                    <span className="text-red-500">•</span>
                    <span>{issueMessage}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
      </div>
    );
  };

  const finalCssClasses = `space-y-4 ${additionalCssClasses}`.trim();

  console.log('🎨 MainImageContainer 최종 렌더링 준비:', {
    finalCssClasses,
    hasMainImage,
    hasMediaFiles,
    isValidMainImage,
    renderingMode: hasMainImage ? 'preview' : 'empty',
    timestamp: new Date().toLocaleTimeString(),
  });

  return (
    <section
      className={finalCssClasses}
      role="region"
      aria-labelledby="main-image-preview-section-title"
      aria-describedby="main-image-preview-section-description"
    >
      <header className="sr-only">
        <h2 id="main-image-preview-section-title">메인 이미지 미리보기 섹션</h2>
        <p id="main-image-preview-section-description">
          현재 선택된 메인 이미지를 미리보기로 확인할 수 있습니다. 이미지 변경은
          상단 업로드 영역에서 가능합니다.
        </p>
      </header>

      <main>
        {hasMainImage ? renderMainImagePreview() : renderEmptyMainImageState()}
      </main>
    </section>
  );
}

export default MainImageContainer;
