// 📁 components/moduleEditor/parts/WritingStep/paragraph/ParagraphEditor.tsx

import React, {
  useMemo,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from 'react';
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
  // 스크롤 컨테이너 참조 - 전체 단락 영역을 스크롤하는 컨테이너
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 각 단락 카드의 DOM 요소를 저장하는 Map - 스크롤 대상 요소들을 관리
  const paragraphElementsMap = useRef<Map<string, HTMLDivElement>>(new Map());

  console.log('📝 [PARAGRAPH_EDITOR] 렌더링:', {
    isMobile,
    totalParagraphsCount: allVisibleParagraphs.length,
    currentEditingParagraphId,
    recommendedChars,
    isGoalModeEnabled,
    timestamp: new Date().toISOString(),
  });

  // 목표 모드가 활성화된 경우 권장 글자 수를 반환하는 함수
  const getEffectiveRecommendedCharacterCount = useCallback(() => {
    if (isGoalModeEnabled && recommendedChars && recommendedChars > 0) {
      return recommendedChars;
    }
    return 30; // 기본값 30자
  }, [recommendedChars, isGoalModeEnabled]);

  // 단락 카드의 DOM 요소를 등록/해제하는 함수
  const registerParagraphElement = useCallback(
    (paragraphId: string, element: HTMLDivElement | null) => {
      if (element) {
        // 요소가 제공되면 Map에 등록
        paragraphElementsMap.current.set(paragraphId, element);
        console.log('📍 [PARAGRAPH_EDITOR] 단락 요소 등록:', paragraphId);
      } else {
        // 요소가 null이면 Map에서 제거 (컴포넌트 언마운트시)
        paragraphElementsMap.current.delete(paragraphId);
        console.log('🗑️ [PARAGRAPH_EDITOR] 단락 요소 제거:', paragraphId);
      }
    },
    []
  );

  // 특정 단락으로 스크롤하는 핵심 함수 - 단순화된 로직
  const scrollToParagraph = useCallback((paragraphId: string) => {
    console.log('🎯 [PARAGRAPH_EDITOR] 스크롤 시작:', paragraphId);

    // Map에서 해당 단락의 DOM 요소를 찾기
    const targetElement = paragraphElementsMap.current.get(paragraphId);
    const scrollContainer = scrollContainerRef.current;

    if (!targetElement || !scrollContainer) {
      console.warn('⚠️ [PARAGRAPH_EDITOR] 스크롤 대상을 찾을 수 없음:', {
        targetElement: !!targetElement,
        scrollContainer: !!scrollContainer,
        paragraphId,
      });
      return;
    }

    try {
      // 스크롤 컨테이너 기준으로 대상 요소의 상대적 위치 계산
      const containerRect = scrollContainer.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();

      // 현재 스크롤 위치 + 대상 요소의 상대적 위치 - 여백(20px)
      const targetScrollPosition =
        scrollContainer.scrollTop + (targetRect.top - containerRect.top) - 20; // 20px 여백으로 완전히 최상단이 아닌 약간의 여백을 둠

      console.log('📊 [PARAGRAPH_EDITOR] 스크롤 위치 계산:', {
        currentScrollTop: scrollContainer.scrollTop,
        targetScrollPosition,
        containerTop: containerRect.top,
        targetTop: targetRect.top,
        paragraphId,
      });

      // 부드러운 스크롤로 이동
      scrollContainer.scrollTo({
        top: Math.max(0, targetScrollPosition), // 음수 방지
        behavior: 'smooth',
      });

      console.log('✅ [PARAGRAPH_EDITOR] 스크롤 실행 완료:', paragraphId);
    } catch (scrollError) {
      console.error('❌ [PARAGRAPH_EDITOR] 스크롤 실패:', scrollError);

      // fallback: scrollIntoView 사용
      try {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
        console.log('🔄 [PARAGRAPH_EDITOR] fallback 스크롤 완료:', paragraphId);
      } catch (fallbackError) {
        console.error(
          '❌ [PARAGRAPH_EDITOR] fallback 스크롤도 실패:',
          fallbackError
        );
      }
    }
  }, []);

  // 편집 모드 활성화와 함께 스크롤 실행하는 함수
  const handleActivateEditModeWithScroll = useCallback(
    (paragraphId: string) => {
      console.log(
        '🎯 [PARAGRAPH_EDITOR] 편집 모드 활성화 및 스크롤 요청:',
        paragraphId
      );

      // 1. 편집 모드 즉시 활성화
      onActivateEditMode(paragraphId);
    },
    [onActivateEditMode]
  );

  // 편집 모드 변경 감지하여 스크롤 실행 - useLayoutEffect로 DOM 업데이트 후 즉시 실행
  useLayoutEffect(() => {
    if (currentEditingParagraphId) {
      console.log(
        '🎯 [PARAGRAPH_EDITOR] 편집 모드 변경 감지, 스크롤 실행:',
        currentEditingParagraphId
      );

      // DOM 업데이트가 완료된 후 스크롤 실행
      // requestAnimationFrame으로 브라우저 렌더링 사이클에 맞춰 실행
      requestAnimationFrame(() => {
        scrollToParagraph(currentEditingParagraphId);
      });
    }
  }, [currentEditingParagraphId, scrollToParagraph]);

  // 미할당 단락들을 필터링하여 품질 검사 대상 추출
  const unassignedParagraphsForQualityCheck = useMemo(() => {
    return allVisibleParagraphs.filter(
      (paragraph) => paragraph.containerId === null
    );
  }, [allVisibleParagraphs]);

  // 콘텐츠 품질 분석 - 글자 수 체크 등
  const contentQualityAnalysisResults = useMemo((): ContentQualityIssue[] => {
    const detectedIssues: ContentQualityIssue[] = [];
    const effectiveRecommendedCharacterCount =
      getEffectiveRecommendedCharacterCount();

    unassignedParagraphsForQualityCheck.forEach((paragraph) => {
      const { content = '', id } = paragraph;

      // HTML 태그 제거하고 실제 텍스트 길이 계산
      const plainTextContent = content.replace(/<[^>]*>/g, '').trim();
      const actualContentLength = plainTextContent.length;

      // 너무 짧은 콘텐츠 에러 체크 (10자 미만)
      if (actualContentLength > 0 && actualContentLength < 10) {
        detectedIssues.push({
          id: `short-content-${id}`,
          type: 'error',
          message: `콘텐츠가 너무 짧습니다 (현재: ${actualContentLength}자, 최소: 10자 필요)`,
          icon: 'lucide:alert-circle',
        });
      }

      // 권장 길이보다 짧은 콘텐츠 경고 체크
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

  // 에러와 경고를 분류하여 UI에 표시
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

  // 이전 단락 개수를 추적하여 새 단락 생성 감지
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
            scrollToParagraph(newestParagraph.id);
          }, 100); // 약간의 지연으로 DOM 업데이트 보장
        });
      }
    }

    // 이전 개수 업데이트
    previousParagraphCountRef.current = currentCount;
  }, [allVisibleParagraphs.length, allVisibleParagraphs, scrollToParagraph]);

  // 새 단락 추가 버튼 핸들러
  const handleAddNewParagraph = useCallback(() => {
    console.log('➕ [PARAGRAPH_EDITOR] 새 단락 추가 요청');
    addLocalParagraph();
  }, [addLocalParagraph]);

  // 미할당 단락 개수 계산
  const unassignedParagraphsCount = useMemo(() => {
    return allVisibleParagraphs.filter((p) => p.containerId === null).length;
  }, [allVisibleParagraphs]);

  return (
    <div
      className={`${
        isMobile ? 'w-full' : 'flex-1'
      } w-[50%] h-full border border-gray-200 rounded-lg pb-4 mr-[20px] flex flex-col`}
      role="region"
      aria-label="단락 편집 영역"
    >
      {/* 헤더 섹션 - 제목과 버튼들 */}
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

      {/* 콘텐츠 품질 검사 결과 표시 */}
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

          {/* 오류 목록 */}
          {criticalErrorIssues.length > 0 && (
            <div className="mb-3">
              <div className="mb-1 text-xs font-medium text-red-700">
                🚨 오류 ({criticalErrorIssues.length}개)
              </div>
              <ul className="space-y-1" role="list">
                {criticalErrorIssues.map((issue) => (
                  <li
                    key={issue.id}
                    className="flex items-start gap-2 text-xs text-red-600"
                    role="listitem"
                  >
                    <Icon
                      icon={issue.icon}
                      className="flex-shrink-0 mt-0.5 text-red-500"
                      aria-hidden="true"
                    />
                    <span className="leading-relaxed">{issue.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 경고 목록 */}
          {improvementWarningIssues.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium text-yellow-700">
                ⚠️ 권장사항 ({improvementWarningIssues.length}개)
              </div>
              <ul className="space-y-1" role="list">
                {improvementWarningIssues.map((issue) => (
                  <li
                    key={issue.id}
                    className="flex items-start gap-2 text-xs text-yellow-600"
                    role="listitem"
                  >
                    <Icon
                      icon={issue.icon}
                      className="flex-shrink-0 mt-0.5 text-yellow-500"
                      aria-hidden="true"
                    />
                    <span className="leading-relaxed">{issue.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 메인 콘텐츠 영역 - 스크롤 가능한 단락 목록 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 p-4 overflow-y-auto"
        role="main"
        aria-label="단락 목록"
      >
        {/* 단락 통계 */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>전체 단락: {allVisibleParagraphs.length}개</span>
            <span>미할당: {unassignedParagraphsCount}개</span>
          </div>
        </div>

        {/* 단락 카드 목록 */}
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
              onRegisterRef={registerParagraphElement}
            />
          ))}

          {/* 빈 상태 표시 */}
          {allVisibleParagraphs.length === 0 && (
            <EmptyParagraphState addLocalParagraph={addLocalParagraph} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ParagraphEditor;
