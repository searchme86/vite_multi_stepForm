// 📁 components/moduleEditor/parts/WritingStep/paragraph/ParagraphCard.tsx

import TiptapEditor from '../../TiptapEditor/TiptapEditor';
import ParagraphActions from './ParagraphActions';
import { useCallback, useMemo, useRef, useEffect } from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

type SubStep = 'structure' | 'writing';

interface EditorInternalState {
  currentSubStep: SubStep;
  isTransitioning: boolean;
  activeParagraphId: string | null;
  isPreviewOpen: boolean;
  selectedParagraphIds: string[];
  targetContainerId: string;
}

interface LocalParagraph {
  id: string;
  content: string;
  containerId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  originalId?: string;
}

interface Container {
  id: string;
  name: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ParagraphCardProps {
  paragraph: LocalParagraph;
  internalState: EditorInternalState;
  sortedContainers: Container[];
  updateLocalParagraphContent: (id: string, content: string) => void;
  toggleParagraphSelection: (id: string) => void;
  addToLocalContainer: () => void;
  setTargetContainerId: (containerId: string) => void;
  currentEditingParagraphId: string | null;
  onActivateEditMode: (paragraphId: string) => void;
  onDeactivateEditMode: () => void;
  onRegisterRef: (paragraphId: string, element: HTMLDivElement | null) => void;
}

function ParagraphCard({
  paragraph,
  internalState,
  sortedContainers,
  updateLocalParagraphContent,
  toggleParagraphSelection,
  addToLocalContainer,
  setTargetContainerId,
  currentEditingParagraphId,
  onActivateEditMode,
  onDeactivateEditMode,
  onRegisterRef,
}: ParagraphCardProps) {
  // 이 단락 카드의 최상위 DOM 요소 참조 - 스크롤 대상이 되는 요소
  const paragraphCardRef = useRef<HTMLDivElement>(null);

  // 이전에 처리된 콘텐츠를 추적하여 중복 업데이트 방지
  const lastProcessedContentRef = useRef<string>(paragraph?.content || '');

  console.log('🎴 [PARAGRAPH_CARD] 렌더링:', {
    paragraphId: paragraph?.id,
    isEditing: currentEditingParagraphId === paragraph?.id,
    hasContent: Boolean(paragraph?.content),
    containerId: paragraph?.containerId,
  });

  // 컴포넌트 마운트/언마운트 시 부모에게 DOM 요소 등록/해제
  useEffect(() => {
    const currentElement = paragraphCardRef.current;
    const paragraphId = paragraph?.id;

    if (paragraphId && onRegisterRef) {
      // 부모 컴포넌트에 이 카드의 DOM 요소 등록
      onRegisterRef(paragraphId, currentElement);
      console.log('📝 [PARAGRAPH_CARD] DOM 요소 등록:', paragraphId);
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (paragraphId && onRegisterRef) {
        onRegisterRef(paragraphId, null);
        console.log('🗑️ [PARAGRAPH_CARD] DOM 요소 해제:', paragraphId);
      }
    };
  }, [paragraph?.id, onRegisterRef]);

  // 선택된 단락 ID들을 문자열로 변환하여 비교 최적화
  const selectedParagraphIdsString = useMemo(() => {
    const { selectedParagraphIds = [] } = internalState || {};
    return Array.isArray(selectedParagraphIds)
      ? selectedParagraphIds.join(',')
      : '';
  }, [internalState?.selectedParagraphIds]);

  // 이 단락이 컨테이너에 할당되었는지 확인
  const isAssignedToContainer = useMemo(() => {
    return paragraph?.containerId !== null;
  }, [paragraph?.containerId]);

  // 현재 편집 모드인지 확인
  const isCurrentlyInEditMode = useMemo(() => {
    return currentEditingParagraphId === paragraph?.id;
  }, [currentEditingParagraphId, paragraph?.id]);

  // 에디터 비활성화 여부 결정 - 편집 모드가 아니고 컨테이너에 할당된 경우 비활성화
  const shouldEditorBeDisabled = useMemo(() => {
    if (isCurrentlyInEditMode) {
      return false; // 편집 모드일 때는 항상 활성화
    }
    return isAssignedToContainer; // 할당된 단락은 편집 모드가 아니면 비활성화
  }, [isAssignedToContainer, isCurrentlyInEditMode]);

  // 현재 단락이 활성 상태인지 확인 (포커스된 상태)
  const isCurrentParagraphActive = useMemo(() => {
    const { activeParagraphId = null } = internalState || {};
    const { id: currentParagraphId = '' } = paragraph || {};

    if (shouldEditorBeDisabled) return false;

    return activeParagraphId === currentParagraphId;
  }, [internalState?.activeParagraphId, paragraph?.id, shouldEditorBeDisabled]);

  // 현재 단락이 선택된 상태인지 확인
  const isCurrentParagraphSelected = useMemo(() => {
    const { id: currentParagraphId = '' } = paragraph || {};
    return selectedParagraphIdsString
      ? selectedParagraphIdsString.split(',').includes(currentParagraphId)
      : false;
  }, [selectedParagraphIdsString, paragraph?.id]);

  // 할당된 컨테이너 이름 조회 함수
  const getAssignedContainerName = useCallback(
    (containerId: string | null) => {
      if (!containerId) return null;
      const container = sortedContainers.find((c) => c.id === containerId);
      return container?.name || '알 수 없는 컨테이너';
    },
    [sortedContainers]
  );

  // 단락 카드의 CSS 클래스명 동적 생성 - 상태에 따른 스타일링
  const paragraphCardDisplayClassName = useMemo(() => {
    const baseClasses =
      'group relative bg-white rounded-lg transition-all duration-200 h-full';

    const borderClasses = isCurrentParagraphActive
      ? 'border-2 border-blue-500 shadow-lg ring-2 ring-blue-200'
      : 'border border-gray-200 hover:border-gray-300';

    const selectionClasses = isCurrentParagraphSelected
      ? 'bg-blue-50 ring-1 ring-blue-300'
      : 'hover:bg-gray-50';

    const disabledClasses =
      shouldEditorBeDisabled && !isCurrentlyInEditMode
        ? 'bg-gray-50 border-gray-300'
        : '';

    const editModeClasses = isCurrentlyInEditMode
      ? 'ring-2 ring-green-400 border-green-400 shadow-lg bg-green-50'
      : '';

    return `${baseClasses} ${borderClasses} ${selectionClasses} ${disabledClasses} ${editModeClasses}`.trim();
  }, [
    isCurrentParagraphActive,
    isCurrentParagraphSelected,
    shouldEditorBeDisabled,
    isCurrentlyInEditMode,
  ]);

  // Tiptap 에디터의 콘텐츠 변경 처리 함수 - 단순화된 동기화 로직
  const handleTiptapEditorContentUpdate = useCallback(
    (newContent: string) => {
      const safeNewContent = newContent || '';
      const currentContent = paragraph?.content || '';
      const lastProcessedContent = lastProcessedContentRef.current;

      // 중복 업데이트 방지 - 같은 콘텐츠면 무시
      if (
        currentContent === safeNewContent ||
        lastProcessedContent === safeNewContent
      ) {
        return;
      }

      console.log('📝 [PARAGRAPH_CARD] 콘텐츠 업데이트:', {
        paragraphId: paragraph?.id,
        contentLength: safeNewContent.length,
        hasChanged: currentContent !== safeNewContent,
      });

      try {
        // 부모 컴포넌트로 콘텐츠 업데이트 전달
        if (paragraph?.id && updateLocalParagraphContent) {
          updateLocalParagraphContent(paragraph.id, safeNewContent);
          lastProcessedContentRef.current = safeNewContent;
          console.log('✅ [PARAGRAPH_CARD] 콘텐츠 동기화 완료:', paragraph.id);
        }
      } catch (updateError) {
        console.error('❌ [PARAGRAPH_CARD] 콘텐츠 업데이트 실패:', updateError);
      }
    },
    [paragraph?.id, paragraph?.content, updateLocalParagraphContent]
  );

  // 이 단락의 편집 모드 활성화 요청 함수
  const handleActivateEditModeForThisParagraph = useCallback(() => {
    console.log('✏️ [PARAGRAPH_CARD] 편집 모드 활성화 요청:', paragraph?.id);

    if (paragraph?.id && onActivateEditMode) {
      onActivateEditMode(paragraph.id);
    } else {
      console.warn(
        '⚠️ [PARAGRAPH_CARD] 편집 모드 활성화 실패 - ID 또는 콜백 없음'
      );
    }
  }, [paragraph?.id, onActivateEditMode]);

  // 편집 모드 비활성화 요청 함수
  const handleDeactivateCurrentEditMode = useCallback(() => {
    console.log('🔒 [PARAGRAPH_CARD] 편집 모드 비활성화 요청:', paragraph?.id);

    if (onDeactivateEditMode) {
      onDeactivateEditMode();
    } else {
      console.warn('⚠️ [PARAGRAPH_CARD] 편집 모드 비활성화 실패 - 콜백 없음');
    }
  }, [paragraph?.id, onDeactivateEditMode]);

  return (
    <div
      ref={paragraphCardRef}
      className={paragraphCardDisplayClassName}
      data-paragraph-id={paragraph?.id || ''}
      role="article"
      aria-label={`단락 ${
        paragraph?.id ? paragraph.id.slice(-8) : '알 수 없음'
      }`}
    >
      <div className="flex flex-col justify-between h-full p-4">
        {/* 컨테이너 할당 상태 표시 */}
        {isAssignedToContainer && (
          <div className="px-4 py-2 mb-3 bg-blue-50 border border-blue-200 rounded -m-4 mt-[-16px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600">
                📦 이 단락은 "{getAssignedContainerName(paragraph.containerId)}"
                컨테이너에 할당되었습니다
              </span>
              {!isCurrentlyInEditMode && (
                <Button
                  type="button"
                  variant="flat"
                  color="primary"
                  size="sm"
                  onPress={handleActivateEditModeForThisParagraph}
                  startContent={<Icon icon="lucide:edit" />}
                  className="ml-2"
                  aria-label={`단락 ${
                    paragraph?.id ? paragraph.id.slice(-8) : ''
                  } 편집 시작`}
                >
                  편집
                </Button>
              )}
              {isCurrentlyInEditMode && (
                <Button
                  type="button"
                  variant="flat"
                  color="success"
                  size="sm"
                  onPress={handleDeactivateCurrentEditMode}
                  startContent={<Icon icon="lucide:check" />}
                  className="ml-2"
                  aria-label="편집 완료"
                >
                  완료
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 편집 모드 활성화 상태 표시 */}
        {isCurrentlyInEditMode && (
          <div className="px-4 py-2 mb-3 bg-green-50 border border-green-200 rounded -m-4 mt-[-16px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-600">
                ✏️ 편집 모드 활성화됨 - 이 단락을 수정할 수 있습니다
              </span>
              <span className="text-xs text-green-500">📍 자동 스크롤됨</span>
            </div>
          </div>
        )}

        {/* Tiptap 에디터 영역 */}
        <div className="mb-4">
          <TiptapEditor
            paragraphId={paragraph?.id || ''}
            initialContent={paragraph?.content || ''}
            onContentChange={handleTiptapEditorContentUpdate}
            isActive={isCurrentParagraphActive || isCurrentlyInEditMode}
            disabled={shouldEditorBeDisabled}
            aria-label={`단락 ${
              paragraph?.id ? paragraph.id.slice(-8) : ''
            } 텍스트 에디터`}
          />
        </div>

        {/* 단락 액션 버튼들 영역 */}
        <div className="pt-3 border-t border-gray-100">
          <ParagraphActions
            paragraph={paragraph}
            internalState={internalState}
            sortedContainers={sortedContainers}
            addToLocalContainer={addToLocalContainer}
            setTargetContainerId={setTargetContainerId}
            toggleParagraphSelection={toggleParagraphSelection}
          />
        </div>
      </div>
    </div>
  );
}

export default ParagraphCard;
