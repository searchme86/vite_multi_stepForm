// 📁 actions/containerActions/containerStats.ts

import { LocalParagraph } from '../../types/paragraph';
import { Container } from '../../types/container';
import { useEditorCoreStore } from '../../../../store/editorCore/editorCoreStore';
import {
  convertFromZustandContainer,
  convertFromZustandParagraph,
} from './containerTypeConverters';
import { getLocalParagraphsByContainer } from './containerQueries';

/**
 * 컨테이너별 단락 통계를 계산하는 함수 (오버로드)
 *
 * 함수의 목적: 각 컨테이너의 단락 개수와 내용이 있는 단락 개수를 집계하여 통계 반환
 * 사용 목적: 각 컨테이너의 단락 개수와 내용이 있는 단락 개수를 집계
 * 비즈니스 의미: 컨테이너별 데이터 현황을 파악하여 사용자에게 통계 정보 제공
 */

// 오버로드 1: 매개변수 없이 호출 시 Zustand에서 데이터 조회 후 통계 계산
export function getContainerParagraphStats(): Record<
  string,
  { count: number; hasContent: number }
>;
// 오버로드 2: 매개변수로 availableContainers와 availableParagraphs를 받아 Context 방식으로 통계 계산
export function getContainerParagraphStats(
  availableContainers: Container[],
  availableParagraphs: LocalParagraph[]
): Record<string, { count: number; hasContent: number }>;
// 실제 구현부: 매개변수 유무에 따라 다른 방식으로 통계 계산
export function getContainerParagraphStats(
  availableContainers?: Container[], // 통계를 계산할 컨테이너 배열
  availableParagraphs?: LocalParagraph[] // 통계를 계산할 단락 배열
): Record<string, { count: number; hasContent: number }> {
  if (availableContainers && availableParagraphs) {
    // ✅ 기존 방식 (context): 매개변수로 받은 데이터로 통계 계산
    console.log('📊 [CONTAINER] 컨테이너별 단락 통계 계산 시작');

    // fallback: 매개변수 유효성 검증
    const safeContainers = Array.isArray(availableContainers)
      ? availableContainers
      : [];
    const safeParagraphs = Array.isArray(availableParagraphs)
      ? availableParagraphs
      : [];

    // 통계 결과를 저장할 객체 초기화
    // Record<string, {...}>: 컨테이너 ID를 키로 하고 통계 객체를 값으로 하는 타입
    const stats: Record<string, { count: number; hasContent: number }> = {};

    // 각 컨테이너별로 반복하여 통계 계산
    // ✨ [개선] 의미있는 변수명 사용: container → currentContainer (현재 처리중인 컨테이너)
    safeContainers.forEach((currentContainer) => {
      // fallback: currentContainer가 null이나 undefined인 경우 건너뛰기
      if (!currentContainer || !currentContainer.id) {
        console.warn(
          '⚠️ [CONTAINER] 유효하지 않은 컨테이너:',
          currentContainer
        );
        return; // 다음 컨테이너로 건너뛰기
      }

      // 해당 컨테이너에 속한 단락들 조회
      const containerParagraphs = getLocalParagraphsByContainer(
        currentContainer.id,
        safeParagraphs
      );

      // 내용이 있는 단락들만 필터링
      // content가 존재하고 공백이 아닌 문자가 포함된 단락만 카운트
      // ✨ [개선] 의미있는 변수명 사용: p → paragraph (단락을 의미함을 명확히)
      const paragraphsWithContent = containerParagraphs.filter((paragraph) => {
        // fallback: paragraph가 null이나 undefined인 경우 처리
        if (!paragraph) return false;
        // content가 문자열이고 trim 후에도 길이가 0보다 큰 경우만 내용 있음으로 판단
        return (
          paragraph.content &&
          typeof paragraph.content === 'string' &&
          paragraph.content.trim().length > 0
        );
      });

      // 컨테이너별 통계 저장
      stats[currentContainer.id] = {
        count: containerParagraphs.length, // 총 단락 개수
        hasContent: paragraphsWithContent.length, // 내용이 있는 단락 개수
      };

      console.log('📊 [CONTAINER] 컨테이너 통계:', {
        containerId: currentContainer.id, // 컨테이너 ID 로깅
        name: currentContainer.name || 'unknown', // 컨테이너 이름 로깅 (fallback 포함)
        totalParagraphs: stats[currentContainer.id].count, // 총 단락 수 로깅
        paragraphsWithContent: stats[currentContainer.id].hasContent, // 내용 있는 단락 수 로깅
      });
    });

    console.log('✅ [CONTAINER] 컨테이너별 단락 통계 계산 완료');

    return stats;
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand): 스토어에서 조회 후 통계 계산

    // fallback: 스토어 접근 시 에러 처리
    let zustandContainers, zustandParagraphs;
    try {
      const state = useEditorCoreStore.getState();
      zustandContainers = state.containers || []; // 스토어에서 컨테이너 배열 조회
      zustandParagraphs = state.paragraphs || []; // 스토어에서 단락 배열 조회
    } catch (error) {
      console.error('⚠️ [CONTAINER] Zustand 스토어 접근 실패:', error);
      return {}; // 에러 시 빈 객체 반환하여 애플리케이션 중단 방지
    }

    // Zustand 타입을 Local 타입으로 변환
    const convertedContainers = zustandContainers.map(
      convertFromZustandContainer
    );
    const convertedParagraphs = zustandParagraphs.map(
      convertFromZustandParagraph
    );

    console.log('📊 [CONTAINER] 컨테이너별 단락 통계 계산 시작 (Zustand)');

    // 통계 결과를 저장할 객체 초기화
    const stats: Record<string, { count: number; hasContent: number }> = {};

    // 각 컨테이너별로 반복하여 통계 계산
    // ✨ [개선] 의미있는 변수명 사용: container → currentContainer
    convertedContainers.forEach((currentContainer) => {
      // fallback: 변환된 currentContainer가 유효하지 않은 경우 건너뛰기
      if (!currentContainer || !currentContainer.id) {
        console.warn(
          '⚠️ [CONTAINER] 유효하지 않은 변환된 컨테이너:',
          currentContainer
        );
        return;
      }

      // 해당 컨테이너에 속한 단락들 조회
      const containerParagraphs = getLocalParagraphsByContainer(
        currentContainer.id,
        convertedParagraphs
      );

      // 내용이 있는 단락들만 필터링
      // ✨ [개선] 의미있는 변수명 사용: p → paragraph
      const paragraphsWithContent = containerParagraphs.filter((paragraph) => {
        // fallback: paragraph가 null이나 undefined인 경우 처리
        if (!paragraph) return false;
        return (
          paragraph.content &&
          typeof paragraph.content === 'string' &&
          paragraph.content.trim().length > 0
        );
      });

      // 컨테이너별 통계 저장
      stats[currentContainer.id] = {
        count: containerParagraphs.length, // 총 단락 개수
        hasContent: paragraphsWithContent.length, // 내용이 있는 단락 개수
      };

      console.log('📊 [CONTAINER] 컨테이너 통계 (Zustand):', {
        containerId: currentContainer.id, // 컨테이너 ID 로깅
        name: currentContainer.name || 'unknown', // 컨테이너 이름 로깅
        totalParagraphs: stats[currentContainer.id].count, // 총 단락 수 로깅
        paragraphsWithContent: stats[currentContainer.id].hasContent, // 내용 있는 단락 수 로깅
      });
    });

    console.log('✅ [CONTAINER] 컨테이너별 단락 통계 계산 완료 (Zustand)');

    return stats;
  }
}

/**
 * 할당된 단락의 총개수를 계산하는 함수 (오버로드)
 *
 * 함수의 목적: 컨테이너에 할당된 단락들의 총 개수를 계산하여 반환
 * 사용 목적: 전체 시스템에서 컨테이너에 할당된 단락의 개수를 파악
 * 비즈니스 의미: containerId가 있는 단락들의 총 개수를 집계하여 할당 현황 제공
 */

// 오버로드 1: 매개변수 없이 호출 시 Zustand에서 데이터 조회 후 계산
export function getTotalAssignedParagraphs(): number;
// 오버로드 2: 매개변수로 availableParagraphs를 받아 Context 방식으로 계산
export function getTotalAssignedParagraphs(
  availableParagraphs: LocalParagraph[]
): number;
// 실제 구현부: 매개변수 유무에 따라 다른 방식으로 계산
export function getTotalAssignedParagraphs(
  availableParagraphs?: LocalParagraph[] // 할당 상태를 확인할 단락 배열
): number {
  if (availableParagraphs) {
    // ✅ 기존 방식 (context): 매개변수로 받은 배열에서 계산
    console.log('📊 [CONTAINER] 할당된 단락 총개수 계산');

    // fallback: availableParagraphs가 배열이 아닌 경우 처리
    const safeParagraphs = Array.isArray(availableParagraphs)
      ? availableParagraphs
      : [];

    // containerId가 있는 단락들만 카운트
    // ✨ [개선] 의미있는 변수명 사용: p → paragraph
    const assignedCount = safeParagraphs.filter((paragraph) => {
      // fallback: paragraph가 null이나 undefined인 경우 처리
      if (!paragraph) return false;
      // containerId가 존재하고 빈 문자열이 아닌 경우 할당된 것으로 판단
      return paragraph.containerId && paragraph.containerId.trim().length > 0;
    }).length;

    console.log('📊 [CONTAINER] 할당된 단락 총개수:', assignedCount);

    return assignedCount;
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand): 스토어에서 조회 후 계산

    // fallback: 스토어 접근 시 에러 처리
    let zustandParagraphs;
    try {
      zustandParagraphs = useEditorCoreStore.getState().paragraphs || []; // 스토어에서 단락 배열 조회
    } catch (error) {
      console.error('⚠️ [CONTAINER] Zustand 스토어 접근 실패:', error);
      return 0; // 에러 시 0 반환하여 애플리케이션 중단 방지
    }

    // Zustand 타입을 Local 타입으로 변환
    const convertedParagraphs = zustandParagraphs.map(
      convertFromZustandParagraph
    );

    console.log('📊 [CONTAINER] 할당된 단락 총개수 계산 (Zustand)');

    // containerId가 있는 단락들만 카운트
    // ✨ [개선] 의미있는 변수명 사용: p → paragraph
    const assignedCount = convertedParagraphs.filter((paragraph) => {
      // fallback: 변환된 paragraph가 null이나 undefined인 경우 처리
      if (!paragraph) return false;
      return paragraph.containerId && paragraph.containerId.trim().length > 0;
    }).length;

    console.log('📊 [CONTAINER] 할당된 단락 총개수 (Zustand):', assignedCount);

    return assignedCount;
  }
}

/**
 * 내용이 있는 할당된 단락의 총개수를 계산하는 함수 (오버로드)
 *
 * 함수의 목적: 컨테이너에 할당되면서 동시에 내용도 있는 단락들의 총 개수를 계산
 * 사용 목적: 실제 콘텐츠가 작성된 단락의 개수를 파악하여 작업 진행도 측정
 * 비즈니스 의미: containerId가 있으면서 동시에 content도 있는 단락들의 개수 집계
 */

// 오버로드 1: 매개변수 없이 호출 시 Zustand에서 데이터 조회 후 계산
export function getTotalParagraphsWithContent(): number;
// 오버로드 2: 매개변수로 availableParagraphs를 받아 Context 방식으로 계산
export function getTotalParagraphsWithContent(
  availableParagraphs: LocalParagraph[]
): number;
// 실제 구현부: 매개변수 유무에 따라 다른 방식으로 계산
export function getTotalParagraphsWithContent(
  availableParagraphs?: LocalParagraph[] // 내용 확인할 단락 배열
): number {
  if (availableParagraphs) {
    // ✅ 기존 방식 (context): 매개변수로 받은 배열에서 계산
    console.log('📊 [CONTAINER] 내용이 있는 단락 총개수 계산');

    // fallback: availableParagraphs가 배열이 아닌 경우 처리
    const safeParagraphs = Array.isArray(availableParagraphs)
      ? availableParagraphs
      : [];

    // containerId가 있으면서 동시에 내용도 있는 단락들만 카운트
    // ✨ [개선] 의미있는 변수명 사용: p → paragraph
    const contentCount = safeParagraphs.filter((paragraph) => {
      // fallback: paragraph가 null이나 undefined인 경우 처리
      if (!paragraph) return false;

      // 두 조건을 모두 만족해야 함:
      // 1. containerId가 존재하고 빈 문자열이 아님 (할당됨)
      // 2. content가 존재하고 공백이 아닌 문자가 포함됨 (내용 있음)
      const hasContainer =
        paragraph.containerId && paragraph.containerId.trim().length > 0;
      const hasContent =
        paragraph.content &&
        typeof paragraph.content === 'string' &&
        paragraph.content.trim().length > 0;

      return hasContainer && hasContent;
    }).length;

    console.log('📊 [CONTAINER] 내용이 있는 단락 총개수:', contentCount);

    return contentCount;
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand): 스토어에서 조회 후 계산

    // fallback: 스토어 접근 시 에러 처리
    let zustandParagraphs;
    try {
      zustandParagraphs = useEditorCoreStore.getState().paragraphs || []; // 스토어에서 단락 배열 조회
    } catch (error) {
      console.error('⚠️ [CONTAINER] Zustand 스토어 접근 실패:', error);
      return 0; // 에러 시 0 반환
    }

    // Zustand 타입을 Local 타입으로 변환
    const convertedParagraphs = zustandParagraphs.map(
      convertFromZustandParagraph
    );

    console.log('📊 [CONTAINER] 내용이 있는 단락 총개수 계산 (Zustand)');

    // containerId가 있으면서 동시에 내용도 있는 단락들만 카운트
    // ✨ [개선] 의미있는 변수명 사용: p → paragraph
    const contentCount = convertedParagraphs.filter((paragraph) => {
      // fallback: 변환된 paragraph가 null이나 undefined인 경우 처리
      if (!paragraph) return false;

      // 두 조건을 모두 만족해야 함
      const hasContainer =
        paragraph.containerId && paragraph.containerId.trim().length > 0;
      const hasContent =
        paragraph.content &&
        typeof paragraph.content === 'string' &&
        paragraph.content.trim().length > 0;

      return hasContainer && hasContent;
    }).length;

    console.log(
      '📊 [CONTAINER] 내용이 있는 단락 총개수 (Zustand):',
      contentCount
    );

    return contentCount;
  }
}
