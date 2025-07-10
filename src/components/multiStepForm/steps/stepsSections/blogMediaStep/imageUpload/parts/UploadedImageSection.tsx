// blogMediaStep/imageUpload/parts/UploadedImageSection.tsx

import React from 'react';
import {
  type DeleteConfirmState,
  type DuplicateMessageState,
  type MainImageHandlers,
} from '../types/imageUploadTypes';
import ImageList from './ImageList';
import DuplicateMessage from './DuplicateMessage';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import UploadSummary from './UploadSummary';

interface UploadedImageSectionProps {
  mediaFiles: string[];
  selectedFileNames: string[];
  deleteConfirmState: DeleteConfirmState;
  duplicateMessageState: DuplicateMessageState;
  touchActiveImages: Set<number>;
  isMobileDevice: boolean;
  onDeleteButtonClick: (imageIndex: number, imageDisplayName: string) => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onImageTouch: (imageIndex: number) => void;

  // ✅ Phase3: 메인 이미지 관련 props 추가
  mainImageHandlers?: MainImageHandlers;
}

function UploadedImageSection({
  mediaFiles,
  selectedFileNames,
  deleteConfirmState,
  duplicateMessageState,
  touchActiveImages,
  isMobileDevice,
  onDeleteButtonClick,
  onDeleteConfirm,
  onDeleteCancel,
  onImageTouch,

  // ✅ Phase3: 메인 이미지 핸들러 구조분해할당
  mainImageHandlers,
}: UploadedImageSectionProps): React.ReactNode {
  console.log(
    '🖼️ [UPLOADED_SECTION] UploadedImageSection 렌더링 - Phase3 메인이미지추가:',
    {
      mediaFilesCount: mediaFiles.length,
      selectedFileNamesCount: selectedFileNames.length,
      deleteConfirmVisible: deleteConfirmState.isVisible,
      duplicateMessageVisible: duplicateMessageState.isVisible,
      touchActiveImagesCount: touchActiveImages.size,
      isMobileDevice,
      hasMainImageHandlers: mainImageHandlers ? true : false,
      timestamp: new Date().toLocaleTimeString(),
    }
  );

  const hasUploadedImages = mediaFiles.length > 0;

  if (!hasUploadedImages) {
    console.log('⚠️ [UPLOADED_SECTION] 업로드된 이미지가 없음');
    return null;
  }

  // ✅ Phase3: 메인 이미지 핸들러 상태 확인
  const hasMainImageHandlers = mainImageHandlers ? true : false;
  const {
    onMainImageSet: handleMainImageSetAction,
    onMainImageCancel: handleMainImageCancelAction,
    checkIsMainImage: checkIsMainImageFunction,
    checkCanSetAsMainImage: checkCanSetAsMainImageFunction,
  } = mainImageHandlers ?? {
    onMainImageSet: undefined,
    onMainImageCancel: undefined,
    checkIsMainImage: undefined,
    checkCanSetAsMainImage: undefined,
  };

  console.log('🖼️ [UPLOADED_SECTION] 메인 이미지 핸들러 상태 - Phase3:', {
    hasMainImageHandlers,
    hasSetHandler: handleMainImageSetAction ? true : false,
    hasCancelHandler: handleMainImageCancelAction ? true : false,
    hasCheckIsMainHandler: checkIsMainImageFunction ? true : false,
    hasCheckCanSetHandler: checkCanSetAsMainImageFunction ? true : false,
  });

  const footerMinHeight = deleteConfirmState.isVisible ? '120px' : '60px';

  return (
    <section
      className="p-4 border border-gray-200 rounded-lg bg-gray-50"
      role="region"
      aria-labelledby="uploaded-images-heading"
    >
      <header className="flex items-center justify-between mb-4">
        <h3
          id="uploaded-images-heading"
          className="text-lg font-semibold text-gray-800"
        >
          업로드된 이미지들 ({mediaFiles.length}개)
          {/* ✅ Phase3: 메인 이미지 기능 상태 표시 */}
          {hasMainImageHandlers && (
            <span className="px-2 py-1 ml-2 text-xs text-blue-700 bg-blue-100 rounded-full">
              메인 이미지 설정 가능
            </span>
          )}
        </h3>

        <DuplicateMessage duplicateMessageState={duplicateMessageState} />
      </header>

      {/* ✅ Phase3: ImageList에 메인 이미지 핸들러 전달 */}
      <ImageList
        mediaFiles={mediaFiles}
        selectedFileNames={selectedFileNames}
        touchActiveImages={touchActiveImages}
        isMobileDevice={isMobileDevice}
        onImageTouch={onImageTouch}
        onDeleteButtonClick={onDeleteButtonClick}
        mainImageHandlers={mainImageHandlers}
      />

      <footer
        className="relative p-3 mt-4 overflow-hidden border border-blue-200 rounded-lg bg-blue-50"
        style={{ minHeight: footerMinHeight }}
      >
        <UploadSummary
          mediaFiles={mediaFiles}
          deleteConfirmState={deleteConfirmState}
          isMobileDevice={isMobileDevice}
        />

        <DeleteConfirmDialog
          deleteConfirmState={deleteConfirmState}
          onConfirm={onDeleteConfirm}
          onCancel={onDeleteCancel}
        />
      </footer>

      {/* ✅ Phase3: 메인 이미지 도움말 추가
      {hasMainImageHandlers && mediaFiles.length > 0 && (
        <div className="p-3 mt-3 border border-green-200 rounded-lg bg-green-50">
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-green-800">
              <p className="font-medium">메인 이미지 설정 안내</p>
              <p className="mt-1">
                이미지에 마우스를 올리고{' '}
                <span className="inline-flex items-center px-1 py-0.5 bg-green-200 rounded text-xs font-mono">
                  🏠
                </span>{' '}
                버튼을 클릭하여 메인 이미지로 설정할 수 있습니다.
                {isMobileDevice &&
                  ' 모바일에서는 이미지를 터치한 후 버튼을 선택하세요.'}
              </p>
            </div>
          </div>
        </div>
      )} */}
    </section>
  );
}

export default UploadedImageSection;
