// 📁 src/components/moduleEditor/parts/WritingStep/sidebar/slides/StructureManagementSlide.tsx

import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import ContainerCard from './ContainerCard';
import EmptyContainerState from './EmptyContainerState';

interface Container {
  id: string;
  name: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
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

interface ContainerManagerProps {
  isMobile: boolean;
  sortedContainers: Container[];
  getLocalParagraphsByContainer: (containerId: string) => LocalParagraph[];
  moveLocalParagraphInContainer: (id: string, direction: 'up' | 'down') => void;
  activateEditor: (id: string) => void;
}

// 🎯 구조 관련 디버깅 정보 인터페이스
interface StructureIssue {
  id: string;
  type: 'error' | 'warning';
  message: string;
  icon: string;
  count?: number;
}

function ContainerManager({
  isMobile,
  sortedContainers,
  getLocalParagraphsByContainer,
  moveLocalParagraphInContainer,
  activateEditor,
}: ContainerManagerProps) {
  console.log('📦 [CONTAINER_MANAGER] 렌더링:', {
    isMobile,
    containersCount: sortedContainers.length,
    timestamp: new Date().toISOString(),
  });

  // 🚀 구조 분석 로직
  const structureAnalysis = useMemo(() => {
    console.log('🔍 [CONTAINER_MANAGER] 구조 분석 시작');

    // 📊 각 컨테이너별 단락 개수 계산
    const containerParagraphCounts = sortedContainers.map((container) => {
      const paragraphs = getLocalParagraphsByContainer(container.id);
      return {
        containerId: container.id,
        containerName: container.name,
        paragraphCount: paragraphs.length,
      };
    });

    // 📈 전체 통계 계산
    const totalAssignedParagraphs = containerParagraphCounts.reduce(
      (sum, { paragraphCount }) => sum + paragraphCount,
      0
    );
    const emptyContainers = containerParagraphCounts.filter(
      ({ paragraphCount }) => paragraphCount === 0
    );
    const emptyContainerCount = emptyContainers.length;

    console.log('📊 [CONTAINER_MANAGER] 구조 분석 결과:', {
      totalContainers: sortedContainers.length,
      totalAssignedParagraphs,
      emptyContainerCount,
      containerDetails: containerParagraphCounts,
    });

    return {
      totalContainers: sortedContainers.length,
      totalAssignedParagraphs,
      emptyContainerCount,
      emptyContainers,
      containerParagraphCounts,
    };
  }, [sortedContainers, getLocalParagraphsByContainer]);

  // 🚨 구조 관련 이슈 검출
  const structureIssues = useMemo((): StructureIssue[] => {
    const issues: StructureIssue[] = [];
    const { totalAssignedParagraphs, emptyContainerCount, emptyContainers } =
      structureAnalysis;

    // ❌ 문단이 전혀 없는 경우
    if (totalAssignedParagraphs === 0) {
      issues.push({
        id: 'no-paragraphs',
        type: 'error',
        message: '문단이 없습니다',
        icon: 'lucide:file-text',
      });
    }

    // ⚠️ 문단이 3개 미만인 경우 (권장사항)
    if (totalAssignedParagraphs > 0 && totalAssignedParagraphs < 3) {
      issues.push({
        id: 'few-paragraphs',
        type: 'warning',
        message: `문단이 3개 미만입니다 (현재: ${totalAssignedParagraphs}개, 권장: 3개 이상)`,
        icon: 'lucide:alert-triangle',
        count: totalAssignedParagraphs,
      });
    }

    // ⚠️ 빈 컨테이너가 있는 경우
    if (emptyContainerCount > 0) {
      const containerNames = emptyContainers
        .map(({ containerName }) => containerName)
        .join(', ');

      issues.push({
        id: 'empty-containers',
        type: 'warning',
        message: `빈 컨테이너가 ${emptyContainerCount}개 있습니다 (${containerNames})`,
        icon: 'lucide:folder-x',
        count: emptyContainerCount,
      });
    }

    console.log('🚨 [CONTAINER_MANAGER] 구조 이슈 검출 완료:', {
      totalIssues: issues.length,
      issueTypes: issues.map((issue) => issue.type),
      issueIds: issues.map((issue) => issue.id),
    });

    return issues;
  }, [structureAnalysis]);

  // 🎯 이슈 타입별 분류
  const { errorIssues, warningIssues } = useMemo(() => {
    const errors = structureIssues.filter((issue) => issue.type === 'error');
    const warnings = structureIssues.filter(
      (issue) => issue.type === 'warning'
    );

    console.log('🔍 [CONTAINER_MANAGER] 이슈 분류:', {
      errors: errors.length,
      warnings: warnings.length,
    });

    return {
      errorIssues: errors,
      warningIssues: warnings,
    };
  }, [structureIssues]);

  return (
    <div
      className={`${
        isMobile ? 'w-full' : 'h-full'
      } border border-gray-200 rounded-lg`}
    >
      {/* 📋 헤더 영역 */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <span className="text-lg font-semibold">📦 컨테이너 관리</span>
        <p className="mt-1 text-sm text-gray-600">
          컨테이너를 관리하고 단락을 구조하세요
        </p>
      </div>

      {/* 🚨 구조 디버깅 정보 영역 */}
      {structureIssues.length > 0 && (
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="mb-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-800">
              <Icon icon="lucide:layout-dashboard" className="text-blue-500" />
              구조 검사
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

      {/* 📦 컨테이너 관리 영역 */}
      <div className="p-4 overflow-y-auto h-[calc(100%-61px)]">
        <div className="space-y-4">
          {sortedContainers.map((container) => (
            <ContainerCard
              key={container.id}
              container={container}
              containerParagraphs={getLocalParagraphsByContainer(container.id)}
              moveLocalParagraphInContainer={moveLocalParagraphInContainer}
              activateEditor={activateEditor}
            />
          ))}

          {sortedContainers.length === 0 && <EmptyContainerState />}
        </div>
      </div>
    </div>
  );
}

export default ContainerManager;

/**
 * 🔧 구조 관련 디버깅 정보 추가 내역:
 *
 * 1. ✅ 구조 분석 로직 추가
 *    - 각 컨테이너별 단락 개수 계산
 *    - 전체 할당된 단락 수 계산
 *    - 빈 컨테이너 검출 및 이름 표시
 *
 * 2. ✅ 구조 이슈 검출 시스템
 *    - 문단이 없는 경우 오류 표시
 *    - 문단 3개 미만 권장사항 표시
 *    - 빈 컨테이너 경고 및 컨테이너명 표시
 *
 * 3. ✅ 시각적 피드백 향상
 *    - 블루 그라데이션 배경으로 구조 영역 구분
 *    - 오류/경고 아이콘과 색상 구분
 *    - ul li 리스트 형태로 구조화된 표시
 *
 * 4. ✅ 성능 최적화 및 디버깅
 *    - useMemo로 구조 분석 결과 캐싱
 *    - 상세한 콘솔 로깅으로 분석 과정 추적
 *    - 메모이제이션된 이슈 분류
 *
 * 5. ✅ 기존 기능 완전 유지
 *    - 모든 컨테이너 관리 기능 그대로 유지
 *    - ContainerCard 렌더링 로직 변경 없음
 *    - 기존 props 전달 방식 동일
 */
