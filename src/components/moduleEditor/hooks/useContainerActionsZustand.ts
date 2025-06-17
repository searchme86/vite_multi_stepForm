// 📁 hooks/useContainerActions.ts

import { useCallback, useMemo } from 'react';
import { LocalParagraph } from '../types/paragraph';
import { Container } from '../types/container';
import {
  getLocalUnassignedParagraphs,
  getLocalParagraphsByContainer,
  createContainer,
  createContainersFromInputs,
  sortContainersByOrder,
  getContainerParagraphStats,
  getTotalAssignedParagraphs,
  getTotalParagraphsWithContent,
} from '../actions/containerActions';

//====여기부터 수정됨====
// Zustand 상태관리 스토어 import
// Context 방식에서 Zustand로 마이그레이션하기 위해 추가
// Zustand는 전역 상태관리를 더 간단하고 효율적으로 처리할 수 있음
import { useEditorCoreStore } from '../../../store/editorCore/editorCoreStore';
//====여기까지 수정됨====

// 커스텀 훅의 매개변수 타입 정의
// LocalParagraph: 개별 문단 데이터 구조
// Container: 문단들을 그룹화하는 컨테이너 구조
interface UseContainerActionsProps {
  localParagraphs: LocalParagraph[]; // 문단 배열 - 기본값: 빈 배열로 fallback
  localContainers: Container[]; // 컨테이너 배열 - 기본값: 빈 배열로 fallback
}

//====여기부터 수정됨====
// 함수 시그니처를 optional parameter로 변경
// 기존 코드 호환성 유지 + 새로운 Zustand 방식 지원
// 마치 이중 언어를 구사하는 번역기처럼 두 방식 모두 이해할 수 있음
export const useContainerActions = (props?: UseContainerActionsProps) => {
  // Zustand store에서 전역 상태 데이터 가져오기
  // state => state.containers: 스토어의 containers 배열을 선택적으로 구독
  // 마치 라디오에서 특정 주파수만 수신하는 것과 같은 원리
  const storeContainers = useEditorCoreStore((state) => state.containers) || []; // fallback: 빈 배열
  const storeParagraphs = useEditorCoreStore((state) => state.paragraphs) || []; // fallback: 빈 배열

  // Null 병합 연산자(??)를 사용한 데이터 소스 결정 로직
  // props가 있으면 props 사용, 없으면 zustand store 사용
  // 마치 1차 전원이 끊어지면 자동으로 보조 전원으로 전환되는 UPS처럼 작동
  const localParagraphs = props?.localParagraphs ?? storeParagraphs;
  const localContainers = props?.localContainers ?? storeContainers;

  // 데이터 유효성 검증 및 fallback 처리
  // 혹시 모를 undefined/null 상황에 대비한 방어적 프로그래밍
  const safeParagraphs = Array.isArray(localParagraphs) ? localParagraphs : [];
  const safeContainers = Array.isArray(localContainers) ? localContainers : [];
  //====여기까지 수정됨====

  // 초기화 로깅 - 디버깅과 모니터링을 위한 로그
  // 마치 비행기 블랙박스처럼 상태를 기록
  console.log('🏗️ [HOOK] useContainerActions 초기화:', {
    paragraphCount: safeParagraphs.length,
    containerCount: safeContainers.length,
    dataSource: props ? 'props' : 'zustand', // 어떤 데이터 소스를 사용했는지 추적
  });

  // 할당되지 않은 문단들을 가져오는 메모이제이션된 콜백 함수
  // useCallback: 함수 재생성을 방지하여 성능 최적화
  // 의존성 배열에 safeParagraphs가 변경될 때만 함수 재생성
  const handleGetLocalUnassignedParagraphs = useCallback(() => {
    console.log('🏗️ [HOOK] handleGetLocalUnassignedParagraphs 호출');
    try {
      // 에러 방지를 위한 try-catch 블록
      return getLocalUnassignedParagraphs(safeParagraphs);
    } catch (error) {
      console.error('❌ [HOOK] 할당되지 않은 문단 조회 실패:', error);
      return []; // fallback: 빈 배열 반환
    }
  }, [safeParagraphs]);

  // 특정 컨테이너에 속한 문단들을 가져오는 콜백 함수
  // containerId: 조회할 컨테이너의 고유 식별자
  const handleGetLocalParagraphsByContainer = useCallback(
    (containerId: string) => {
      console.log(
        '🏗️ [HOOK] handleGetLocalParagraphsByContainer 호출:',
        containerId
      );
      try {
        // containerId 유효성 검증
        if (!containerId || typeof containerId !== 'string') {
          console.warn('⚠️ [HOOK] 유효하지 않은 containerId:', containerId);
          return []; // fallback: 빈 배열 반환
        }
        return getLocalParagraphsByContainer(containerId, safeParagraphs);
      } catch (error) {
        console.error('❌ [HOOK] 컨테이너별 문단 조회 실패:', error);
        return []; // fallback: 빈 배열 반환
      }
    },
    [safeParagraphs]
  );

  // 새로운 컨테이너 생성 함수
  // name: 컨테이너 이름, index: 정렬 순서
  const handleCreateContainer = useCallback((name: string, index: number) => {
    console.log('🏗️ [HOOK] handleCreateContainer 호출:', { name, index });
    try {
      // 매개변수 유효성 검증
      if (!name || typeof name !== 'string') {
        console.warn('⚠️ [HOOK] 유효하지 않은 컨테이너 이름:', name);
        return null; // fallback: null 반환
      }
      if (typeof index !== 'number' || index < 0) {
        console.warn('⚠️ [HOOK] 유효하지 않은 인덱스:', index);
        return null; // fallback: null 반환
      }
      return createContainer(name, index);
    } catch (error) {
      console.error('❌ [HOOK] 컨테이너 생성 실패:', error);
      return null; // fallback: null 반환
    }
  }, []);

  // 여러 입력값에서 컨테이너들을 일괄 생성하는 함수
  // validInputs: 유효한 입력값들의 배열
  const handleCreateContainersFromInputs = useCallback(
    (validInputs: string[]) => {
      console.log('🏗️ [HOOK] handleCreateContainersFromInputs 호출:', {
        inputCount: validInputs?.length || 0,
      });
      try {
        // 입력값 유효성 검증
        if (!Array.isArray(validInputs)) {
          console.warn('⚠️ [HOOK] validInputs가 배열이 아님:', validInputs);
          return []; // fallback: 빈 배열 반환
        }
        // 빈 문자열이나 유효하지 않은 값들 필터링
        const safeInputs = validInputs.filter(
          (input) =>
            input && typeof input === 'string' && input.trim().length > 0
        );
        return createContainersFromInputs(safeInputs);
      } catch (error) {
        console.error('❌ [HOOK] 컨테이너 일괄 생성 실패:', error);
        return []; // fallback: 빈 배열 반환
      }
    },
    []
  );

  // 컨테이너들을 order 속성에 따라 정렬하는 함수
  // containers: 정렬할 컨테이너 배열
  const handleSortContainersByOrder = useCallback((containers: Container[]) => {
    console.log('🏗️ [HOOK] handleSortContainersByOrder 호출:', {
      containerCount: containers?.length || 0,
    });
    try {
      // 입력값 유효성 검증
      if (!Array.isArray(containers)) {
        console.warn('⚠️ [HOOK] containers가 배열이 아님:', containers);
        return []; // fallback: 빈 배열 반환
      }
      return sortContainersByOrder(containers);
    } catch (error) {
      console.error('❌ [HOOK] 컨테이너 정렬 실패:', error);
      return containers || []; // fallback: 원본 배열 또는 빈 배열 반환
    }
  }, []);

  // 정렬된 컨테이너들 - useMemo로 메모이제이션
  // localContainers가 변경될 때만 재계산
  // 마치 캐시처럼 작동하여 불필요한 재계산 방지
  const sortedContainers = useMemo(() => {
    console.log('🏗️ [HOOK] sortedContainers 메모이제이션 계산');
    try {
      return sortContainersByOrder(safeContainers);
    } catch (error) {
      console.error('❌ [HOOK] 정렬된 컨테이너 계산 실패:', error);
      return safeContainers; // fallback: 원본 배열 반환
    }
  }, [safeContainers]);

  // 할당되지 않은 문단들 - useMemo로 메모이제이션
  // safeParagraphs가 변경될 때만 재계산
  const unassignedParagraphs = useMemo(() => {
    console.log('🏗️ [HOOK] unassignedParagraphs 메모이제이션 계산');
    try {
      return getLocalUnassignedParagraphs(safeParagraphs);
    } catch (error) {
      console.error('❌ [HOOK] 할당되지 않은 문단 계산 실패:', error);
      return []; // fallback: 빈 배열 반환
    }
  }, [safeParagraphs]);

  // 컨테이너별 문단 통계 - useMemo로 메모이제이션
  // 컨테이너와 문단 데이터가 변경될 때만 재계산
  const containerStats = useMemo(() => {
    console.log('🏗️ [HOOK] containerStats 메모이제이션 계산');
    try {
      return getContainerParagraphStats(safeContainers, safeParagraphs);
    } catch (error) {
      console.error('❌ [HOOK] 컨테이너 통계 계산 실패:', error);
      return {}; // fallback: 빈 객체 반환
    }
  }, [safeContainers, safeParagraphs]);

  // 할당된 전체 문단 수 - useMemo로 메모이제이션
  const totalAssignedParagraphs = useMemo(() => {
    console.log('🏗️ [HOOK] totalAssignedParagraphs 메모이제이션 계산');
    try {
      return getTotalAssignedParagraphs(safeParagraphs);
    } catch (error) {
      console.error('❌ [HOOK] 할당된 문단 수 계산 실패:', error);
      return 0; // fallback: 0 반환
    }
  }, [safeParagraphs]);

  // 내용이 있는 전체 문단 수 - useMemo로 메모이제이션
  const totalParagraphsWithContent = useMemo(() => {
    console.log('🏗️ [HOOK] totalParagraphsWithContent 메모이제이션 계산');
    try {
      return getTotalParagraphsWithContent(safeParagraphs);
    } catch (error) {
      console.error('❌ [HOOK] 내용이 있는 문단 수 계산 실패:', error);
      return 0; // fallback: 0 반환
    }
  }, [safeParagraphs]);

  // 컨테이너별 문단 조회 함수 (handleGetLocalParagraphsByContainer와 동일한 기능)
  // 코드 일관성을 위해 별도 제공
  const getParagraphsByContainer = useCallback(
    (containerId: string) => {
      console.log('🏗️ [HOOK] getParagraphsByContainer 호출:', containerId);
      try {
        // containerId 유효성 검증
        if (!containerId || typeof containerId !== 'string') {
          console.warn('⚠️ [HOOK] 유효하지 않은 containerId:', containerId);
          return []; // fallback: 빈 배열 반환
        }
        return getLocalParagraphsByContainer(containerId, safeParagraphs);
      } catch (error) {
        console.error('❌ [HOOK] 컨테이너별 문단 조회 실패:', error);
        return []; // fallback: 빈 배열 반환
      }
    },
    [safeParagraphs]
  );

  // 최종 준비 완료 로깅
  // 모든 계산이 완료된 후 상태 확인
  console.log('✅ [HOOK] useContainerActions 훅 준비 완료:', {
    sortedContainerCount: sortedContainers?.length || 0,
    unassignedParagraphCount: unassignedParagraphs?.length || 0,
    totalAssigned: totalAssignedParagraphs || 0,
    totalWithContent: totalParagraphsWithContent || 0,
    dataSource: props ? 'props' : 'zustand',
  });

  // 훅에서 제공하는 모든 기능들을 객체로 반환
  // 마치 도구상자에서 필요한 도구들을 꺼내 쓸 수 있도록 제공
  return {
    // 액션 함수들 (데이터 조작)
    handleGetLocalUnassignedParagraphs, // 할당되지 않은 문단 조회
    handleGetLocalParagraphsByContainer, // 컨테이너별 문단 조회
    handleCreateContainer, // 단일 컨테이너 생성
    handleCreateContainersFromInputs, // 다중 컨테이너 생성
    handleSortContainersByOrder, // 컨테이너 정렬
    getParagraphsByContainer, // 컨테이너별 문단 조회 (별칭)

    // 계산된 데이터들 (읽기 전용)
    sortedContainers, // 정렬된 컨테이너 배열
    unassignedParagraphs, // 할당되지 않은 문단 배열
    containerStats, // 컨테이너별 통계 정보
    totalAssignedParagraphs, // 할당된 총 문단 수
    totalParagraphsWithContent, // 내용이 있는 총 문단 수
  };
};
