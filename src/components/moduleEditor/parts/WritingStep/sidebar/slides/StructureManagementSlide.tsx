import { FolderOpen, Settings } from 'lucide-react';
import ContainerManager from '../../container/ContainerManager';
import { StructureManagementSlideProps } from '../../../../../swipeableSection/types/swipeableTypes';

/**
 * StructureManagementSlide 컴포넌트
 * - 에디터 사이드바의 구조관리 슬라이드
 * - 기존 ContainerManager 컴포넌트를 재사용
 * - 슬라이드에 최적화된 레이아웃 제공
 * - 헤더와 콘텐츠 영역 분리
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
            {containerManagerProps.isMobile ? '모바일 모드' : '데스크톱 모드'}
          </span>
        </div>
      </div>

      {/* 📄 콘텐츠 섹션 */}
      <div className="flex-1 overflow-hidden">
        {/*
          🔄 기존 ContainerManager 컴포넌트 재사용
          - 타입 안전한 props 전달
          - 컨테이너 목록 표시
          - 단락 관리 기능
          - 구조 변경 기능
        */}
        <ContainerManager {...containerManagerProps} />
      </div>

      {/* 🔍 하단 상태바 */}
      <div className="flex-shrink-0 px-4 py-2 border-t bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>구조를 드래그하여 정리하세요</span>
          <div className="flex items-center gap-2">
            <span className="text-blue-500">💡 팁</span>
            <span className="px-2 py-1 text-xs text-blue-600 bg-blue-100 rounded">
              {containerManagerProps.sortedContainers.length}개 컨테이너
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 🔧 타입 누락 에러 수정 내역:
 *
 * 1. ✅ any 타입 제거
 *    - 이전: containerManagerProps?: any
 *    - 이후: containerManagerProps: ContainerManagerProps
 *
 * 2. ✅ 옵셔널 제거
 *    - 항상 전달되는 props이므로 필수로 변경
 *    - 불필요한 null 체크 코드 제거
 *
 * 3. ✅ 타입 import 추가
 *    - StructureManagementSlideProps를 slideTypes.ts에서 import
 *    - 구체적인 타입 정의 사용
 *
 * 4. ✅ 동적 통계 정보 추가
 *    - 실제 props 값을 활용한 통계 표시
 *    - 타입 안전성을 활용한 데이터 접근
 */

/**
 * 🎨 StructureManagementSlide의 주요 특징 (업데이트됨):
 *
 * 1. 📱 슬라이드에 최적화된 레이아웃
 *    - 헤더, 콘텐츠, 하단 고정 구조
 *    - 전체 높이 활용 (h-full)
 *    - 스크롤 영역 명확히 분리
 *
 * 2. 🔄 기존 컴포넌트 재사용
 *    - ContainerManager 완전 재사용
 *    - 타입 안전한 props 전달
 *    - 추가 래핑 레이어 최소화
 *
 * 3. 🎨 시각적 개선
 *    - 그라데이션 헤더 배경
 *    - 동적 통계 정보 표시
 *    - 상태 표시 및 가이드 제공
 *
 * 4. 🔒 타입 안전성 확보
 *    - any 타입 완전 제거
 *    - 구체적인 인터페이스 사용
 *    - 컴파일 타임 에러 검출
 *
 * 5. ♿ 접근성 고려
 *    - 적절한 ARIA 라벨
 *    - 키보드 네비게이션 지원
 *    - 명확한 포커스 표시
 */
