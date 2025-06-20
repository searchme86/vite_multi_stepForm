// 📁 src/components/moduleEditor/parts/WritingStep/paragraph/ParagraphEditor.tsx

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
}: ParagraphEditorProps) {
  console.log('📝 [PARAGRAPH_EDITOR] 렌더링:', {
    isMobile,
    unassignedParagraphsCount: unassignedParagraphs.length,
    timestamp: new Date().toISOString(),
  });

  // 🚀 콘텐츠 품질 분석 로직
  const contentQualityIssues = useMemo((): ContentQualityIssue[] => {
    const issues: ContentQualityIssue[] = [];

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

      // ⚠️ 콘텐츠가 권장 길이 미만 (권장: 100자 이상)
      if (contentLength > 0 && contentLength < 100) {
        issues.push({
          id: `short-recommended-${id}`,
          type: 'warning',
          message: `콘텐츠가 권장 길이보다 짧습니다 (현재: ${contentLength}자, 권장: 100자 이상)`,
          icon: 'lucide:alert-triangle',
        });
      }
    });

    console.log('📊 [PARAGRAPH_EDITOR] 콘텐츠 품질 분석 완료:', {
      totalParagraphs: unassignedParagraphs.length,
      issuesFound: issues.length,
      issueTypes: issues.map((issue) => issue.type),
    });

    return issues;
  }, [unassignedParagraphs]);

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
        <span className="text-lg font-semibold">📝 단락 작성 (Tiptap)</span>
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
 * 🔧 콘텐츠 품질 디버깅 정보 추가 내역:
 *
 * 1. ✅ 콘텐츠 품질 분석 로직 추가
 *    - 각 단락의 실제 텍스트 길이 계산 (HTML 태그 제외)
 *    - 10자 미만 오류 검출
 *    - 100자 미만 권장사항 표시
 *
 * 2. ✅ 시각적 피드백 시스템
 *    - 오류/경고 아이콘과 색상 구분
 *    - 그라데이션 배경으로 주의 집중
 *    - ul li 리스트 형태로 구조화된 표시
 *
 * 3. ✅ 성능 최적화
 *    - useMemo로 불필요한 재계산 방지
 *    - 콘솔 로깅으로 디버깅 지원
 *    - 메모이제이션된 이슈 분류
 *
 * 4. ✅ 기존 기능 완전 유지
 *    - 모든 props 전달 방식 동일
 *    - 기존 비즈니스 로직 변경 없음
 *    - 단락 추가/편집 기능 그대로 유지
 */
