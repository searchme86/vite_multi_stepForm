import { useEffect } from 'react';

// ✨ [디바이스 감지 훅] 원본과 100% 동일한 로직으로 작성

// ✨ [디바이스 감지 훅] 모바일 기기 감지 effect 함수
// 1. 화면 크기에 따라 모바일/데스크톱 판별 2. 반응형 UI 제공
const useDeviceDetection = (
  setIsMobileDeviceDetected: React.Dispatch<React.SetStateAction<boolean>> // 1. 모바일 상태 설정 함수 2. 원본 변수명과 일치
) => {
  useEffect(() => {
    console.log('🎛️ [HOOK] 모바일 감지 이벤트 리스너 설정');

    // 1. 현재 화면 너비를 체크하여 모바일 여부 판단하는 함수
    // 2. resize 이벤트마다 호출되어 화면 크기 변화에 실시간 대응
    const checkMobileDevice = () => {
      try {
        const isMobileScreenSize = window.innerWidth < 768; // 1. 768px 미만을 모바일로 판단 2. 일반적인 태블릿/모바일 기준점
        console.log('📱 [MOBILE] 화면 크기 체크:', {
          width: window.innerWidth,
          isMobile: isMobileScreenSize,
        });
        setIsMobileDeviceDetected(isMobileScreenSize); // 1. 모바일 상태 업데이트 2. 컴포넌트 리렌더링 트리거
      } catch (error) {
        console.error('❌ [MOBILE] 화면 크기 체크 실패:', error);
        // 1. 오류 발생 시 데스크톱으로 가정하여 기본 UI 제공
        // 2. window 객체에 접근할 수 없는 환경에서도 앱이 동작하도록 보장
        setIsMobileDeviceDetected(false);
      }
    };

    // 1. 컴포넌트 마운트 시 즉시 모바일 여부 체크
    // 2. 초기 렌더링에서부터 올바른 모바일/데스크톱 UI 표시
    checkMobileDevice();

    // 1. 화면 크기 변화 감지를 위한 이벤트 리스너 등록
    // 2. 사용자가 브라우저 크기를 조절하거나 디바이스를 회전할 때 반응
    window.addEventListener('resize', checkMobileDevice);

    // 1. 컴포넌트 언마운트 시 이벤트 리스너 정리
    // 2. 메모리 누수 방지를 위한 클린업 함수 반환
    return () => {
      console.log('🎛️ [HOOK] 모바일 감지 이벤트 리스너 제거');
      window.removeEventListener('resize', checkMobileDevice);
    };
  }, [setIsMobileDeviceDetected]); // 1. setIsMobileDeviceDetected 함수가 변경될 때만 재설정 2. 불필요한 재실행 방지
};

// 디바이스 감지 훅을 export
export { useDeviceDetection };
