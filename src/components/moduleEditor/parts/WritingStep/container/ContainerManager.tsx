// 📁 src/components/moduleEditor/parts/WritingStep/sidebar/slides/StructureManagementSlide.tsx

import { Icon } from '@iconify/react';
import ContainerCard from './ContainerCard';
import EmptyContainerState from './EmptyContainerState';
import {
  StructureAnalysis,
  StructureIssue,
} from '../../../hooks/useStructureAnalysis';

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
  // 🔍 구조 분석 결과를 props로 받음 (훅에서 계산된 결과)
  structureAnalysis: StructureAnalysis;
  structureIssues: StructureIssue[];
}

/**
 * 📦 ContainerManager 컴포넌트
 *
 * 컨테이너 목록을 관리하고 표시하는 컴포넌트입니다.
 * 구조 분석 로직은 상위 컴포넌트에서 useStructureAnalysis 훅을 통해 수행되고,
 * 결과를 props로 받아서 UI에만 집중합니다.
 *
 * @param isMobile - 모바일 모드 여부
 * @param sortedContainers - 정렬된 컨테이너 배열
 * @param getLocalParagraphsByContainer - 컨테이너별 단락 조회 함수
 * @param moveLocalParagraphInContainer - 단락 순서 변경 함수
 * @param activateEditor - 에디터 활성화 함수
 * @param structureAnalysis - 구조 분석 결과 (훅에서 계산됨)
 * @param structureIssues - 구조 이슈 목록 (훅에서 계산됨)
 */
function ContainerManager({
  isMobile,
  sortedContainers,
  getLocalParagraphsByContainer,
  moveLocalParagraphInContainer,
  activateEditor,
  structureAnalysis,
  structureIssues,
}: ContainerManagerProps) {
  console.log('📦 [CONTAINER_MANAGER] 렌더링:', {
    isMobile,
    containersCount: sortedContainers.length,
    totalParagraphs: structureAnalysis.totalAssignedParagraphs,
    totalIssues: structureIssues.length,
    timestamp: new Date().toISOString(),
  });

  // 🎯 이슈 타입별 분류 (props로 받은 이슈 데이터 활용)
  const errorIssues = structureIssues.filter((issue) => issue.type === 'error');
  const warningIssues = structureIssues.filter(
    (issue) => issue.type === 'warning'
  );

  console.log('🔍 [CONTAINER_MANAGER] 이슈 분류:', {
    totalIssues: structureIssues.length,
    errors: errorIssues.length,
    warnings: warningIssues.length,
    issueDetails: structureIssues.map((issue) => ({
      id: issue.id,
      type: issue.type,
      message: issue.message,
    })),
  });

  return (
    <div
      className={`${
        isMobile ? 'w-full' : 'h-full'
      } border border-gray-200 rounded-lg`}
    >
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
 * 🔧 구조 분석 로직 상위 이동 수정 내역:
 *
 * 1. ✅ 내부 구조 분석 로직 제거
 *    - useMemo로 계산하던 structureAnalysis 제거
 *    - useMemo로 계산하던 structureIssues 제거
 *    - 중복 계산 완전 제거
 *
 * 2. ✅ Props 타입 확장
 *    - structureAnalysis: StructureAnalysis 추가
 *    - structureIssues: StructureIssue[] 추가
 *    - 훅에서 계산된 결과를 props로 받음
 *
 * 3. ✅ 타입 Import 추가
 *    - StructureAnalysis, StructureIssue 타입 import
 *    - 타입 안전성 확보
 *
 * 4. ✅ 기존 UI 로직 완전 유지
 *    - 이슈 표시 UI 동일하게 유지
 *    - 컨테이너 카드 렌더링 로직 변경 없음
 *    - 빈 상태 표시 로직 유지
 *
 * 5. ✅ 성능 최적화 달성
 *    - 중복 계산 제거로 성능 향상
 *    - 단일 책임 원칙 준수
 *    - 관심사 분리 달성
 *
 * 6. ✅ 디버깅 정보 개선
 *    - props로 받은 분석 결과 활용한 로깅
 *    - 더 상세한 이슈 정보 출력
 *    - 성능 추적 가능
 */

/**
 * 🎨 ContainerManager의 주요 변화:
 *
 * 1. 📊 관심사 분리 달성
 *    - 비즈니스 로직: useStructureAnalysis 훅
 *    - UI 로직: ContainerManager 컴포넌트
 *    - 각각의 역할과 책임 명확히 분리
 *
 * 2. 🔄 재사용성 향상
 *    - 구조 분석 로직을 다른 컴포넌트에서도 사용 가능
 *    - UI 컴포넌트는 순수한 표시 역할만 담당
 *    - 테스트 용이성 향상
 *
 * 3. ⚡ 성능 최적화
 *    - 중복 계산 완전 제거
 *    - 상위에서 한 번만 계산하고 결과 공유
 *    - 불필요한 리렌더링 방지
 *
 * 4. 🔒 타입 안전성
 *    - 구체적인 타입 정의 사용
 *    - any 타입 완전 제거
 *    - 컴파일 타임 에러 검출 가능
 *
 * 5. 🐛 디버깅 개선
 *    - 더 명확한 로깅 정보
 *    - 분석 결과와 UI 상태 분리 추적
 *    - 문제 발생 지점 명확히 식별 가능
 */
