// 📁 src/components/moduleEditor/hooks/useStructureAnalysis.ts

import { useMemo } from 'react';

// 🏗️ 타입 정의
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

// 🎯 구조 관련 디버깅 정보 인터페이스
interface StructureIssue {
  id: string;
  type: 'error' | 'warning';
  message: string;
  icon: string;
  count?: number;
}

// 📊 구조 분석 결과 인터페이스
interface StructureAnalysis {
  totalContainers: number;
  totalAssignedParagraphs: number;
  emptyContainerCount: number;
  emptyContainers: Array<{
    containerId: string;
    containerName: string;
    paragraphCount: number;
  }>;
  containerParagraphCounts: Array<{
    containerId: string;
    containerName: string;
    paragraphCount: number;
  }>;
}

// 🔄 구조 분석 결과와 이슈 정보를 포함한 전체 반환 타입
interface UseStructureAnalysisReturn {
  structureAnalysis: StructureAnalysis;
  structureIssues: StructureIssue[];
  errorIssues: StructureIssue[];
  warningIssues: StructureIssue[];
}

/**
 * 🔍 구조 분석 커스텀 훅
 *
 * 컨테이너와 단락의 구조를 분석하여 다음 정보를 제공합니다:
 * - 각 컨테이너별 단락 개수 통계
 * - 전체 할당된 단락 수
 * - 빈 컨테이너 검출
 * - 구조 관련 오류 및 경고 사항
 *
 * @param sortedContainers - 정렬된 컨테이너 배열
 * @param getLocalParagraphsByContainer - 컨테이너별 단락을 가져오는 함수
 * @returns 구조 분석 결과와 이슈 정보
 */
function useStructureAnalysis(
  sortedContainers: Container[],
  getLocalParagraphsByContainer: (containerId: string) => LocalParagraph[]
): UseStructureAnalysisReturn {
  console.log('🔍 [USE_STRUCTURE_ANALYSIS] 훅 실행:', {
    containersCount: sortedContainers.length,
    timestamp: new Date().toISOString(),
  });

  // 🚀 구조 분석 로직
  const structureAnalysis = useMemo((): StructureAnalysis => {
    console.log('🔍 [USE_STRUCTURE_ANALYSIS] 구조 분석 시작');

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

    // 📦 빈 컨테이너 필터링
    const emptyContainers = containerParagraphCounts.filter(
      ({ paragraphCount }) => paragraphCount === 0
    );
    const emptyContainerCount = emptyContainers.length;

    console.log('📊 [USE_STRUCTURE_ANALYSIS] 구조 분석 결과:', {
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

    console.log('🚨 [USE_STRUCTURE_ANALYSIS] 구조 이슈 검출 완료:', {
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

    console.log('🔍 [USE_STRUCTURE_ANALYSIS] 이슈 분류:', {
      errors: errors.length,
      warnings: warnings.length,
    });

    return {
      errorIssues: errors,
      warningIssues: warnings,
    };
  }, [structureIssues]);

  return {
    structureAnalysis,
    structureIssues,
    errorIssues,
    warningIssues,
  };
}

export default useStructureAnalysis;

// 🔄 타입들도 함께 export (다른 컴포넌트에서 사용할 수 있도록)
export type {
  Container,
  LocalParagraph,
  StructureIssue,
  StructureAnalysis,
  UseStructureAnalysisReturn,
};

/**
 * 🔧 useStructureAnalysis 훅의 주요 특징:
 *
 * 1. ✅ 관심사 분리
 *    - UI 로직에서 비즈니스 로직 분리
 *    - 재사용 가능한 구조 분석 로직
 *    - 타입 안전성 확보
 *
 * 2. ✅ 성능 최적화
 *    - useMemo를 활용한 메모이제이션
 *    - 의존성 배열 최적화
 *    - 불필요한 재계산 방지
 *
 * 3. ✅ 상세한 디버깅
 *    - 각 단계별 콘솔 로깅
 *    - 분석 결과 상세 출력
 *    - 성능 추적 가능
 *
 * 4. ✅ 확장 가능한 구조
 *    - 새로운 이슈 타입 추가 용이
 *    - 분석 로직 확장 가능
 *    - 인터페이스 기반 타입 정의
 *
 * 5. ✅ 타입 안전성
 *    - any 타입 완전 제거
 *    - 구체적인 인터페이스 정의
 *    - 컴파일 타임 에러 검출
 */
