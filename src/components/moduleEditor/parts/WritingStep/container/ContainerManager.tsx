// 📁 components/moduleEditor/parts/WritingStep/container/ContainerManager.tsx

import React, { useMemo } from 'react';
import { ScrollShadow } from '@heroui/react';
import ContainerCard from './ContainerCard';
import type { Container } from '../../../../../store/shared/commonTypes';
import type {
  StructureAnalysis,
  StructureIssue,
} from '../../../hooks/useStructureAnalysis';

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
  moveToContainer: (paragraphId: string, targetContainerId: string) => void;
  structureAnalysis?: StructureAnalysis;
  structureIssues?: StructureIssue[];
}

function ensureContainerSafety(container: Container): Container {
  const safeCreatedAt =
    container.createdAt instanceof Date ? container.createdAt : new Date();

  const safeUpdatedAt =
    container.updatedAt instanceof Date ? container.updatedAt : new Date();

  return {
    ...container,
    createdAt: safeCreatedAt,
    updatedAt: safeUpdatedAt,
  };
}

function ensureContainerArraySafety(containers: Container[]): Container[] {
  const validContainers = Array.isArray(containers) ? containers : [];

  return validContainers.map((container) => {
    if (!container || typeof container !== 'object') {
      console.warn('⚠️ [CONTAINER_MANAGER] 잘못된 컨테이너 객체:', container);
      return {
        id: `fallback_${Date.now()}`,
        name: '알 수 없는 컨테이너',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return ensureContainerSafety(container);
  });
}

function ContainerManager({
  isMobile,
  sortedContainers,
  getLocalParagraphsByContainer,
  moveLocalParagraphInContainer,
  activateEditor,
  moveToContainer,
  structureAnalysis,
  structureIssues,
}: ContainerManagerProps) {
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
    hasMoveToContainerFunction: typeof moveToContainer === 'function',
    hasStructureAnalysis: !!structureAnalysis,
    structureIssuesCount: Array.isArray(structureIssues)
      ? structureIssues.length
      : 0,
  });

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

  const totalParagraphs = useMemo(() => {
    return Array.from(containerParagraphCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );
  }, [containerParagraphCounts]);

  const hasEmptyContainers = useMemo(() => {
    return Array.from(containerParagraphCounts.values()).some(
      (count) => count === 0
    );
  }, [containerParagraphCounts]);

  const canRenderContainers = useMemo(() => {
    return (
      validSortedContainers.length > 0 &&
      typeof getLocalParagraphsByContainer === 'function' &&
      typeof moveLocalParagraphInContainer === 'function' &&
      typeof activateEditor === 'function' &&
      typeof moveToContainer === 'function'
    );
  }, [
    validSortedContainers.length,
    getLocalParagraphsByContainer,
    moveLocalParagraphInContainer,
    activateEditor,
    moveToContainer,
  ]);

  if (!canRenderContainers) {
    console.error('❌ [CONTAINER_MANAGER] 필수 함수들이 제공되지 않음:', {
      hasGetFunction: typeof getLocalParagraphsByContainer === 'function',
      hasMoveFunction: typeof moveLocalParagraphInContainer === 'function',
      hasActivateFunction: typeof activateEditor === 'function',
      hasMoveToContainerFunction: typeof moveToContainer === 'function',
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
            <span className="px-2 py-1 text-xs text-purple-700 bg-purple-100 rounded">
              ✏️ 편집 기능 활성
            </span>
          </div>

          <div className="text-xs text-gray-400">
            {validIsMobile ? '📱 모바일' : '💻 데스크톱'}
          </div>
        </div>

        {structureAnalysis && (
          <div className="mt-2 text-xs text-gray-500">
            📊 할당: {structureAnalysis.totalAssignedParagraphs}개 | 미할당:{' '}
            {(structureAnalysis as any).unassignedParagraphCount ??
              '알 수 없음'}
            개 | 빈 컨테이너: {structureAnalysis.emptyContainerCount}개
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollShadow
          className="h-full px-4 py-2"
          hideScrollBar={validIsMobile}
        >
          <div className="pb-4 space-y-4">
            {validSortedContainers.map((container) => {
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
                  container={container}
                  containerParagraphs={containerParagraphs}
                  moveLocalParagraphInContainer={moveLocalParagraphInContainer}
                  activateEditor={activateEditor}
                  sortedContainers={validSortedContainers}
                  moveToContainer={moveToContainer}
                />
              );
            })}
          </div>
        </ScrollShadow>
      </div>

      <div className="flex-shrink-0 px-4 py-2 border-t bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>✏️ 단락을 편집하려면 '편집' 버튼을 클릭하세요</span>
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
