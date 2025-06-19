// 📁 src/components/moduleEditor/parts/WritingStep/paragraph/ParagraphCard.tsx

import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import TiptapEditor from '../../TiptapEditor/TiptapEditor';
import ParagraphActions from './ParagraphActions';
import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

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
  deleteLocalParagraph: (id: string) => void;
  updateLocalParagraphContent: (id: string, content: string) => void;
  toggleParagraphSelection: (id: string) => void;
  addToLocalContainer: () => void;
  setTargetContainerId: (containerId: string) => void;
}

// 디버깅 데이터 타입 정의 (useRef로 관리)
interface DebugData {
  renderCount: number;
  lastRenderReason: string;
  contentSyncCount: number;
  immediateUpdateCount: number;
  childComponentInteractionCount: number;
  propsChanges: string[];
  lastRenderTime: number;
  renderDuration: number;
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
  deleteLocalParagraph,
  updateLocalParagraphContent,
  toggleParagraphSelection,
  addToLocalContainer,
  setTargetContainerId,
}: ParagraphCardProps) {
  // 🔧 기존 상태 관리 (최소한으로 유지)
  const [contentUpdateCounter, setContentUpdateCounter] = useState<number>(0);
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);

  // 🎯 안정적인 참조 관리
  const lastProcessedContentRef = useRef<string>(paragraph?.content || '');
  const componentIdRef = useRef<string>(
    `card-${paragraph?.id?.slice(-8) || 'unknown'}`
  );

  // 🚀 콘텐츠 동기화 상태 추적 (디바운스 대신 사용)
  const contentSyncStateRef = useRef<ContentSyncState>({
    lastSyncedContent: paragraph?.content || '',
    lastSyncTimestamp: Date.now(),
    syncInProgress: false,
    pendingContentUpdate: null,
  });

  // 🐛 디버깅 데이터는 useRef로 관리 (리렌더링 유발 안함)
  const debugDataRef = useRef<DebugData>({
    renderCount: 0,
    lastRenderReason: 'initial',
    contentSyncCount: 0,
    immediateUpdateCount: 0,
    childComponentInteractionCount: 0,
    propsChanges: [],
    lastRenderTime: Date.now(),
    renderDuration: 0,
  });

  // 디버깅 관련 refs
  const previousPropsStateRef = useRef<any>(null);
  const renderStartTimeRef = useRef<number>(Date.now());

  // ✅ 디버그 모드 - 개발 모드에서 항상 활성화
  const isDebugMode =
    (import.meta as any).env?.DEV ||
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');

  // 🔍 렌더링 추적 및 원인 분석 - 의존성 완전 최적화
  const selectedParagraphIdsString = useMemo(() => {
    const { selectedParagraphIds = [] } = internalState || {};
    return Array.isArray(selectedParagraphIds)
      ? selectedParagraphIds.join(',')
      : '';
  }, [internalState?.selectedParagraphIds]);

  useEffect(() => {
    const renderEndTime = Date.now();
    const renderDuration = renderEndTime - renderStartTimeRef.current;

    if (isDebugMode) {
      let renderReason = 'unknown';
      const propsChanges: string[] = [];

      // Props 변경 감지 - 안정화된 값들만 사용 (content 길이 제거)
      const currentPropsSnapshot = {
        activeParagraphId: internalState?.activeParagraphId || null,
        selectedParagraphIds: selectedParagraphIdsString,
        targetContainerId: internalState?.targetContainerId || '',
        containersLength: sortedContainers?.length || 0,
        paragraphId: paragraph?.id || '',
      };

      const { current: previousPropsState } = previousPropsStateRef;
      if (previousPropsState) {
        // 타입 안전한 객체 순회
        (
          Object.keys(currentPropsSnapshot) as Array<
            keyof typeof currentPropsSnapshot
          >
        ).forEach((propKey) => {
          const currentPropValue = currentPropsSnapshot[propKey];
          const previousPropValue = previousPropsState[propKey];

          if (previousPropValue !== currentPropValue) {
            propsChanges.push(
              `${propKey}: ${previousPropValue} → ${currentPropValue}`
            );
          }
        });

        if (propsChanges.length > 0) {
          renderReason = `props: ${propsChanges
            .map((changeDescription) => changeDescription.split(':')[0])
            .join(', ')}`;
        } else {
          renderReason = 'state or internal';
        }
      }

      previousPropsStateRef.current = currentPropsSnapshot;

      // 🚀 useRef로 직접 업데이트 (setState 사용 안함)
      debugDataRef.current = {
        ...debugDataRef.current,
        renderCount: debugDataRef.current.renderCount + 1,
        lastRenderReason: renderReason,
        propsChanges,
        lastRenderTime: renderEndTime,
        renderDuration,
      };

      // 렌더링 로그 (과도한 로깅 방지)
      if (debugDataRef.current.renderCount <= 5 && renderReason !== 'unknown') {
        console.log(`🔄 [${componentIdRef.current}] RENDER: ${renderReason}`, {
          renderCount: debugDataRef.current.renderCount,
          duration: renderDuration,
          propsChangesCount: propsChanges.length,
        });
      }

      // 무한 렌더링 경고
      if (debugDataRef.current.renderCount > 15) {
        console.warn(
          `🚨 [${componentIdRef.current}] 무한 렌더링 의심! 렌더링 횟수: ${debugDataRef.current.renderCount}`
        );
      }
    }

    renderStartTimeRef.current = Date.now();
  }, [
    // 🚀 핵심 개선: content 관련 의존성 완전 제거
    internalState?.activeParagraphId,
    selectedParagraphIdsString,
    internalState?.targetContainerId,
    sortedContainers?.length,
    paragraph?.id, // 단락 ID만 추적 (내용 변경 시 리렌더링 방지)
    isDebugMode,
  ]);

  // 🚀 핵심 개선: 즉시 동기화 함수 (디바운스 완전 제거)
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
        console.log('⏭️ [PARAGRAPH_CARD] 동기화 스킵:', {
          paragraphId: safeParagraphId.slice(-8),
          reason: syncInProgress ? 'sync_in_progress' : 'duplicate_content',
        });
        return;
      }

      if (isDebugMode) {
        debugDataRef.current.contentSyncCount += 1;

        console.log(`⚡ [${componentIdRef.current}] 즉시 콘텐츠 동기화:`, {
          paragraphId: safeParagraphId.slice(-8),
          contentLength: safeUpdatedContent.length,
          hasRealChange: safeUpdatedContent !== lastSyncedContent,
          syncCount: debugDataRef.current.contentSyncCount,
        });
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
          setContentUpdateCounter((previousCount) => previousCount + 1);

          // 동기화 완료 상태 업데이트
          contentSyncStateRef.current = {
            lastSyncedContent: safeUpdatedContent,
            lastSyncTimestamp: currentTimestamp,
            syncInProgress: false,
            pendingContentUpdate: null,
          };

          console.log('✅ [PARAGRAPH_CARD] 즉시 동기화 완료');
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
    [paragraph?.id, updateLocalParagraphContent, isDebugMode]
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

  // ✅ 선택 상태 변경 핸들러
  const handleParagraphSelectionToggle = useCallback(() => {
    const { id: currentParagraphId = '' } = paragraph || {};

    if (isDebugMode) {
      debugDataRef.current.childComponentInteractionCount += 1;

      console.log(
        `☑️ [${componentIdRef.current}] SELECTION_TOGGLE → 부모 상태 변경:`,
        {
          paragraphId: currentParagraphId.slice(-8),
          willBeSelected: !isCurrentParagraphSelected,
          interactionCount: debugDataRef.current.childComponentInteractionCount,
        }
      );
    }

    // 🎯 구조분해할당으로 안전한 함수 호출
    const { toggleParagraphSelection: selectionToggleCallback } = {
      toggleParagraphSelection,
    };
    const safeSelectionToggleCallback =
      selectionToggleCallback ||
      (() => {
        console.warn(
          '⚠️ [PARAGRAPH_CARD] toggleParagraphSelection 콜백이 제공되지 않음'
        );
      });

    if (typeof safeSelectionToggleCallback === 'function') {
      safeSelectionToggleCallback(currentParagraphId);
    }
  }, [
    paragraph?.id,
    isCurrentParagraphSelected,
    toggleParagraphSelection,
    isDebugMode,
  ]);

  // 🚀 핵심 개선: 콘텐츠 변경 핸들러 (디바운스 완전 제거)
  const handleTiptapEditorContentChange = useCallback(
    (newContent: string) => {
      const safeNewContent = newContent || '';
      const { content: currentParagraphContent = '' } = paragraph || {};

      // 동일한 내용이면 스킵
      if (currentParagraphContent === safeNewContent) {
        return;
      }

      if (isDebugMode) {
        debugDataRef.current.immediateUpdateCount += 1;

        const contentLengthDifference = Math.abs(
          safeNewContent.length - currentParagraphContent.length
        );

        if (contentLengthDifference > 3) {
          console.log(`✏️ [${componentIdRef.current}] CONTENT_CHANGE:`, {
            oldLength: currentParagraphContent.length,
            newLength: safeNewContent.length,
            lengthDiff: contentLengthDifference,
            immediateUpdateCount: debugDataRef.current.immediateUpdateCount,
          });
        }
      }

      // 🚀 즉시 동기화 실행 (디바운스 없음)
      executeImmediateContentSync(safeNewContent);
    },
    [paragraph?.content, executeImmediateContentSync, isDebugMode]
  );

  // ✅ 삭제 핸들러
  const handleParagraphDeletion = useCallback(() => {
    const { id: currentParagraphId = '', content: currentContent = '' } =
      paragraph || {};

    if (isDebugMode) {
      console.log(`🗑️ [${componentIdRef.current}] DELETE_REQUEST:`, {
        paragraphId: currentParagraphId.slice(-8),
        hasContent: currentContent.trim().length > 0,
      });
    }

    if (currentContent.trim().length > 0) {
      const contentPreview = currentContent.substring(0, 50);
      const confirmationMessage = `단락을 삭제하시겠습니까?\n\n내용: "${contentPreview}${
        currentContent.length > 50 ? '...' : ''
      }"`;

      const userConfirmedDeletion = window.confirm(confirmationMessage);
      if (!userConfirmedDeletion) {
        return;
      }
    }

    // 🎯 구조분해할당으로 안전한 함수 호출
    const { deleteLocalParagraph: paragraphDeletionCallback } = {
      deleteLocalParagraph,
    };
    const safeParagraphDeletionCallback =
      paragraphDeletionCallback ||
      (() => {
        console.warn(
          '⚠️ [PARAGRAPH_CARD] deleteLocalParagraph 콜백이 제공되지 않음'
        );
      });

    if (typeof safeParagraphDeletionCallback === 'function') {
      safeParagraphDeletionCallback(currentParagraphId);
    }
  }, [paragraph?.id, paragraph?.content, deleteLocalParagraph, isDebugMode]);

  // 🔧 디버그 패널 토글
  const toggleDebugPanelVisibility = useCallback(() => {
    setIsDebugPanelOpen((previousState) => !previousState);
  }, []);

  return (
    <div
      className={paragraphCardClassName}
      data-paragraph-id={paragraph?.id || ''}
    >
      <div className="flex flex-col justify-between h-full p-4">
        {/* 헤더 영역 */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="mt-2"
              checked={isCurrentParagraphSelected}
              onChange={handleParagraphSelectionToggle}
              aria-label={`단락 ${paragraph?.id || 'unknown'} 선택`}
            />

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>ID: {paragraph?.id?.slice(-8) || 'unknown'}</span>
              <span>•</span>
              <span>길이: {paragraph?.content?.length || 0}</span>
              <span>•</span>
              <span>업데이트: {contentUpdateCounter}회</span>
              {paragraph?.containerId && (
                <>
                  <span>•</span>
                  <span className="text-green-600">할당됨</span>
                </>
              )}
              {/* 개발 모드에서 항상 표시 */}
              {isDebugMode && (
                <>
                  <span>•</span>
                  <span
                    className={
                      debugDataRef.current.renderCount > 10
                        ? 'text-red-600 font-bold'
                        : 'text-gray-400'
                    }
                  >
                    렌더: {debugDataRef.current.renderCount}
                  </span>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={toggleDebugPanelVisibility}
                    className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    🐛 디버그
                  </button>
                </>
              )}
            </div>
          </div>

          <Button
            type="button"
            isIconOnly
            color="danger"
            variant="light"
            size="sm"
            onPress={handleParagraphDeletion}
            aria-label={`단락 ${paragraph?.id || 'unknown'} 삭제`}
            title="단락 삭제"
          >
            <Icon icon="lucide:trash-2" />
          </Button>
        </div>

        {/* 에디터 영역 - 최적화된 TiptapEditor 사용 */}
        <TiptapEditor
          paragraphId={paragraph?.id || ''}
          initialContent={paragraph?.content || ''}
          onContentChange={handleTiptapEditorContentChange}
          isActive={isCurrentParagraphActive}
        />

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

        {/* 🐛 디버깅 패널 */}
        {isDebugMode && isDebugPanelOpen && (
          <div className="p-3 mt-4 border border-yellow-300 rounded-lg bg-yellow-50">
            <h4 className="flex items-center gap-2 mb-2 text-sm font-semibold text-yellow-800">
              🐛 ParagraphCard 디버깅 (ID: {componentIdRef.current})
              <button
                type="button"
                onClick={toggleDebugPanelVisibility}
                className="text-yellow-600 hover:text-yellow-800"
              >
                ✕
              </button>
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <strong>🔍 렌더링 추적:</strong>
                <div>총 렌더링: {debugDataRef.current.renderCount}회</div>
                <div>마지막 원인: {debugDataRef.current.lastRenderReason}</div>
                <div>렌더링 소요: {debugDataRef.current.renderDuration}ms</div>
                <div>
                  자식 상호작용:{' '}
                  {debugDataRef.current.childComponentInteractionCount}회
                </div>
              </div>

              <div>
                <strong>📝 콘텐츠 동기화:</strong>
                <div>
                  즉시 동기화: {debugDataRef.current.contentSyncCount}회
                </div>
                <div>
                  즉시 업데이트: {debugDataRef.current.immediateUpdateCount}회
                </div>
                <div>현재 길이: {paragraph?.content?.length || 0}자</div>
                {contentSyncStateRef.current.syncInProgress && (
                  <div className="text-orange-600">⏳ 동기화 진행중</div>
                )}
              </div>
            </div>

            {debugDataRef.current.propsChanges.length > 0 && (
              <div className="mt-2">
                <strong className="text-xs">📊 Props 변경:</strong>
                <div className="overflow-y-auto text-xs text-gray-600 max-h-20">
                  {debugDataRef.current.propsChanges.map((change, index) => (
                    <div key={index}>• {change}</div>
                  ))}
                </div>
              </div>
            )}

            {debugDataRef.current.renderCount > 10 && (
              <div className="p-2 mt-2 text-xs text-red-700 bg-red-100 border border-red-300 rounded">
                🚨 <strong>렌더링 최적화 필요!</strong> 렌더링이{' '}
                {debugDataRef.current.renderCount}회 발생했습니다.
              </div>
            )}

            <div className="p-2 mt-2 text-xs bg-green-100 border border-green-200 rounded">
              <strong>🔗 TiptapEditor 상호작용:</strong>
              <div>
                디바운스 제거로 즉시 동기화{' '}
                {debugDataRef.current.contentSyncCount}회 실행
              </div>
              <div>
                현재 상태: {isCurrentParagraphActive ? '활성' : '비활성'} /{' '}
                {isCurrentParagraphSelected ? '선택됨' : '미선택'}
              </div>
            </div>
          </div>
        )}

        {/* 무한 렌더링 실시간 경고 표시 (항상 보임) */}
        {isDebugMode && debugDataRef.current.renderCount > 12 && (
          <div className="p-2 mt-2 text-xs text-red-700 bg-red-100 border-2 border-red-400 rounded animate-pulse">
            🚨 <strong>렌더링 최적화 필요!</strong> 이 컴포넌트가{' '}
            {debugDataRef.current.renderCount}회 렌더링되었습니다!
          </div>
        )}

        {/* 활성 상태 시각적 표시 */}
        {isCurrentParagraphActive && (
          <div className="absolute rounded-lg -inset-1 bg-gradient-to-r from-blue-400 to-blue-600 opacity-20 -z-10" />
        )}
      </div>
    </div>
  );
}

export default ParagraphCard;
