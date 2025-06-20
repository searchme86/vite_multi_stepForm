import { FolderOpen, Settings } from 'lucide-react';
import { Icon } from '@iconify/react';
import ContainerManager from '../../container/ContainerManager';
import useStructureAnalysis from '../../../../hooks/useStructureAnalysis';
import { StructureManagementSlideProps } from '../../../../../swipeableSection/types/swipeableTypes';

/**
 * StructureManagementSlide 컴포넌트
 * - 에디터 사이드바의 구조관리 슬라이드
 * - useStructureAnalysis 훅을 사용하여 구조 분석 수행
 * - 헤더에 에러/경고 정보 표시
 * - ContainerManager에 분석 결과 전달
 * - 슬라이드에 최적화된 레이아웃 제공
 * - 구체적 타입을 사용하여 타입 안전성 확보
 */
export function StructureManagementSlide({
  containerManagerProps, // 필수 props - 옵셔널 제거됨
}: StructureManagementSlideProps) {
  console.log('📁 [STRUCTURE_SLIDE] 렌더링:', {
    propsProvided: !!containerManagerProps,
    isMobile: containerManagerProps.isMobile,
    containersCount: containerManagerProps.sortedContainers.length,
    hasGetParagraphsFunction:
      typeof containerManagerProps.getLocalParagraphsByContainer === 'function',
    timestamp: new Date().toISOString(),
  });

  // 🔍 구조 분석 훅 사용
  const { structureAnalysis, structureIssues, errorIssues, warningIssues } =
    useStructureAnalysis(
      containerManagerProps.sortedContainers,
      containerManagerProps.getLocalParagraphsByContainer
    );

  console.log('📊 [STRUCTURE_SLIDE] 구조 분석 결과:', {
    totalContainers: structureAnalysis.totalContainers,
    totalParagraphs: structureAnalysis.totalAssignedParagraphs,
    emptyContainers: structureAnalysis.emptyContainerCount,
    totalIssues: structureIssues.length,
    errors: errorIssues.length,
    warnings: warningIssues.length,
  });

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
            컨테이너: {containerManagerProps.sortedContainers.length}개
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            단락: {structureAnalysis.totalAssignedParagraphs}개
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            {containerManagerProps.isMobile ? '모바일 모드' : '데스크톱 모드'}
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
          🔄 기존 ContainerManager 컴포넌트 재사용
          - 타입 안전한 props 전달
          - 구조 분석 결과 포함
          - 컨테이너 목록 표시
          - 단락 관리 기능
          - 구조 변경 기능
        */}
        <ContainerManager
          {...containerManagerProps}
          structureAnalysis={structureAnalysis}
          structureIssues={structureIssues}
        />
      </div>

      {/* 🔍 하단 상태바 */}
      <div className="flex-shrink-0 px-4 py-2 border-t bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>구조를 드래그하여 정리하세요</span>
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
                  {containerManagerProps.sortedContainers.length}개 컨테이너
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
 * 🔧 useStructureAnalysis 훅 도입 수정 내역:
 *
 * 1. ✅ 훅 import 및 사용
 *    - useStructureAnalysis 훅 import
 *    - 구조 분석 로직 훅으로 이동
 *    - 분석 결과를 상태로 관리
 *
 * 2. ✅ 헤더 영역 이슈 표시
 *    - 주석 영역에 구조 이슈 UI 추가
 *    - 오류/경고 구분하여 표시
 *    - 성공 상태도 표시
 *
 * 3. ✅ 동적 통계 정보 개선
 *    - 실제 단락 수 표시
 *    - 구조 분석 결과 활용
 *    - 시각적 구분 개선
 *
 * 4. ✅ ContainerManager 연동
 *    - 구조 분석 결과를 props로 전달
 *    - 기존 props 완전 유지
 *    - 추가 데이터만 확장
 *
 * 5. ✅ 하단 상태바 개선
 *    - 이슈 개수에 따른 동적 메시지
 *    - 시각적 피드백 향상
 *    - 상태 기반 색상 변경
 */

/**
 * 🎨 StructureManagementSlide의 주요 개선사항:
 *
 * 1. 📊 실시간 구조 분석
 *    - 헤더에 실시간 이슈 표시
 *    - 오류/경고 구분 표시
 *    - 성공 상태 피드백
 *
 * 2. 🔄 관심사 분리 달성
 *    - UI 컴포넌트에서 비즈니스 로직 분리
 *    - 재사용 가능한 훅 활용
 *    - 타입 안전성 확보
 *
 * 3. 🎨 시각적 개선
 *    - 반투명 배경으로 이슈 영역 구분
 *    - 색상 코딩으로 이슈 유형 구분
 *    - 아이콘과 텍스트 조합으로 가독성 향상
 *
 * 4. 📱 반응형 디자인
 *    - 모바일/데스크톱 모드 구분
 *    - 유연한 레이아웃 구조
 *    - 적절한 간격과 크기 조정
 *
 * 5. ♿ 접근성 고려
 *    - 적절한 ARIA 라벨
 *    - 키보드 네비게이션 지원
 *    - 명확한 포커스 표시
 */
