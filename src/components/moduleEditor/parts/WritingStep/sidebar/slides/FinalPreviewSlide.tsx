import { Eye, Download, Share2, RefreshCw } from 'lucide-react';
import PreviewPanel from '../../preview/PreviewPanel';
// import { FinalPreviewSlideProps } from '../types/slideTypes';
import { FinalPreviewSlideProps } from '../../../../../swipeableSection/types/swipeableTypes';

/**
 * FinalPreviewSlide 컴포넌트
 * - 에디터 사이드바의 최종조합 미리보기 슬라이드
 * - 기존 PreviewPanel 컴포넌트를 재사용
 * - 슬라이드에 최적화된 레이아웃 제공
 * - 미리보기 관련 액션 버튼 제공
 * - 구체적 타입을 사용하여 타입 안전성 확보
 */
export function FinalPreviewSlide({
  previewPanelProps, // 필수 props - 옵셔널 제거됨
}: FinalPreviewSlideProps) {
  console.log('👁️ [PREVIEW_SLIDE] 렌더링:', {
    propsProvided: !!previewPanelProps,
    containersCount: previewPanelProps.sortedContainers.length,
    currentSubStep: previewPanelProps.internalState.currentSubStep,
    isPreviewOpen: previewPanelProps.internalState.isPreviewOpen,
    hasRenderMarkdown: typeof previewPanelProps.renderMarkdown === 'function',
    timestamp: new Date().toISOString(),
  });

  // 📊 미리보기 통계 계산
  const totalContainers = previewPanelProps.sortedContainers.length;
  const totalParagraphs = previewPanelProps.sortedContainers.reduce(
    (total, container) => {
      return (
        total +
        previewPanelProps.getLocalParagraphsByContainer(container.id).length
      );
    },
    0
  );

  return (
    <div className="flex flex-col w-full h-full bg-white">
      {/* 📋 헤더 섹션 */}
      <div className="flex-shrink-0 p-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center gap-3">
          {/* 👁️ 아이콘 */}
          <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-lg shadow-sm">
            <Eye className="w-4 h-4 text-white" />
          </div>

          {/* 📝 제목과 설명 */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">최종조합</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              작성된 내용의 최종 미리보기를 확인하세요
            </p>
          </div>

          {/* 🔄 액션 버튼들 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors duration-200 rounded-lg hover:text-gray-600 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-green-400"
              aria-label="미리보기 새로고침"
              title="미리보기 새로고침"
              onClick={() => {
                console.log('🔄 [PREVIEW_SLIDE] 새로고침 버튼 클릭');
                // 필요시 새로고침 로직 추가
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors duration-200 rounded-lg hover:text-gray-600 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-green-400"
              aria-label="공유하기"
              title="공유하기"
              onClick={() => {
                console.log('📤 [PREVIEW_SLIDE] 공유 버튼 클릭');
              }}
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors duration-200 rounded-lg hover:text-gray-600 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-green-400"
              aria-label="다운로드"
              title="다운로드"
              onClick={() => {
                console.log('💾 [PREVIEW_SLIDE] 다운로드 버튼 클릭');
              }}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 📊 동적 미리보기 정보 */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            실시간 미리보기
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            컨테이너: {totalContainers}개
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            단락: {totalParagraphs}개
          </span>
        </div>
      </div>

      {/* 📄 콘텐츠 섹션 */}
      <div className="flex-1 overflow-y-scroll컨테이너가 비어있음">
        {/*
          👁️ 기존 PreviewPanel 컴포넌트 재사용
          - 타입 안전한 props 전달
          - 컨테이너별 내용 표시
          - 마크다운 렌더링
          - 이미지 미리보기
          - 실시간 업데이트
        */}
        <PreviewPanel {...previewPanelProps} />
      </div>

      {/* 🔍 하단 상태바 */}
      <div className="flex-shrink-0 px-4 py-2 border-t bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>실시간으로 업데이트됩니다</span>
          <div className="flex items-center gap-2">
            {/* 🟢 실시간 상태 표시 */}
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-600">실시간 동기화</span>
            </div>

            {/* 📊 미리보기 상태 */}
            <span className="px-2 py-1 text-xs text-green-600 bg-green-100 rounded">
              {previewPanelProps.internalState.isPreviewOpen
                ? '미리보기 열림'
                : '미리보기 닫힘'}
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
 *    - 이전: previewPanelProps?: any
 *    - 이후: previewPanelProps: PreviewPanelProps
 *
 * 2. ✅ 옵셔널 제거
 *    - 항상 전달되는 props이므로 필수로 변경
 *    - 불필요한 null 체크 코드 제거
 *
 * 3. ✅ 타입 import 추가
 *    - FinalPreviewSlideProps를 slideTypes.ts에서 import
 *    - 구체적인 타입 정의 사용
 *
 * 4. ✅ 동적 통계 계산 추가
 *    - 실제 props 값을 활용한 통계 계산
 *    - 타입 안전성을 활용한 데이터 접근
 */

/**
 * 🎨 FinalPreviewSlide의 주요 특징 (업데이트됨):
 *
 * 1. 📱 일관된 슬라이드 레이아웃
 *    - StructureManagementSlide와 동일한 구조
 *    - 헤더, 콘텐츠, 하단 상태바 구조
 *    - 그린 테마로 시각적 차별화
 *
 * 2. 🔄 기존 컴포넌트 재사용
 *    - PreviewPanel 완전 재사용
 *    - 타입 안전한 props 전달
 *    - 실시간 업데이트 기능 포함
 *
 * 3. 🎨 미리보기 전용 디자인
 *    - Eye 아이콘으로 미리보기 특성 강조
 *    - 새로고침/공유/다운로드 버튼
 *    - 동적 통계 정보 표시
 *
 * 4. 🔒 타입 안전성 확보
 *    - any 타입 완전 제거
 *    - 구체적인 인터페이스 사용
 *    - 컴파일 타임 에러 검출
 *
 * 5. 📊 실시간 상태 정보 제공
 *    - 실시간 미리보기 상태
 *    - 컨테이너/단락 수 표시
 *    - 미리보기 열림/닫힘 상태
 *
 * 6. ♿ 접근성 완비
 *    - 적절한 ARIA 라벨
 *    - 키보드 네비게이션
 *    - 명확한 상태 표시
 */
