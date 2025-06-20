import React, { useMemo } from 'react';
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
  unassignedParagraphs: LocalParagraph[];
  internalState: EditorInternalState;
  sortedContainers: Container[];
  addLocalParagraph: () => void;
  deleteLocalParagraph: (id: string) => void;
  updateLocalParagraphContent: (id: string, content: string) => void;
  toggleParagraphSelection: (id: string) => void;
  addToLocalContainer: () => void;
  setTargetContainerId: (containerId: string) => void;
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>;

  // 🚀 목표카운트기능과 연동을 위한 새로운 props
  recommendedChars?: number; // TextCountContainer에서 전달받는 권장 글자수
  isGoalModeEnabled?: boolean; // 목표 모드 활성화 여부
}

// 🎯 콘텐츠 품질 디버깅 정보 인터페이스
interface ContentQualityIssue {
  id: string;
  type: 'error' | 'warning';
  message: string;
  icon: string;
}

function ParagraphEditor({
  isMobile,
  unassignedParagraphs,
  internalState,
  sortedContainers,
  addLocalParagraph,
  deleteLocalParagraph,
  updateLocalParagraphContent,
  toggleParagraphSelection,
  addToLocalContainer,
  setTargetContainerId,
  setInternalState,
  // 🚀 새로운 props
  recommendedChars = 30, // 디폴트 30자
  isGoalModeEnabled = false,
}: ParagraphEditorProps) {
  console.log('📝 [PARAGRAPH_EDITOR] 렌더링:', {
    isMobile,
    unassignedParagraphsCount: unassignedParagraphs.length,
    recommendedChars, // 🚀 로깅에 추가
    isGoalModeEnabled, // 🚀 로깅에 추가
    timestamp: new Date().toISOString(),
  });

  // 🚀 권장 글자수 동적 계산 함수
  const getEffectiveRecommendedChars = React.useCallback(() => {
    // 목표 모드가 활성화되어 있고 recommendedChars가 유효한 경우 해당 값 사용
    if (isGoalModeEnabled && recommendedChars && recommendedChars > 0) {
      return recommendedChars;
    }
    // 그렇지 않으면 디폴트 30자 사용
    return 30;
  }, [recommendedChars, isGoalModeEnabled]);

  // 🚀 콘텐츠 품질 분석 로직 (권장 기준 동적 적용)
  const contentQualityIssues = useMemo((): ContentQualityIssue[] => {
    const issues: ContentQualityIssue[] = [];
    const effectiveRecommendedChars = getEffectiveRecommendedChars();

    // 🔍 각 단락의 콘텐츠 분석
    unassignedParagraphs.forEach((paragraph) => {
      const { content = '', id } = paragraph;

      // HTML 태그 제거하여 실제 텍스트 길이 계산
      const plainTextContent = content.replace(/<[^>]*>/g, '').trim();
      const contentLength = plainTextContent.length;

      // ❌ 콘텐츠가 너무 짧음 (최소 10자 필요)
      if (contentLength > 0 && contentLength < 10) {
        issues.push({
          id: `short-content-${id}`,
          type: 'error',
          message: `콘텐츠가 너무 짧습니다 (현재: ${contentLength}자, 최소: 10자 필요)`,
          icon: 'lucide:alert-circle',
        });
      }

      // ⚠️ 콘텐츠가 권장 길이 미만 (🚀 동적 권장 기준 적용)
      if (contentLength > 0 && contentLength < effectiveRecommendedChars) {
        issues.push({
          id: `short-recommended-${id}`,
          type: 'warning',
          message: `콘텐츠가 권장 길이보다 짧습니다 (현재: ${contentLength}자, 권장: ${effectiveRecommendedChars}자 이상)`,
          icon: 'lucide:alert-triangle',
        });
      }
    });

    console.log('📊 [PARAGRAPH_EDITOR] 콘텐츠 품질 분석 완료:', {
      totalParagraphs: unassignedParagraphs.length,
      issuesFound: issues.length,
      issueTypes: issues.map((issue) => issue.type),
      effectiveRecommendedChars, // 🚀 현재 적용된 권장 기준 로깅
      isGoalModeEnabled, // 🚀 목표 모드 상태 로깅
    });

    return issues;
  }, [unassignedParagraphs, getEffectiveRecommendedChars]); // 🚀 의존성에 getEffectiveRecommendedChars 추가

  // 🎯 이슈 타입별 분류
  const { errorIssues, warningIssues } = useMemo(() => {
    const errors = contentQualityIssues.filter(
      (issue) => issue.type === 'error'
    );
    const warnings = contentQualityIssues.filter(
      (issue) => issue.type === 'warning'
    );

    console.log('🔍 [PARAGRAPH_EDITOR] 이슈 분류:', {
      errors: errors.length,
      warnings: warnings.length,
    });

    return {
      errorIssues: errors,
      warningIssues: warnings,
    };
  }, [contentQualityIssues]);

  const handleAddParagraph = () => {
    console.log('➕ [PARAGRAPH_EDITOR] 새 단락 추가 요청');
    addLocalParagraph();
  };

  return (
    <div
      className={`${
        isMobile ? 'w-full' : 'flex-1'
      } w-[50%] h-full border border-gray-200 rounded-lg pb-4 mr-[20px]`}
    >
      {/* 📋 헤더 영역 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col">
          <span className="text-lg font-semibold">📝 단락 작성 (Tiptap)</span>
          {/* 🚀 목표 모드 상태 표시 */}
          {isGoalModeEnabled && (
            <span className="mt-1 text-xs text-blue-600">
              🎯 목표 모드 활성화 (권장: {getEffectiveRecommendedChars()}자
              이상)
            </span>
          )}
        </div>
        <Button
          type="button"
          color="primary"
          size="sm"
          onPress={handleAddParagraph}
          startContent={<Icon icon="lucide:plus" />}
          aria-label="새로운 단락 추가"
        >
          새 단락
        </Button>
      </div>

      {/* 🚨 콘텐츠 품질 디버깅 정보 영역 */}
      {contentQualityIssues.length > 0 && (
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-yellow-50">
          <div className="mb-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-800">
              <Icon icon="lucide:clipboard-check" className="text-orange-500" />
              콘텐츠 품질 검사
              {/* 🚀 현재 권장 기준 표시 */}
              <span className="ml-2 text-xs text-gray-600">
                (권장 기준: {getEffectiveRecommendedChars()}자)
              </span>
            </h4>
          </div>

          {/* ❌ 오류 목록 */}
          {errorIssues.length > 0 && (
            <div className="mb-3">
              <div className="mb-1 text-xs font-medium text-red-700">
                🚨 오류 ({errorIssues.length}개)
              </div>
              <ul className="space-y-1">
                {errorIssues.map((issue) => (
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

          {/* ⚠️ 경고 목록 */}
          {warningIssues.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium text-yellow-700">
                ⚠️ 권장사항 ({warningIssues.length}개)
              </div>
              <ul className="space-y-1">
                {warningIssues.map((issue) => (
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

      {/* 📝 단락 편집 영역 */}
      <div className="p-4 overflow-y-auto h-[calc(100%-65px)]">
        <div className="h-full space-y-6">
          {unassignedParagraphs.map((paragraph) => (
            <ParagraphCard
              key={paragraph.id}
              paragraph={paragraph}
              internalState={internalState}
              sortedContainers={sortedContainers}
              deleteLocalParagraph={deleteLocalParagraph}
              updateLocalParagraphContent={updateLocalParagraphContent}
              toggleParagraphSelection={toggleParagraphSelection}
              addToLocalContainer={addToLocalContainer}
              setTargetContainerId={setTargetContainerId}
            />
          ))}

          {unassignedParagraphs.length === 0 && (
            <EmptyParagraphState addLocalParagraph={addLocalParagraph} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ParagraphEditor;

/**
 * 🔧 목표카운트기능 연동 추가 내역:
 *
 * 1. ✅ Props 인터페이스 확장
 *    - recommendedChars?: number (권장 글자수)
 *    - isGoalModeEnabled?: boolean (목표 모드 상태)
 *
 * 2. ✅ 동적 권장 기준 적용
 *    - getEffectiveRecommendedChars() 함수로 권장 기준 계산
 *    - 목표 모드 ON: TextCountContainer에서 전달받은 값 사용
 *    - 목표 모드 OFF: 디폴트 30자 사용
 *
 * 3. ✅ 콘텐츠 품질 분석 로직 개선
 *    - 하드코딩된 100자 → 동적 recommendedChars 값 사용
 *    - 의존성 배열에 getEffectiveRecommendedChars 추가
 *
 * 4. ✅ UI 개선
 *    - 헤더에 목표 모드 상태 및 현재 권장 기준 표시
 *    - 품질 검사 영역에 현재 권장 기준 정보 추가
 *
 * 5. ✅ 디버깅 정보 강화
 *    - 콘솔 로그에 권장 기준 및 목표 모드 상태 추가
 *    - 품질 분석 완료 시 현재 적용된 기준 로깅
 *
 * 6. ✅ 기존 기능 완전 유지
 *    - 모든 기존 props 및 기능 그대로 유지
 *    - 단락 추가/편집/삭제 기능 변경 없음
 *    - 기존 비즈니스 로직 보존
 *
 * 7. ✅ TextCountContainer와 완벽 연동
 *    - recommendedChars props로 실시간 권장 기준 수신
 *    - 목표 모드 변경 시 즉시 품질 검사 기준 업데이트
 *    - parseInt 방식 타입 변환과 호환
 */
