// 📁 src/components/moduleEditor/parts/TiptapEditor/EditorStatusBar.tsx

import { Icon } from '@iconify/react';

// 글자 수 계산 인터페이스
interface CharacterCount {
  withSpaces: number;
  withoutSpaces: number;
  words: number;
  paragraphs: number;
}

interface EditorStatusBarProps {
  isContentChanged: boolean;
  isUploadingImage: boolean;
  uploadError: string | null;
  onErrorClose: () => void;
  characterCount?: CharacterCount;
  copyFeedback?: string | null;
}

function EditorStatusBar({
  isContentChanged,
  isUploadingImage,
  uploadError,
  onErrorClose,
  characterCount,
  copyFeedback,
}: EditorStatusBarProps) {
  console.log('📊 [EDITOR_STATUS] 상태 렌더링:', {
    isContentChanged,
    isUploadingImage,
    hasError: !!uploadError,
    hasCharacterCount: !!characterCount,
    hasCopyFeedback: !!copyFeedback,
  });

  // 🔧 기존 로직: 기본 상태만 있을 때는 null 반환하지 않고 글자 수 표시
  const hasBasicStatus = isContentChanged || isUploadingImage || uploadError;
  const hasCharacterCount =
    characterCount &&
    (characterCount.withSpaces > 0 || characterCount.withoutSpaces > 0);
  const hasCopyFeedback = copyFeedback;

  // 🚀 새로운 로직: 글자 수나 복사 피드백이 있으면 항상 표시
  if (!hasBasicStatus && !hasCharacterCount && !hasCopyFeedback) {
    // 기존 로직 유지: 아무것도 없으면 글자 수 기본값 표시
    return (
      <div className="flex items-center justify-between px-3 py-2 text-xs border-b border-gray-200 bg-gray-50">
        <div className="flex-1"></div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-gray-400">
            <Icon icon="lucide:type" className="w-3 h-3" />
            <span>공백포함: 0자</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <Icon icon="lucide:minus" className="w-3 h-3" />
            <span>공백제외: 0자</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200">
      {/* 🔧 기존 상태 표시 로직 그대로 유지 */}
      {isContentChanged && (
        <div className="flex items-center gap-1 p-2 text-xs text-blue-600 animate-pulse bg-blue-50">
          <Icon icon="lucide:clock" className="text-blue-500" />
          변경사항이 저장 대기 중입니다...
        </div>
      )}

      {isUploadingImage && (
        <div className="flex items-center gap-1 p-2 text-xs text-green-600 animate-pulse bg-green-50">
          <Icon
            icon="lucide:loader-2"
            className="text-green-500 animate-spin"
          />
          이미지를 업로드하고 있습니다...
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-1 p-2 text-xs text-red-600 bg-red-50">
          <Icon icon="lucide:alert-circle" className="text-red-500" />
          {uploadError}
          <button
            type="button"
            className="ml-2 text-xs underline"
            onClick={onErrorClose}
          >
            닫기
          </button>
        </div>
      )}

      {/* 🚀 새로운 글자 수 카운터 및 복사 피드백 영역 */}
      <div className="flex items-center justify-between px-3 py-2 text-xs bg-gray-50">
        {/* 왼쪽: 복사 피드백 및 상태 표시 */}
        <div className="flex items-center gap-3">
          {copyFeedback && (
            <div className="flex items-center gap-1 text-green-600">
              <Icon icon="lucide:check-circle" className="w-3 h-3" />
              <span>{copyFeedback}</span>
            </div>
          )}

          {/* 추가 상태 표시 공간 (필요시 확장 가능) */}
        </div>

        {/* 오른쪽: 글자 수 카운터 */}
        <div className="flex items-center gap-4">
          {/* 🔢 공백 포함 글자 수 */}
          <div className="flex items-center gap-1 text-gray-600">
            <Icon icon="lucide:type" className="w-3 h-3" />
            <span>
              공백포함: {characterCount?.withSpaces?.toLocaleString() || 0}자
            </span>
          </div>

          {/* 🔢 공백 제외 글자 수 */}
          <div className="flex items-center gap-1 text-gray-600">
            <Icon icon="lucide:minus" className="w-3 h-3" />
            <span>
              공백제외: {characterCount?.withoutSpaces?.toLocaleString() || 0}자
            </span>
          </div>

          {/* 📝 단어 수 (5개 이상일 때만 표시) */}
          {characterCount && characterCount.words >= 5 && (
            <div className="flex items-center gap-1 text-gray-500">
              <Icon icon="lucide:file-text" className="w-3 h-3" />
              <span>단어: {characterCount.words.toLocaleString()}개</span>
            </div>
          )}

          {/* 📄 문단 수 (2개 이상일 때만 표시) */}
          {characterCount && characterCount.paragraphs >= 2 && (
            <div className="flex items-center gap-1 text-gray-500">
              <Icon icon="lucide:align-left" className="w-3 h-3" />
              <span>문단: {characterCount.paragraphs.toLocaleString()}개</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditorStatusBar;
