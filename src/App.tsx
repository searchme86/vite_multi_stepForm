import { useEffect } from 'react';
import { cleanupPreviewPanelStorage } from './components/previewPanel/utils/localStorageCleanup';
import MultiStepFormContainer from './components/multiStepForm/MultiStepFormContainer';

export default function App() {
  // 앱 시작 시 localStorage 정리 작업 수행
  // 잘못된 값들("undefined", 파싱 불가능한 값 등)을 제거하여 JSON.parse 에러 방지
  useEffect(() => {
    console.log('🚀 앱 초기화: localStorage 정리 작업 시작');

    try {
      // 미리보기 패널 관련 localStorage 정리
      // "undefined" 문자열, null, 빈 문자열, 파싱 불가능한 값들을 자동 제거
      cleanupPreviewPanelStorage();

      console.log('✅ 앱 초기화: localStorage 정리 작업 완료');
    } catch (error) {
      // 정리 작업 실패해도 앱은 정상 작동하도록 에러를 잡아서 처리
      console.warn('⚠️ 앱 초기화 중 localStorage 정리 실패:', error);

      // 정리 실패 시 수동으로 문제가 될 수 있는 키들 제거 시도
      try {
        const problematicKeys = [
          'preview-panel-mobile',
          'preview-panel-desktop',
        ];
        problematicKeys.forEach((key) => {
          const value = localStorage.getItem(key);
          if (value === 'undefined' || value === 'null' || value === '') {
            localStorage.removeItem(key);
            console.log(`🧹 수동 정리 완료: ${key}`);
          }
        });
      } catch (manualCleanupError) {
        console.warn('수동 정리도 실패:', manualCleanupError);
        // 최후의 수단으로 localStorage 전체 접근이 불가능한 경우를 대비
        // 이 경우에도 앱은 정상 작동해야 함
      }
    }
  }, []); // 빈 의존성 배열로 앱 시작 시 한 번만 실행

  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="text-default-600 text-medium" id="sandbox-message">
        <MultiStepFormContainer />
      </div>
    </div>
  );
}

// 📋 추가된 기능:
// 1. 앱 시작 시 localStorage 자동 정리
// 2. "undefined" 문자열 등 문제가 되는 값들 제거
// 3. 에러 발생 시에도 앱이 정상 작동하도록 보장
// 4. 정리 과정을 콘솔에 로깅하여 디버깅 용이

// 🛡️ 안전장치:
// - try-catch로 정리 작업 실패해도 앱 크래시 방지
// - 수동 정리 로직으로 2차 안전망 제공
// - localStorage 접근 불가능한 환경에서도 정상 작동
