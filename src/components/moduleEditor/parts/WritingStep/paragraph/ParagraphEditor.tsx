// 📁 components/moduleEditor/parts/WritingStep/paragraph/ParagraphEditor.tsx

import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import ParagraphCard from './ParagraphCard';
import EmptyParagraphState from './EmptyParagraphState';

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

interface ParagraphEditorProps {
  isMobile: boolean;
  allVisibleParagraphs: LocalParagraph[];
  internalState: EditorInternalState;
  sortedContainers: Container[];
  addLocalParagraph: () => void;
  updateLocalParagraphContent: (id: string, content: string) => void;
  toggleParagraphSelection: (id: string) => void;
  addToLocalContainer: () => void;
  setTargetContainerId: (containerId: string) => void;
  currentEditingParagraphId: string | null;
  onActivateEditMode: (paragraphId: string) => void;
  onDeactivateEditMode: () => void;
  recommendedChars?: number;
  isGoalModeEnabled?: boolean;
}

interface ContentQualityIssue {
  id: string;
  type: 'error' | 'warning';
  message: string;
  icon: string;
}

function ParagraphEditor({
  isMobile,
  allVisibleParagraphs,
  internalState,
  sortedContainers,
  addLocalParagraph,
  updateLocalParagraphContent,
  toggleParagraphSelection,
  addToLocalContainer,
  setTargetContainerId,
  currentEditingParagraphId,
  onActivateEditMode,
  onDeactivateEditMode,
  recommendedChars = 30,
  isGoalModeEnabled = false,
}: ParagraphEditorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const paragraphRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());

  console.log('📝 [PARAGRAPH_EDITOR] 렌더링:', {
    isMobile,
    totalParagraphsCount: allVisibleParagraphs.length,
    currentEditingParagraphId,
    recommendedChars,
    isGoalModeEnabled,
    timestamp: new Date().toISOString(),
  });

  const getEffectiveRecommendedCharacterCount = React.useCallback(() => {
    if (isGoalModeEnabled && recommendedChars && recommendedChars > 0) {
      return recommendedChars;
    }
    return 30;
  }, [recommendedChars, isGoalModeEnabled]);

  const scrollToEditingParagraph = useCallback((paragraphId: string) => {
    console.log('📍 [PARAGRAPH_EDITOR] 에디터로 스크롤 시작:', paragraphId);

    const paragraphElement = paragraphRefsMap.current.get(paragraphId);
    const scrollContainer = scrollContainerRef.current;

    if (!paragraphElement || !scrollContainer) {
      console.warn('⚠️ [PARAGRAPH_EDITOR] 스크롤 대상 요소를 찾을 수 없음:', {
        paragraphElement: !!paragraphElement,
        scrollContainer: !!scrollContainer,
        paragraphId,
      });
      return;
    }

    try {
      const containerRect = scrollContainer.getBoundingClientRect();

      const targetScrollPosition = paragraphElement.offsetTop - 20;

      console.log('📊 [PARAGRAPH_EDITOR] 스크롤 계산:', {
        containerHeight: containerRect.height,
        paragraphOffsetTop: paragraphElement.offsetTop,
        targetScrollPosition,
        currentScrollTop: scrollContainer.scrollTop,
      });

      scrollContainer.scrollTo({
        top: targetScrollPosition,
        behavior: 'smooth',
      });

      setTimeout(() => {
        const finalScrollPosition = scrollContainer.scrollTop;
        console.log('✅ [PARAGRAPH_EDITOR] 스크롤 완료:', {
          finalScrollPosition,
          targetScrollPosition,
          paragraphId,
        });
      }, 500);
    } catch (scrollError) {
      console.error('❌ [PARAGRAPH_EDITOR] 스크롤 실패:', scrollError);
    }
  }, []);

  const handleActivateEditModeWithScroll = useCallback(
    (paragraphId: string) => {
      console.log(
        '🎯 [PARAGRAPH_EDITOR] 편집 모드 활성화 및 스크롤:',
        paragraphId
      );

      onActivateEditMode(paragraphId);

      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToEditingParagraph(paragraphId);
        }, 100);
      });
    },
    [onActivateEditMode, scrollToEditingParagraph]
  );

  const registerParagraphRef = useCallback(
    (paragraphId: string, element: HTMLDivElement | null) => {
      if (element) {
        paragraphRefsMap.current.set(paragraphId, element);
        console.log('📍 [PARAGRAPH_EDITOR] 단락 ref 등록:', paragraphId);
      } else {
        paragraphRefsMap.current.delete(paragraphId);
        console.log('🗑️ [PARAGRAPH_EDITOR] 단락 ref 제거:', paragraphId);
      }
    },
    []
  );

  const unassignedParagraphsForQualityCheck = useMemo(() => {
    return allVisibleParagraphs.filter(
      (paragraph) => paragraph.containerId === null
    );
  }, [allVisibleParagraphs]);

  const contentQualityAnalysisResults = useMemo((): ContentQualityIssue[] => {
    const detectedIssues: ContentQualityIssue[] = [];
    const effectiveRecommendedCharacterCount =
      getEffectiveRecommendedCharacterCount();

    unassignedParagraphsForQualityCheck.forEach((paragraph) => {
      const { content = '', id } = paragraph;

      const plainTextContent = content.replace(/<[^>]*>/g, '').trim();
      const actualContentLength = plainTextContent.length;

      if (actualContentLength > 0 && actualContentLength < 10) {
        detectedIssues.push({
          id: `short-content-${id}`,
          type: 'error',
          message: `콘텐츠가 너무 짧습니다 (현재: ${actualContentLength}자, 최소: 10자 필요)`,
          icon: 'lucide:alert-circle',
        });
      }

      if (
        actualContentLength > 0 &&
        actualContentLength < effectiveRecommendedCharacterCount
      ) {
        detectedIssues.push({
          id: `short-recommended-${id}`,
          type: 'warning',
          message: `콘텐츠가 권장 길이보다 짧습니다 (현재: ${actualContentLength}자, 권장: ${effectiveRecommendedCharacterCount}자 이상)`,
          icon: 'lucide:alert-triangle',
        });
      }
    });

    console.log('📊 [PARAGRAPH_EDITOR] 콘텐츠 품질 분석 완료:', {
      totalParagraphs: unassignedParagraphsForQualityCheck.length,
      issuesFound: detectedIssues.length,
      issueTypes: detectedIssues.map((issue) => issue.type),
      effectiveRecommendedCharacterCount,
      isGoalModeEnabled,
    });

    return detectedIssues;
  }, [
    unassignedParagraphsForQualityCheck,
    getEffectiveRecommendedCharacterCount,
  ]);

  const { criticalErrorIssues, improvementWarningIssues } = useMemo(() => {
    const errors = contentQualityAnalysisResults.filter(
      (issue) => issue.type === 'error'
    );
    const warnings = contentQualityAnalysisResults.filter(
      (issue) => issue.type === 'warning'
    );

    console.log('🔍 [PARAGRAPH_EDITOR] 이슈 분류:', {
      errors: errors.length,
      warnings: warnings.length,
    });

    return {
      criticalErrorIssues: errors,
      improvementWarningIssues: warnings,
    };
  }, [contentQualityAnalysisResults]);

  const previousParagraphCountRef = useRef(allVisibleParagraphs.length);

  // 새 단락 생성 감지 및 자동 스크롤
  useEffect(() => {
    const currentCount = allVisibleParagraphs.length;
    const previousCount = previousParagraphCountRef.current;

    console.log('📊 [PARAGRAPH_EDITOR] 단락 개수 변화 감지:', {
      previous: previousCount,
      current: currentCount,
      isIncreased: currentCount > previousCount,
    });

    // 단락이 증가했고, 현재 2개 이상인 경우 (첫 번째 제외)
    if (currentCount > previousCount && currentCount >= 2) {
      console.log('🎯 [PARAGRAPH_EDITOR] 새 단락 자동 스크롤 조건 충족');

      // 새로 생성된 단락 (마지막 단락)으로 스크롤
      const newestParagraph =
        allVisibleParagraphs[allVisibleParagraphs.length - 1];

      if (newestParagraph?.id) {
        console.log(
          '🆕 [PARAGRAPH_EDITOR] 새 단락으로 스크롤:',
          newestParagraph.id
        );

        // DOM 렌더링 완료 후 스크롤 실행
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollToEditingParagraph(newestParagraph.id);
          }, 200);
        });
      }
    }

    // 이전 개수 업데이트
    previousParagraphCountRef.current = currentCount;
  }, [
    allVisibleParagraphs.length,
    allVisibleParagraphs,
    scrollToEditingParagraph,
  ]);

  const handleAddNewParagraph = () => {
    console.log('➕ [PARAGRAPH_EDITOR] 새 단락 추가 요청');
    addLocalParagraph();
  };

  const unassignedParagraphsCount = useMemo(() => {
    return allVisibleParagraphs.filter((p) => p.containerId === null).length;
  }, [allVisibleParagraphs]);

  return (
    <div
      className={`${
        isMobile ? 'w-full' : 'flex-1'
      } w-[50%] h-full border border-gray-200 rounded-lg pb-4 mr-[20px] flex flex-col`}
    >
      <div className="flex items-center justify-between flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col">
          <span className="text-lg font-semibold">📝 단락 작성 (Tiptap)</span>
          {isGoalModeEnabled && (
            <span className="mt-1 text-xs text-blue-600">
              🎯 목표 모드 활성화 (권장:{' '}
              {getEffectiveRecommendedCharacterCount()}자 이상)
            </span>
          )}
          {currentEditingParagraphId && (
            <span className="mt-1 text-xs text-green-600">
              ✏️ 편집 모드: {currentEditingParagraphId.slice(-8)}...
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {currentEditingParagraphId && (
            <Button
              type="button"
              color="default"
              variant="flat"
              size="sm"
              onPress={onDeactivateEditMode}
              startContent={<Icon icon="lucide:x" />}
              aria-label="편집 모드 종료"
            >
              편집 완료
            </Button>
          )}
          <Button
            type="button"
            color="primary"
            size="sm"
            onPress={handleAddNewParagraph}
            startContent={<Icon icon="lucide:plus" />}
            aria-label="새로운 단락 추가"
          >
            새 단락
          </Button>
        </div>
      </div>

      {contentQualityAnalysisResults.length > 0 && (
        <div className="flex-shrink-0 p-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-yellow-50">
          <div className="mb-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-800">
              <Icon icon="lucide:clipboard-check" className="text-orange-500" />
              콘텐츠 품질 검사
              <span className="ml-2 text-xs text-gray-600">
                (권장 기준: {getEffectiveRecommendedCharacterCount()}자)
              </span>
            </h4>
          </div>

          {criticalErrorIssues.length > 0 && (
            <div className="mb-3">
              <div className="mb-1 text-xs font-medium text-red-700">
                🚨 오류 ({criticalErrorIssues.length}개)
              </div>
              <ul className="space-y-1">
                {criticalErrorIssues.map((issue) => (
                  <li
                    key={issue.id}
                    className="flex items-start gap-2 text-xs text-red-600"
                  >
                    <Icon
                      icon={issue.icon}
                      className="flex-shrink-0 mt-0.5 text-red-500"
                    />
                    <span className="leading-relaxed">{issue.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {improvementWarningIssues.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium text-yellow-700">
                ⚠️ 권장사항 ({improvementWarningIssues.length}개)
              </div>
              <ul className="space-y-1">
                {improvementWarningIssues.map((issue) => (
                  <li
                    key={issue.id}
                    className="flex items-start gap-2 text-xs text-yellow-600"
                  >
                    <Icon
                      icon={issue.icon}
                      className="flex-shrink-0 mt-0.5 text-yellow-500"
                    />
                    <span className="leading-relaxed">{issue.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 p-4 overflow-y-auto"
      >
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>전체 단락: {allVisibleParagraphs.length}개</span>
            <span>미할당: {unassignedParagraphsCount}개</span>
          </div>
        </div>

        <div className="space-y-6">
          {allVisibleParagraphs.map((paragraph) => (
            <ParagraphCard
              key={paragraph.id}
              paragraph={paragraph}
              internalState={internalState}
              sortedContainers={sortedContainers}
              updateLocalParagraphContent={updateLocalParagraphContent}
              toggleParagraphSelection={toggleParagraphSelection}
              addToLocalContainer={addToLocalContainer}
              setTargetContainerId={setTargetContainerId}
              currentEditingParagraphId={currentEditingParagraphId}
              onActivateEditMode={handleActivateEditModeWithScroll}
              onDeactivateEditMode={onDeactivateEditMode}
              onRegisterRef={registerParagraphRef}
            />
          ))}

          {allVisibleParagraphs.length === 0 && (
            <EmptyParagraphState addLocalParagraph={addLocalParagraph} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ParagraphEditor;
