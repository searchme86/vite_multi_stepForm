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
  // 🔧 단순화된 상태 관리
  const [updateCount, setUpdateCount] = useState<number>(0);
  const debounceTimeoutRef = useRef<number | null>(null);
  const lastContentRef = useRef<string>(paragraph.content);
  const componentIdRef = useRef<string>(`card-${paragraph.id.slice(-8)}`);

  // ✅ 디버그 모드 최적화: 개발환경 + 특정 조건에서만
  const isDebugMode =
    process.env.NODE_ENV === 'development' &&
    typeof window !== 'undefined' &&
    (window as any).__PARAGRAPH_DEBUG__;

  // 🚀 핵심 해결: 안정적인 디바운스 함수 (의존성 제거)
  const stableDebouncedUpdate = useCallback(
    (paragraphId: string, content: string) => {
      // 이전 타이머 확실히 정리
      if (debounceTimeoutRef.current !== null) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }

      // 새로운 타이머 설정
      debounceTimeoutRef.current = setTimeout(() => {
        if (isDebugMode) {
          console.log(`⚡ [${componentIdRef.current}] DEBOUNCED_UPDATE:`, {
            contentLength: content?.length || 0,
            timestamp: Date.now(),
          });
        }

        // 🔧 안정적인 업데이트 함수 호출 (클로저 활용)
        updateLocalParagraphContent(paragraphId, content);
        setUpdateCount((prev) => prev + 1);

        // 타이머 참조 정리
        debounceTimeoutRef.current = null;
      }, 300);
    },
    []
  ); // ✅ 빈 의존성 배열 - 함수 재생성 방지

  // 🔧 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current !== null) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, []);

  // 🎯 메모이제이션된 계산값들
  const isActive = useMemo(
    () => internalState.activeParagraphId === paragraph.id,
    [internalState.activeParagraphId, paragraph.id]
  );

  const isSelected = useMemo(
    () => internalState.selectedParagraphIds.includes(paragraph.id),
    [internalState.selectedParagraphIds, paragraph.id]
  );

  const cardClassName = useMemo(() => {
    const baseClasses =
      'group relative bg-white rounded-lg transition-all duration-200';
    const borderClasses = isActive
      ? 'border-2 border-blue-500 shadow-lg ring-2 ring-blue-200'
      : 'border border-gray-200 hover:border-gray-300';
    const selectionClasses = isSelected
      ? 'bg-blue-50 ring-1 ring-blue-300'
      : 'hover:bg-gray-50';

    return `${baseClasses} ${borderClasses} ${selectionClasses}`;
  }, [isActive, isSelected]);

  // ✅ 선택 상태 변경 핸들러 - 로그 최소화
  const handleSelectionChange = useCallback(() => {
    if (isDebugMode) {
      console.log(`☑️ [${componentIdRef.current}] SELECTION:`, {
        selected: !isSelected,
      });
    }

    toggleParagraphSelection(paragraph.id);
  }, [paragraph.id, isSelected, toggleParagraphSelection, isDebugMode]);

  // 🚀 최적화된 콘텐츠 변경 핸들러 - 즉시 반응, 지연 업데이트
  const handleContentChange = useCallback(
    (content: string) => {
      // 동일한 내용이면 스킵
      if (paragraph.content === content) {
        return;
      }

      // 🔧 로그 최소화: 중요한 변경사항만 기록
      if (isDebugMode) {
        const contentDiff = Math.abs(
          (content?.length || 0) - (paragraph.content?.length || 0)
        );
        if (contentDiff > 5) {
          // 5글자 이상 변경시만 로그
          console.log(`✏️ [${componentIdRef.current}] CONTENT_CHANGE:`, {
            oldLength: paragraph.content?.length || 0,
            newLength: content?.length || 0,
            diff: contentDiff,
          });
        }
      }

      // 마지막 내용 참조 업데이트 (즉시)
      lastContentRef.current = content;

      // 🚀 핵심 개선: 함수 참조 안정화
      // updateLocalParagraphContent를 직접 클로저에 캐처하지 않고 호출 시점에 참조
      stableDebouncedUpdate(paragraph.id, content);
    },
    [paragraph.id, paragraph.content, stableDebouncedUpdate, isDebugMode]
  );

  // ✅ 삭제 핸들러 - 로그 최소화
  const handleDelete = useCallback(() => {
    if (isDebugMode) {
      console.log(`🗑️ [${componentIdRef.current}] DELETE`);
    }

    if (paragraph.content?.trim().length > 0) {
      const confirmDelete = window.confirm(
        `단락을 삭제하시겠습니까?\n\n내용: "${paragraph.content.substring(
          0,
          50
        )}${paragraph.content.length > 50 ? '...' : ''}"`
      );

      if (!confirmDelete) {
        return;
      }
    }

    deleteLocalParagraph(paragraph.id);
  }, [paragraph.id, paragraph.content, deleteLocalParagraph, isDebugMode]);

  // 🔧 렌더링 로그 최적화: 렌더링 횟수 추적
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  // ✅ 과도한 렌더링 감지 및 경고
  if (isDebugMode && renderCountRef.current > 10) {
    console.warn(`⚠️ [${componentIdRef.current}] 과도한 렌더링 감지:`, {
      renderCount: renderCountRef.current,
      contentLength: paragraph.content?.length || 0,
      isActive,
      isSelected,
    });
  }

  return (
    <div className={cardClassName} data-paragraph-id={paragraph.id}>
      <div className="p-4">
        {/* 헤더 영역 */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="mt-2"
              checked={isSelected}
              onChange={handleSelectionChange}
              aria-label={`단락 ${paragraph.id} 선택`}
            />

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>ID: {paragraph.id.slice(-8)}</span>
              <span>•</span>
              <span>길이: {paragraph.content?.length || 0}</span>
              <span>•</span>
              <span>업데이트: {updateCount}회</span>
              {paragraph.containerId && (
                <>
                  <span>•</span>
                  <span className="text-green-600">할당됨</span>
                </>
              )}
              {/* 🔧 개발 모드에서만 렌더링 횟수 표시 */}
              {isDebugMode && (
                <>
                  <span>•</span>
                  <span
                    className={
                      renderCountRef.current > 10
                        ? 'text-red-600 font-bold'
                        : 'text-gray-400'
                    }
                  >
                    렌더: {renderCountRef.current}
                  </span>
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
            onPress={handleDelete}
            aria-label={`단락 ${paragraph.id} 삭제`}
            title="단락 삭제"
          >
            <Icon icon="lucide:trash-2" />
          </Button>
        </div>

        {/* 에디터 영역 */}
        <div className="mb-4">
          <TiptapEditor
            paragraphId={paragraph.id}
            initialContent={paragraph.content || ''}
            onContentChange={handleContentChange}
            isActive={isActive}
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

        {/* 🔧 최소화된 디버그 정보 (디버그 모드 + 특정 조건에서만) */}
        {isDebugMode && renderCountRef.current <= 5 && (
          <div className="p-2 mt-2 text-xs rounded bg-gray-50">
            <div>
              <strong>🔍 상태 (ID: {componentIdRef.current}):</strong>
            </div>
            <div>
              Content: "{paragraph.content?.substring(0, 20) || '비어있음'}..."
            </div>
            <div>
              Length: {paragraph.content?.length || 0} | Updates: {updateCount}{' '}
              | Renders: {renderCountRef.current}
            </div>
            <div>
              Active: {isActive ? '✅' : '❌'} | Selected:{' '}
              {isSelected ? '✅' : '❌'}
            </div>
            {debounceTimeoutRef.current && (
              <div className="text-orange-600">⏳ 디바운스 대기중</div>
            )}
          </div>
        )}

        {/* 활성 상태 시각적 표시 */}
        {isActive && (
          <div className="absolute rounded-lg -inset-1 bg-gradient-to-r from-blue-400 to-blue-600 opacity-20 -z-10" />
        )}
      </div>
    </div>
  );
}

export default ParagraphCard;
