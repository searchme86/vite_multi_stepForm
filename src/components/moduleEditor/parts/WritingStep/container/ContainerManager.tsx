// 📁 components/moduleEditor/parts/WritingStep/container/ContainerManager.tsx

import React, { useMemo } from 'react';
import { ScrollShadow } from '@heroui/react';
import ContainerCard from './ContainerCard';
import type { Container } from '../../../../../store/shared/commonTypes';
import type {
  StructureAnalysis,
  StructureIssue,
} from '../../../hooks/useStructureAnalysis';

// 🏗️ LocalParagraph 인터페이스 정의 (타입 안전성 확보)
interface LocalParagraph {
  id: string;
  content: string;
  containerId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  originalId?: string;
}

// 🔧 ContainerManagerProps 인터페이스 (moveToContainer 함수 추가)
interface ContainerManagerProps {
  isMobile: boolean;
  sortedContainers: Container[];
  getLocalParagraphsByContainer: (containerId: string) => LocalParagraph[];
  moveLocalParagraphInContainer: (id: string, direction: 'up' | 'down') => void;
  activateEditor: (id: string) => void;

  // 🔄 새로 추가되는 props
  moveToContainer: (paragraphId: string, targetContainerId: string) => void; // 컨테이너 간 이동 함수

  // 📊 구조 분석 관련 (선택적)
  structureAnalysis?: StructureAnalysis;
  structureIssues?: StructureIssue[];
}

// 🛡️ Container 타입 안전성 확보 함수 (updatedAt 속성 추가 반영)
function ensureContainerSafety(container: Container): Container {
  // createdAt이 undefined인 경우 현재 시간으로 fallback
  const safeCreatedAt =
    container.createdAt instanceof Date ? container.createdAt : new Date();

  // ✅ updatedAt이 undefined인 경우 현재 시간으로 fallback (새로 추가)
  const safeUpdatedAt =
    container.updatedAt instanceof Date ? container.updatedAt : new Date();

  return {
    ...container,
    createdAt: safeCreatedAt,
    updatedAt: safeUpdatedAt, // ✅ updatedAt 속성 안전하게 처리
  };
}

// 🛡️ Container 배열 타입 안전성 확보 함수 (updatedAt 속성 추가 반영)
function ensureContainerArraySafety(containers: Container[]): Container[] {
  const validContainers = Array.isArray(containers) ? containers : [];

  return validContainers.map((container) => {
    // container가 객체이고 필수 속성들이 있는지 확인
    if (!container || typeof container !== 'object') {
      console.warn('⚠️ [CONTAINER_MANAGER] 잘못된 컨테이너 객체:', container);
      return {
        id: `fallback_${Date.now()}`,
        name: '알 수 없는 컨테이너',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(), // ✅ updatedAt 속성 fallback 값 추가
      };
    }

    return ensureContainerSafety(container);
  });
}

/**
 * 🗂️ ContainerManager 컴포넌트
 *
 * 컨테이너들을 관리하고 각 컨테이너의 단락들을 표시합니다.
 * 컨테이너 간 단락 이동 기능을 지원합니다.
 *
 * @param isMobile - 모바일 모드 여부
 * @param sortedContainers - 정렬된 컨테이너 목록
 * @param getLocalParagraphsByContainer - 컨테이너별 단락 조회 함수
 * @param moveLocalParagraphInContainer - 컨테이너 내 단락 순서 이동 함수
 * @param activateEditor - 에디터 활성화 함수
 * @param moveToContainer - 컨테이너 간 단락 이동 함수 (새로 추가)
 * @param structureAnalysis - 구조 분석 결과 (선택적)
 * @param structureIssues - 구조 이슈 목록 (선택적)
 */
function ContainerManager({
  isMobile,
  sortedContainers,
  getLocalParagraphsByContainer,
  moveLocalParagraphInContainer,
  activateEditor,
  moveToContainer, // 🔄 새로 추가된 함수
  structureAnalysis,
  structureIssues,
}: ContainerManagerProps) {
  // 🔍 입력값 검증 및 안전한 처리
  const validIsMobile = typeof isMobile === 'boolean' ? isMobile : false;
  const validSortedContainers = ensureContainerArraySafety(sortedContainers);

  console.log('🗂️ [CONTAINER_MANAGER] 렌더링:', {
    isMobile: validIsMobile,
    containersCount: validSortedContainers.length,
    hasGetParagraphsFunction:
      typeof getLocalParagraphsByContainer === 'function',
    hasMoveInContainerFunction:
      typeof moveLocalParagraphInContainer === 'function',
    hasActivateEditorFunction: typeof activateEditor === 'function',
    hasMoveToContainerFunction: typeof moveToContainer === 'function', // 🔄 새로 추가
    hasStructureAnalysis: !!structureAnalysis,
    structureIssuesCount: Array.isArray(structureIssues)
      ? structureIssues.length
      : 0,
  });

  // 🎯 각 컨테이너별 단락 개수 계산 (성능 최적화)
  const containerParagraphCounts = useMemo(() => {
    const counts = new Map<string, number>();

    validSortedContainers.forEach((container) => {
      try {
        const paragraphs = getLocalParagraphsByContainer(container.id);
        const validParagraphs = Array.isArray(paragraphs) ? paragraphs : [];
        counts.set(container.id, validParagraphs.length);
      } catch (error) {
        console.error('❌ [CONTAINER_MANAGER] 단락 개수 계산 실패:', {
          containerId: container.id,
          error,
        });
        counts.set(container.id, 0);
      }
    });

    console.log(
      '📊 [CONTAINER_MANAGER] 컨테이너별 단락 개수:',
      Object.fromEntries(counts.entries())
    );

    return counts;
  }, [validSortedContainers, getLocalParagraphsByContainer]);

  // 🎯 총 단락 개수 계산
  const totalParagraphs = useMemo(() => {
    return Array.from(containerParagraphCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );
  }, [containerParagraphCounts]);

  // 🎯 빈 컨테이너가 있는지 확인
  const hasEmptyContainers = useMemo(() => {
    return Array.from(containerParagraphCounts.values()).some(
      (count) => count === 0
    );
  }, [containerParagraphCounts]);

  // 🎯 컨테이너 렌더링이 가능한지 확인
  const canRenderContainers = useMemo(() => {
    return (
      validSortedContainers.length > 0 &&
      typeof getLocalParagraphsByContainer === 'function' &&
      typeof moveLocalParagraphInContainer === 'function' &&
      typeof activateEditor === 'function' &&
      typeof moveToContainer === 'function' // 🔄 새로 추가된 함수 검증
    );
  }, [
    validSortedContainers.length,
    getLocalParagraphsByContainer,
    moveLocalParagraphInContainer,
    activateEditor,
    moveToContainer, // 🔄 의존성 배열에 추가
  ]);

  // 🚨 필수 함수들이 제공되지 않은 경우 에러 표시
  if (!canRenderContainers) {
    console.error('❌ [CONTAINER_MANAGER] 필수 함수들이 제공되지 않음:', {
      hasGetFunction: typeof getLocalParagraphsByContainer === 'function',
      hasMoveFunction: typeof moveLocalParagraphInContainer === 'function',
      hasActivateFunction: typeof activateEditor === 'function',
      hasMoveToContainerFunction: typeof moveToContainer === 'function', // 🔄 추가
      containersCount: validSortedContainers.length,
    });

    return (
      <div className="flex items-center justify-center h-64 text-center">
        <div className="p-6 border border-red-200 rounded-lg bg-red-50">
          <div className="mb-2 text-lg font-semibold text-red-700">
            🚨 컨테이너 관리 기능 오류
          </div>
          <div className="mb-3 text-sm text-red-600">
            필수 함수들이 제공되지 않았습니다
          </div>
          <div className="text-xs text-red-500">
            개발자 도구 콘솔에서 자세한 오류 정보를 확인하세요
          </div>
        </div>
      </div>
    );
  }

  // 📭 컨테이너가 없는 경우
  if (validSortedContainers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-center">
        <div className="p-6 border-2 border-gray-200 border-dashed rounded-lg">
          <div className="mb-3 text-4xl">📝</div>
          <div className="mb-2 text-lg font-semibold text-gray-700">
            컨테이너가 없습니다
          </div>
          <div className="text-sm text-gray-500">
            먼저 컨테이너를 생성해주세요
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 📊 헤더 통계 정보 */}
      <div className="flex-shrink-0 p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
              📁 {validSortedContainers.length}개 컨테이너
            </span>
            <span className="text-sm text-gray-500">
              📄 {totalParagraphs}개 단락
            </span>
            {hasEmptyContainers && (
              <span className="px-2 py-1 text-xs text-yellow-700 bg-yellow-100 rounded">
                ⚠️ 빈 컨테이너 있음
              </span>
            )}
            {/* 🔄 새로운 기능 표시 */}
            <span className="px-2 py-1 text-xs text-purple-700 bg-purple-100 rounded">
              🔄 이동 기능 활성
            </span>
          </div>

          <div className="text-xs text-gray-400">
            {validIsMobile ? '📱 모바일' : '💻 데스크톱'}
          </div>
        </div>

        {/* 📈 구조 분석 정보 표시 (있는 경우만) - unassignedParagraphCount 안전 처리 */}
        {structureAnalysis && (
          <div className="mt-2 text-xs text-gray-500">
            📊 할당: {structureAnalysis.totalAssignedParagraphs}개 | 미할당:{' '}
            {
              // ✅ unassignedParagraphCount가 없을 경우 안전하게 처리
              (structureAnalysis as any).unassignedParagraphCount ??
                '알 수 없음'
            }
            개 | 빈 컨테이너: {structureAnalysis.emptyContainerCount}개
          </div>
        )}
      </div>

      {/* 📄 컨테이너 목록 */}
      <div className="flex-1 overflow-hidden">
        <ScrollShadow
          className="h-full px-4 py-2"
          hideScrollBar={validIsMobile}
        >
          <div className="pb-4 space-y-4">
            {validSortedContainers.map((container) => {
              // 각 컨테이너별 단락 조회
              let containerParagraphs: LocalParagraph[] = [];
              try {
                const paragraphs = getLocalParagraphsByContainer(container.id);
                containerParagraphs = Array.isArray(paragraphs)
                  ? paragraphs
                  : [];
              } catch (error) {
                console.error('❌ [CONTAINER_MANAGER] 단락 조회 실패:', {
                  containerId: container.id,
                  error,
                });
                containerParagraphs = [];
              }

              return (
                <ContainerCard
                  key={container.id}
                  container={container} // ✅ 타입 안전성이 확보된 컨테이너 (updatedAt 포함)
                  containerParagraphs={containerParagraphs}
                  moveLocalParagraphInContainer={moveLocalParagraphInContainer}
                  activateEditor={activateEditor}
                  sortedContainers={validSortedContainers} // ✅ 타입 안전성이 확보된 배열
                  moveToContainer={moveToContainer} // 🔄 새로 추가된 함수 전달
                />
              );
            })}
          </div>
        </ScrollShadow>
      </div>

      {/* 🔍 하단 상태 정보 */}
      <div className="flex-shrink-0 px-4 py-2 border-t bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            🔄 단락을 다른 컨테이너로 이동하려면 셀렉트 박스를 사용하세요
          </span>
          <div className="flex items-center gap-2">
            {structureIssues && structureIssues.length > 0 ? (
              <span className="px-2 py-1 text-orange-600 bg-orange-100 rounded">
                ⚠️ {structureIssues.length}개 이슈
              </span>
            ) : (
              <span className="px-2 py-1 text-green-600 bg-green-100 rounded">
                ✅ 구조 양호
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ContainerManager);

/**
 * 🔧 ContainerManager 타입 에러 수정 사항:
 *
 * 1. ✅ Container updatedAt 속성 지원
 *    - ensureContainerSafety 함수에서 updatedAt 안전 처리
 *    - fallback 컨테이너 생성 시 updatedAt 포함
 *    - commonTypes.ts의 Container 인터페이스 변경사항 반영
 *
 * 2. ✅ unassignedParagraphCount 안전 처리
 *    - StructureAnalysis 타입에 해당 속성이 없을 경우 대비
 *    - ?? 연산자로 안전한 fallback 값 제공
 *    - 타입 단언으로 임시 호환성 확보
 *
 * 3. 🔄 moveToContainer 함수 완전 통합
 *    - ContainerManagerProps 인터페이스에 포함
 *    - 함수 검증 및 전달 로직 유지
 *    - 의존성 배열에 포함하여 리렌더링 최적화
 *
 * 4. 🛡️ 타입 안전성 강화
 *    - 모든 Container 객체에 updatedAt 보장
 *    - 런타임 에러 방지를 위한 fallback 처리
 *    - 안전한 타입 캐스팅 적용
 */
