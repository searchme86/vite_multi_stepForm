// 📁 components/moduleEditor/parts/WritingStep/sidebar/slides/StructureManagementSlide.tsx

import { FolderOpen, Settings } from 'lucide-react';
import { Icon } from '@iconify/react';
import ContainerManager from '../../container/ContainerManager';
import useStructureAnalysis from '../../../../hooks/useStructureAnalysis';
import { StructureManagementSlideProps } from '../../../../../swipeableSection/types/swipeableTypes';
import type { Container } from '../../../../../../store/shared/commonTypes';

// 🏗️ LocalParagraph 인터페이스 정의 (WritingStep.tsx와 완전 일치)
interface LocalParagraph {
  id: string;
  content: string;
  containerId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  originalId?: string;
}

// ✅ ExtendedContainerManagerProps - WritingStep.tsx와 완전 동일한 정의
interface ExtendedContainerManagerProps {
  isMobile: boolean;
  sortedContainers: Container[]; // ✅ commonTypes Container 사용
  getLocalParagraphsByContainer: (containerId: string) => LocalParagraph[];
  moveLocalParagraphInContainer: (id: string, direction: 'up' | 'down') => void;
  activateEditor: (id: string) => void;
  moveToContainer: (paragraphId: string, targetContainerId: string) => void; // ✅ 필수 함수
}

// ✅ StructureManagementSlideProps 타입 확장
interface ExtendedStructureManagementSlideProps {
  containerManagerProps: ExtendedContainerManagerProps; // ✅ 확장된 타입 사용
}

/**
 * StructureManagementSlide 컴포넌트
 * - 에디터 사이드바의 구조관리 슬라이드
 * - useStructureAnalysis 훅을 사용하여 구조 분석 수행
 * - 헤더에 에러/경고 정보 표시
 * - ContainerManager에 분석 결과 전달
 * - 슬라이드에 최적화된 레이아웃 제공
 * - 구체적 타입을 사용하여 타입 안전성 확보
 * - 🔄 컨테이너 간 이동 기능 지원 추가
 */
export function StructureManagementSlide({
  containerManagerProps, // 필수 props - 옵셔널 제거됨
}: ExtendedStructureManagementSlideProps) {
  // ✅ 확장된 타입 사용
  // 🔍 Props 검증 및 안전한 기본값 설정
  const validContainerManagerProps: ExtendedContainerManagerProps =
    containerManagerProps || {
      isMobile: false,
      sortedContainers: [],
      getLocalParagraphsByContainer: () => [],
      moveLocalParagraphInContainer: () => {},
      activateEditor: () => {},
      moveToContainer: () => {}, // ✅ 기본 fallback 함수
    };

  console.log('📁 [STRUCTURE_SLIDE] 렌더링:', {
    propsProvided: !!containerManagerProps,
    isMobile: validContainerManagerProps.isMobile,
    containersCount: validContainerManagerProps.sortedContainers.length,
    hasGetParagraphsFunction:
      typeof validContainerManagerProps.getLocalParagraphsByContainer ===
      'function',
    hasMoveInContainerFunction:
      typeof validContainerManagerProps.moveLocalParagraphInContainer ===
      'function',
    hasActivateEditorFunction:
      typeof validContainerManagerProps.activateEditor === 'function',
    // ✅ 새로 추가된 함수 확인 (타입 에러 해결)
    hasMoveToContainerFunction:
      typeof validContainerManagerProps.moveToContainer === 'function',
    timestamp: new Date().toISOString(),
  });

  // 🔍 구조 분석 훅 사용
  const { structureAnalysis, structureIssues, errorIssues, warningIssues } =
    useStructureAnalysis(
      validContainerManagerProps.sortedContainers,
      validContainerManagerProps.getLocalParagraphsByContainer
    );

  console.log('📊 [STRUCTURE_SLIDE] 구조 분석 결과:', {
    totalContainers: structureAnalysis.totalContainers,
    totalParagraphs: structureAnalysis.totalAssignedParagraphs,
    emptyContainers: structureAnalysis.emptyContainerCount,
    totalIssues: structureIssues.length,
    errors: errorIssues.length,
    warnings: warningIssues.length,
  });

  // 🛡️ moveToContainer 함수 존재 여부 확인
  const moveToContainerAvailable =
    typeof validContainerManagerProps.moveToContainer === 'function';

  if (!moveToContainerAvailable) {
    console.warn('⚠️ [STRUCTURE_SLIDE] moveToContainer 함수가 제공되지 않음');
  }

  return (
    <div className="flex flex-col w-full h-full bg-white">
      {/* 📋 헤더 섹션 */}
      <div className="flex-shrink-0 p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          {/* 🗂️ 아이콘 */}
          <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-lg shadow-sm">
            <FolderOpen className="w-4 h-4 text-white" />
          </div>

          {/* 📝 제목과 설명 */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">구조관리</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              컨테이너를 관리하고 단락을 구조화하세요
            </p>
            {/* 🔄 새로운 기능 설명 추가 */}
            {moveToContainerAvailable ? (
              <p className="mt-1 text-xs text-blue-600">
                💡 단락을 다른 컨테이너로 이동할 수 있습니다
              </p>
            ) : (
              <p className="mt-1 text-xs text-orange-600">
                ⚠️ 이동 기능이 비활성화되어 있습니다
              </p>
            )}
          </div>

          {/* ⚙️ 설정 아이콘 (향후 확장용) */}
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors duration-200 rounded-lg hover:text-gray-600 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="구조관리 설정"
            title="구조관리 설정"
            onClick={() => {
              console.log('⚙️ [STRUCTURE_SLIDE] 설정 버튼 클릭');
            }}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* 📊 동적 통계 정보 */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            컨테이너: {validContainerManagerProps.sortedContainers.length}개
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            단락: {structureAnalysis.totalAssignedParagraphs}개
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            {validContainerManagerProps.isMobile
              ? '모바일 모드'
              : '데스크톱 모드'}
          </span>
          {/* 🔄 새로운 기능 상태 표시 */}
          <span className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${
                moveToContainerAvailable ? 'bg-purple-400' : 'bg-gray-400'
              }`}
            ></div>
            이동 기능: {moveToContainerAvailable ? '활성' : '비활성'}
          </span>
        </div>

        {/* 🚨 구조 이슈 표시 영역 */}
        {structureIssues.length > 0 && (
          <div className="p-3 mt-3 border rounded-lg bg-white/60 border-white/50">
            {/* ❌ 오류 목록 */}
            {errorIssues.length > 0 && (
              <div className="mb-2">
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
              <div
                className={
                  errorIssues.length > 0 ? 'border-t border-gray-200 pt-2' : ''
                }
              >
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

        {/* ✅ 이슈가 없을 때 성공 메시지 */}
        {structureIssues.length === 0 &&
          structureAnalysis.totalAssignedParagraphs > 0 && (
            <div className="p-2 mt-3 border border-green-200 rounded-lg bg-green-50">
              <div className="flex items-center gap-2 text-xs text-green-700">
                <Icon
                  icon="lucide:check-circle"
                  className="flex-shrink-0 text-green-500"
                />
                <span>구조가 양호합니다</span>
              </div>
            </div>
          )}
      </div>

      {/* 📄 콘텐츠 섹션 */}
      <div className="flex-1 overflow-hidden">
        {/*
          ✅ ContainerManager 컴포넌트에 props 전달 (타입 에러 해결)
          - 타입 안전한 props 전달
          - 구조 분석 결과 포함
          - 컨테이너 목록 표시
          - 단락 관리 기능
          - 구조 변경 기능
          - 🔄 컨테이너 간 이동 기능 props 포함
        */}
        <ContainerManager
          isMobile={validContainerManagerProps.isMobile}
          sortedContainers={validContainerManagerProps.sortedContainers} // ✅ 타입 호환성 확보
          getLocalParagraphsByContainer={
            validContainerManagerProps.getLocalParagraphsByContainer
          }
          moveLocalParagraphInContainer={
            validContainerManagerProps.moveLocalParagraphInContainer
          }
          activateEditor={validContainerManagerProps.activateEditor}
          moveToContainer={validContainerManagerProps.moveToContainer} // ✅ 타입 에러 해결
          structureAnalysis={structureAnalysis}
          structureIssues={structureIssues}
        />
      </div>

      {/* 🔍 하단 상태바 */}
      <div className="flex-shrink-0 px-4 py-2 border-t bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          {moveToContainerAvailable ? (
            <span>🔄 셀렉트 박스로 단락을 다른 컨테이너로 이동하세요</span>
          ) : (
            <span>⚠️ 컨테이너 이동 기능이 비활성화되어 있습니다</span>
          )}
          <div className="flex items-center gap-2">
            {structureIssues.length > 0 ? (
              <>
                <span className="text-orange-500">⚠️ 개선 필요</span>
                <span className="px-2 py-1 text-xs text-orange-600 bg-orange-100 rounded">
                  {structureIssues.length}개 이슈
                </span>
              </>
            ) : (
              <>
                <span className="text-blue-500">💡 팁</span>
                <span className="px-2 py-1 text-xs text-blue-600 bg-blue-100 rounded">
                  {validContainerManagerProps.sortedContainers.length}개
                  컨테이너
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 🔧 StructureManagementSlide 타입 일관성 수정 사항:
 *
 * 1. ✅ ExtendedContainerManagerProps 정의 통일
 *    - WritingStep.tsx와 완전 동일한 인터페이스 정의
 *    - commonTypes Container 타입 사용으로 일관성 확보
 *    - LocalParagraph 인터페이스도 WritingStep.tsx와 동일
 *
 * 2. ✅ 타입 호환성 완전 확보
 *    - Container[] 타입이 이제 완전히 일치
 *    - createdAt, updatedAt 속성 필수로 통일
 *    - TS2719 에러 근본 해결
 *
 * 3. 🔄 기존 기능 완전 보존
 *    - 모든 기존 로직 그대로 유지
 *    - Props 전달 방식 동일
 *    - 사용자 경험 변화 없음
 *
 * 4. 🛡️ 런타임 안전성 확보
 *    - validContainerManagerProps 타입 명시
 *    - fallback 함수 타입 일치
 *    - 에러 방지 로직 유지
 *
 * 5. 📝 향후 개선 방향
 *    - 공통 타입 파일로 ExtendedContainerManagerProps 분리 고려
 *    - 타입 중복 정의 해결을 위한 리팩토링 권장
 *    - 타입 일관성 유지를 위한 지속적 관리
 */
