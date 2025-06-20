// 📁 src/components/moduleEditor/parts/WritingStep/paragraph/ParagraphCard.tsx

import TiptapEditor from '../../TiptapEditor/TiptapEditor';
import ParagraphActions from './ParagraphActions';
import { useCallback, useMemo, useRef } from 'react';

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
  // 🚨 체크박스/삭제 버튼 관련 props 제거
  updateLocalParagraphContent: (id: string, content: string) => void;
  toggleParagraphSelection: (id: string) => void;
  addToLocalContainer: () => void;
  setTargetContainerId: (containerId: string) => void;
}

// 콘텐츠 동기화 상태 추적
interface ContentSyncState {
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
}: ParagraphCardProps) {
  // 🎯 안정적인 참조 관리
  const lastProcessedContentRef = useRef<string>(paragraph?.content || '');

  // 🚀 콘텐츠 동기화 상태 추적
  const contentSyncStateRef = useRef<ContentSyncState>({
    lastSyncedContent: paragraph?.content || '',
    lastSyncTimestamp: Date.now(),
    syncInProgress: false,
    pendingContentUpdate: null,
  });

  // 🔍 선택된 단락 ID들을 문자열로 변환 (메모이제이션)
  const selectedParagraphIdsString = useMemo(() => {
    const { selectedParagraphIds = [] } = internalState || {};
    return Array.isArray(selectedParagraphIds)
      ? selectedParagraphIds.join(',')
      : '';
  }, [internalState?.selectedParagraphIds]);

  // 🚀 즉시 콘텐츠 동기화 함수
  const executeImmediateContentSync = useCallback(
    (updatedContent: string) => {
      const safeUpdatedContent = updatedContent || '';
      const safeParagraphId = paragraph?.id || '';
      const currentTimestamp = Date.now();

      const { lastSyncedContent, lastSyncTimestamp, syncInProgress } =
        contentSyncStateRef.current;

      // 중복 동기화 방지 (50ms 내 동일 내용)
      if (
        syncInProgress ||
        (currentTimestamp - lastSyncTimestamp < 50 &&
          safeUpdatedContent === lastSyncedContent)
      ) {
        return;
      }

      // 동기화 진행 상태 설정
      contentSyncStateRef.current = {
        ...contentSyncStateRef.current,
        syncInProgress: true,
        pendingContentUpdate: safeUpdatedContent,
      };

      try {
        // 🎯 구조분해할당 및 fallback으로 안전한 함수 호출
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

          // 참조 및 상태 업데이트
          lastProcessedContentRef.current = safeUpdatedContent;

          // 동기화 완료 상태 업데이트
          contentSyncStateRef.current = {
            lastSyncedContent: safeUpdatedContent,
            lastSyncTimestamp: currentTimestamp,
            syncInProgress: false,
            pendingContentUpdate: null,
          };
        }
      } catch (syncError) {
        console.error('❌ [PARAGRAPH_CARD] 동기화 실패:', syncError);

        // 동기화 실패 시 상태 복구
        contentSyncStateRef.current = {
          ...contentSyncStateRef.current,
          syncInProgress: false,
          pendingContentUpdate: null,
        };
      }
    },
    [paragraph?.id, updateLocalParagraphContent]
  );

  // 🎯 메모이제이션된 계산값들
  const isCurrentParagraphActive = useMemo(() => {
    const { activeParagraphId = null } = internalState || {};
    const { id: currentParagraphId = '' } = paragraph || {};
    return activeParagraphId === currentParagraphId;
  }, [internalState?.activeParagraphId, paragraph?.id]);

  const isCurrentParagraphSelected = useMemo(() => {
    const { id: currentParagraphId = '' } = paragraph || {};
    return selectedParagraphIdsString
      ? selectedParagraphIdsString.split(',').includes(currentParagraphId)
      : false;
  }, [selectedParagraphIdsString, paragraph?.id]);

  const paragraphCardClassName = useMemo(() => {
    const baseClasses =
      'group relative bg-white rounded-lg transition-all duration-200 h-full';
    const borderClasses = isCurrentParagraphActive
      ? 'border-2 border-blue-500 shadow-lg ring-2 ring-blue-200'
      : 'border border-gray-200 hover:border-gray-300';
    const selectionClasses = isCurrentParagraphSelected
      ? 'bg-blue-50 ring-1 ring-blue-300'
      : 'hover:bg-gray-50';

    return `${baseClasses} ${borderClasses} ${selectionClasses}`;
  }, [isCurrentParagraphActive, isCurrentParagraphSelected]);

  // 🚀 콘텐츠 변경 핸들러
  const handleTiptapEditorContentChange = useCallback(
    (newContent: string) => {
      const safeNewContent = newContent || '';
      const { content: currentParagraphContent = '' } = paragraph || {};

      // 동일한 내용이면 스킵
      if (currentParagraphContent === safeNewContent) {
        return;
      }

      // 🚀 즉시 동기화 실행
      executeImmediateContentSync(safeNewContent);
    },
    [paragraph?.content, executeImmediateContentSync]
  );

  return (
    <div
      className={paragraphCardClassName}
      data-paragraph-id={paragraph?.id || ''}
    >
      <div className="flex flex-col justify-between h-full p-4">
        {/* 🚨 헤더 영역 - 체크박스와 삭제 버튼 제거됨 */}

        {/* 🎯 에디터 영역 */}
        <div className="mb-4">
          <TiptapEditor
            paragraphId={paragraph?.id || ''}
            initialContent={paragraph?.content || ''}
            onContentChange={handleTiptapEditorContentChange}
            isActive={isCurrentParagraphActive}
          />
        </div>

        {/* 액션 영역 */}
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
