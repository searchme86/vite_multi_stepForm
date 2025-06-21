// 📁 components/moduleEditor/parts/WritingStep/paragraph/ParagraphCard.tsx

import TiptapEditor from '../../TiptapEditor/TiptapEditor';
import ParagraphActions from './ParagraphActions';
import { useCallback, useMemo, useRef } from 'react';
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
}

interface ContentSynchronizationState {
  lastSyncedContent: string;
  lastSyncTimestamp: number;
  syncInProgress: boolean;
  pendingContentUpdate: string | null;
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
}: ParagraphCardProps) {
  const lastProcessedContentRef = useRef<string>(paragraph?.content || '');

  const contentSynchronizationStateRef = useRef<ContentSynchronizationState>({
    lastSyncedContent: paragraph?.content || '',
    lastSyncTimestamp: Date.now(),
    syncInProgress: false,
    pendingContentUpdate: null,
  });

  const selectedParagraphIdsString = useMemo(() => {
    const { selectedParagraphIds = [] } = internalState || {};
    return Array.isArray(selectedParagraphIds)
      ? selectedParagraphIds.join(',')
      : '';
  }, [internalState?.selectedParagraphIds]);

  const isAssignedToContainer = useMemo(() => {
    return paragraph?.containerId !== null;
  }, [paragraph?.containerId]);

  const isCurrentlyInEditMode = useMemo(() => {
    return currentEditingParagraphId === paragraph?.id;
  }, [currentEditingParagraphId, paragraph?.id]);

  const shouldEditorBeDisabled = useMemo(() => {
    if (isCurrentlyInEditMode) {
      return false;
    }
    return isAssignedToContainer;
  }, [isAssignedToContainer, isCurrentlyInEditMode]);

  const isCurrentParagraphActive = useMemo(() => {
    const { activeParagraphId = null } = internalState || {};
    const { id: currentParagraphId = '' } = paragraph || {};

    if (shouldEditorBeDisabled) return false;

    return activeParagraphId === currentParagraphId;
  }, [internalState?.activeParagraphId, paragraph?.id, shouldEditorBeDisabled]);

  const isCurrentParagraphSelected = useMemo(() => {
    const { id: currentParagraphId = '' } = paragraph || {};
    return selectedParagraphIdsString
      ? selectedParagraphIdsString.split(',').includes(currentParagraphId)
      : false;
  }, [selectedParagraphIdsString, paragraph?.id]);

  const getAssignedContainerName = useCallback(
    (containerId: string | null) => {
      if (!containerId) return null;
      const container = sortedContainers.find((c) => c.id === containerId);
      return container?.name || '알 수 없는 컨테이너';
    },
    [sortedContainers]
  );

  const paragraphCardDisplayClassName = useMemo(() => {
    const baseClasses =
      'group relative bg-white rounded-lg transition-all duration-200 h-full';
    const borderClasses = isCurrentParagraphActive
      ? 'border-2 border-blue-500 shadow-lg ring-2 ring-blue-200'
      : 'border border-gray-200 hover:border-gray-300';
    const selectionClasses = isCurrentParagraphSelected
      ? 'bg-blue-50 ring-1 ring-blue-300'
      : 'hover:bg-gray-50';

    const disabledClasses = shouldEditorBeDisabled
      ? 'bg-gray-50 border-gray-300'
      : '';

    const editModeClasses = isCurrentlyInEditMode
      ? 'ring-2 ring-green-400 border-green-400'
      : '';

    return `${baseClasses} ${borderClasses} ${selectionClasses} ${disabledClasses} ${editModeClasses}`;
  }, [
    isCurrentParagraphActive,
    isCurrentParagraphSelected,
    shouldEditorBeDisabled,
    isCurrentlyInEditMode,
  ]);

  const executeImmediateContentSynchronization = useCallback(
    (updatedContent: string) => {
      const safeUpdatedContent = updatedContent || '';
      const safeParagraphId = paragraph?.id || '';
      const currentTimestamp = Date.now();

      const { lastSyncedContent, lastSyncTimestamp, syncInProgress } =
        contentSynchronizationStateRef.current;

      if (
        syncInProgress ||
        (currentTimestamp - lastSyncTimestamp < 50 &&
          safeUpdatedContent === lastSyncedContent)
      ) {
        return;
      }

      contentSynchronizationStateRef.current = {
        ...contentSynchronizationStateRef.current,
        syncInProgress: true,
        pendingContentUpdate: safeUpdatedContent,
      };

      try {
        const { updateLocalParagraphContent: contentUpdateCallback } = {
          updateLocalParagraphContent,
        };
        const safeContentUpdateCallback =
          contentUpdateCallback ||
          (() => {
            console.warn(
              '⚠️ [PARAGRAPH_CARD] updateLocalParagraphContent 콜백이 제공되지 않음'
            );
          });

        if (typeof safeContentUpdateCallback === 'function') {
          safeContentUpdateCallback(safeParagraphId, safeUpdatedContent);

          lastProcessedContentRef.current = safeUpdatedContent;

          contentSynchronizationStateRef.current = {
            lastSyncedContent: safeUpdatedContent,
            lastSyncTimestamp: currentTimestamp,
            syncInProgress: false,
            pendingContentUpdate: null,
          };
        }
      } catch (syncError) {
        console.error('❌ [PARAGRAPH_CARD] 동기화 실패:', syncError);

        contentSynchronizationStateRef.current = {
          ...contentSynchronizationStateRef.current,
          syncInProgress: false,
          pendingContentUpdate: null,
        };
      }
    },
    [paragraph?.id, updateLocalParagraphContent]
  );

  const handleTiptapEditorContentUpdate = useCallback(
    (newContent: string) => {
      const safeNewContent = newContent || '';
      const { content: currentParagraphContent = '' } = paragraph || {};

      if (currentParagraphContent === safeNewContent) {
        return;
      }

      executeImmediateContentSynchronization(safeNewContent);
    },
    [paragraph?.content, executeImmediateContentSynchronization]
  );

  const handleActivateEditModeForThisParagraph = useCallback(() => {
    console.log('✏️ [PARAGRAPH_CARD] 편집 모드 활성화:', paragraph?.id);
    if (paragraph?.id && onActivateEditMode) {
      onActivateEditMode(paragraph.id);
    }
  }, [paragraph?.id, onActivateEditMode]);

  const handleDeactivateCurrentEditMode = useCallback(() => {
    console.log('🔒 [PARAGRAPH_CARD] 편집 모드 비활성화:', paragraph?.id);
    if (onDeactivateEditMode) {
      onDeactivateEditMode();
    }
  }, [paragraph?.id, onDeactivateEditMode]);

  return (
    <div
      className={paragraphCardDisplayClassName}
      data-paragraph-id={paragraph?.id || ''}
    >
      <div className="flex flex-col justify-between h-full p-4">
        {isAssignedToContainer && (
          <div className="px-4 py-2 mb-3 bg-blue-50 border border-blue-200 rounded -m-4 mt-[-16px] mb-3">
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
                >
                  완료
                </Button>
              )}
            </div>
          </div>
        )}

        {isCurrentlyInEditMode && (
          <div className="px-4 py-2 mb-3 bg-green-50 border border-green-200 rounded -m-4 mt-[-16px] mb-3">
            <span className="text-xs text-green-600">
              ✏️ 편집 모드 활성화됨 - 이 단락을 수정할 수 있습니다
            </span>
          </div>
        )}

        <div className="mb-4">
          <TiptapEditor
            paragraphId={paragraph?.id || ''}
            initialContent={paragraph?.content || ''}
            onContentChange={handleTiptapEditorContentUpdate}
            isActive={isCurrentParagraphActive || isCurrentlyInEditMode}
            disabled={shouldEditorBeDisabled}
          />
        </div>

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
