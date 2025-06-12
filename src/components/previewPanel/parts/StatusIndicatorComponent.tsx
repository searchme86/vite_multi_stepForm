// 상태 표시기 컴포넌트
import React from 'react';
import { Icon } from '@iconify/react';
import {
  EditorStatusInfo,
  DisplayContent,
  CustomGalleryView,
} from '../types/previewPanel.types';

interface StatusIndicatorComponentProps {
  mainImage: string | null;
  media: string[];
  sliderImages: string[];
  customGalleryViews: CustomGalleryView[];
  editorStatusInfo: EditorStatusInfo;
  displayContent: DisplayContent;
  isUsingFallbackImage: boolean;
}

function StatusIndicatorComponent({
  mainImage,
  media,
  sliderImages,
  customGalleryViews,
  editorStatusInfo,
  displayContent,
  isUsingFallbackImage,
}: StatusIndicatorComponentProps) {
  console.log('📊 상태 표시기 렌더링');

  return (
    <>
      {isUsingFallbackImage && media && media.length > 0 && (
        <div className="flex items-center gap-2 p-2 mb-4 border rounded-md bg-warning-50 border-warning-200">
          <Icon
            icon="lucide:alert-triangle"
            className="flex-shrink-0 text-warning"
          />
          <p className="text-xs text-warning-700">
            메인 이미지가 선택되지 않아 첫 번째 이미지가 자동으로 사용됩니다.
          </p>
        </div>
      )}

      {mainImage && (
        <div className="flex items-center gap-2 p-2 mb-4 border rounded-md bg-success-50 border-success-200">
          <Icon
            icon="lucide:check-circle"
            className="flex-shrink-0 text-success"
          />
          <p className="text-xs text-success-700">
            메인 이미지가 설정되어 미리보기에 표시됩니다. (실시간 연동)
          </p>
        </div>
      )}

      {sliderImages && sliderImages.length > 0 && (
        <div className="flex items-center gap-2 p-2 mb-4 border rounded-md bg-info-50 border-info-200">
          <Icon icon="lucide:play-circle" className="flex-shrink-0 text-info" />
          <p className="text-xs text-info-700">
            슬라이더 이미지 {sliderImages.length}개가 설정되어 갤러리로
            표시됩니다. (실시간 연동)
          </p>
        </div>
      )}

      {customGalleryViews && customGalleryViews.length > 0 && (
        <div className="flex items-center gap-2 p-2 mb-4 border rounded-md bg-success-50 border-success-200">
          <Icon
            icon="lucide:check-circle"
            className="flex-shrink-0 text-success"
          />
          <p className="text-xs text-success-700">
            사용자 정의 갤러리 {customGalleryViews.length}개가 표시됩니다.
          </p>
        </div>
      )}

      {editorStatusInfo.hasEditor && (
        <div
          className={`flex items-center gap-2 p-2 mb-4 border rounded-md ${
            editorStatusInfo.isCompleted
              ? 'bg-success-50 border-success-200'
              : 'bg-info-50 border-info-200'
          }`}
        >
          <Icon
            icon={
              editorStatusInfo.isCompleted
                ? 'lucide:check-circle'
                : 'lucide:edit'
            }
            className={`flex-shrink-0 ${
              editorStatusInfo.isCompleted ? 'text-success' : 'text-info'
            }`}
          />
          <p
            className={`text-xs ${
              editorStatusInfo.isCompleted
                ? 'text-success-700'
                : 'text-info-700'
            }`}
          >
            {editorStatusInfo.isCompleted
              ? `모듈화된 에디터로 작성 완료! (컨테이너 ${editorStatusInfo.containerCount}개, 단락 ${editorStatusInfo.paragraphCount}개 조합)`
              : `모듈화된 에디터 사용 중 (컨테이너 ${editorStatusInfo.containerCount}개, 할당된 단락 ${editorStatusInfo.paragraphCount}개)`}
          </p>
        </div>
      )}

      {displayContent.source === 'editor' && (
        <div className="flex items-center gap-2 p-2 mb-4 border border-purple-200 rounded-md bg-purple-50">
          <Icon
            icon="lucide:sparkles"
            className="flex-shrink-0 text-purple-600"
          />
          <p className="text-xs text-purple-700">
            ✨ 현재 모듈화된 에디터 결과가 표시되고 있습니다. (레고 블록식 조합)
          </p>
        </div>
      )}
    </>
  );
}

export default StatusIndicatorComponent;
