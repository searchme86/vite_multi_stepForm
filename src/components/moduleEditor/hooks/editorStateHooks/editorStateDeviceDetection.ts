import { useEffect } from 'react';

// ✨ [디바이스 감지 훅] 모바일 기기 감지 effect 함수
// 1. 화면 크기에 따라 모바일/데스크톱 판별 2. 반응형 UI 제공
const useDeviceDetection = (
  setIsOnMobileDevice: React.Dispatch<React.SetStateAction<boolean>>
) => {
  useEffect(() => {
    console.log('🎛️ [HOOK] 모바일 감지 이벤트 리스너 설정');

    const checkMobileDevice = () => {
      const { innerWidth: currentWindowWidth } = window; // 1. 현재 브라우저 창 너비 측정 2. 반응형 기준점 확인
      const isMobileScreen = currentWindowWidth < 768; // 1. 768px 미만을 모바일로 판단 2. 일반적인 태블릿/모바일 기준점
      console.log('📱 [MOBILE] 화면 크기 체크:', {
        width: currentWindowWidth,
        isMobile: isMobileScreen,
      });
      setIsOnMobileDevice(isMobileScreen); // 1. 모바일 상태 업데이트 2. 컴포넌트 리렌더링 트리거
    };

    checkMobileDevice(); // 1. 초기 화면 크기 체크 2. 컴포넌트 마운트 시 즉시 판별
    window.addEventListener('resize', checkMobileDevice); // 1. 화면 크기 변경 감지 2. 실시간 반응형 대응

    return () => {
      console.log('🎛️ [HOOK] 모바일 감지 이벤트 리스너 제거');
      window.removeEventListener('resize', checkMobileDevice); // 1. 메모리 누수 방지 2. 이벤트 리스너 정리
    };
  }, [setIsOnMobileDevice]); // 1. setIsOnMobileDevice 함수가 변경될 때만 재설정 2. 불필요한 재실행 방지
};

//====여기부터 수정됨====
// 디바이스 감지 훅을 export - useEditorStateMain.ts에서 import할 수 있도록
export { useDeviceDetection };
//====여기까지 수정됨====
