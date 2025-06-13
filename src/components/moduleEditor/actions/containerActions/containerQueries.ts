// 📁 actions/containerActions/containerQueries.ts

import { LocalParagraph } from '../../types/paragraph';
import { useEditorCoreStore } from '../../store/editorCore/editorCoreStore';
import { convertFromZustandParagraph } from './containerTypeConverters';

/**
 * 할당되지 않은 단락들을 조회하는 함수 (오버로드)
 *
 * 함수의 목적: 컨테이너에 할당되지 않은 단락들만 필터링하여 반환
 * 사용 목적: Context 방식과 Zustand 방식 모두를 지원하여 점진적 마이그레이션 가능
 * 비즈니스 의미: containerId가 없는 단락들을 찾아 미할당 상태의 단락 목록 제공
 */

// 오버로드 1: 매개변수 없이 호출 시 Zustand에서 데이터 조회
export function getLocalUnassignedParagraphs(): LocalParagraph[];
// 오버로드 2: 매개변수로 availableParagraphs 배열을 받아 Context 방식으로 조회
export function getLocalUnassignedParagraphs(
  availableParagraphs: LocalParagraph[]
): LocalParagraph[];
// 실제 구현부: 매개변수 유무에 따라 다른 방식으로 조회
export function getLocalUnassignedParagraphs(
  availableParagraphs?: LocalParagraph[] // 조회할 단락 배열 (선택적 매개변수로 Context 방식과 Zustand 방식 구분)
): LocalParagraph[] {
  if (availableParagraphs) {
    // ✅ 기존 방식 (context): 매개변수로 받은 배열에서 조회
    console.log('📋 [CONTAINER] 할당되지 않은 단락 조회 시작:', {
      totalParagraphs: availableParagraphs.length, // 전체 단락 수 로깅으로 디버깅 지원
    });

    // fallback: availableParagraphs가 배열이 아닌 경우 처리
    const safeParagraphs = Array.isArray(availableParagraphs)
      ? availableParagraphs
      : [];

    // containerId가 없는 단락들만 필터링하여 미할당 단락 추출
    // ✨ [개선] 의미있는 변수명 사용: p → paragraph (단락을 의미함을 명확히)
    const unassignedParagraphs = safeParagraphs.filter((paragraph) => {
      // fallback: paragraph가 null이나 undefined인 경우 처리
      if (!paragraph) return false;
      // containerId가 없거나 빈 문자열인 경우 미할당으로 판단
      return !paragraph.containerId;
    });

    console.log('📋 [CONTAINER] 할당되지 않은 단락 조회 완료:', {
      unassignedCount: unassignedParagraphs.length, // 미할당 단락 수 로깅
      // ✨ [개선] 의미있는 변수명 사용: p → paragraph
      unassignedIds: unassignedParagraphs.map(
        (paragraph) => paragraph?.id || 'unknown'
      ), // ID 목록 로깅 (fallback 포함)
    });

    return unassignedParagraphs;
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand): 스토어에서 직접 조회

    // fallback: 스토어가 없거나 에러 발생 시 처리
    let zustandParagraphs;
    try {
      zustandParagraphs = useEditorCoreStore.getState().paragraphs || []; // 스토어에서 단락 배열 조회
    } catch (error) {
      console.error('⚠️ [CONTAINER] Zustand 스토어 접근 실패:', error);
      return []; // 에러 시 빈 배열 반환하여 애플리케이션 중단 방지
    }

    // Zustand 타입을 Local 타입으로 변환하여 기존 시스템과 호환
    const convertedParagraphs = zustandParagraphs.map(
      convertFromZustandParagraph
    );

    console.log('📋 [CONTAINER] 할당되지 않은 단락 조회 시작 (Zustand):', {
      totalParagraphs: convertedParagraphs.length, // 변환된 전체 단락 수 로깅
    });

    // containerId가 없는 단락들만 필터링
    // ✨ [개선] 의미있는 변수명 사용: p → paragraph
    const unassignedParagraphs = convertedParagraphs.filter((paragraph) => {
      // fallback: 변환 과정에서 paragraph가 null이나 undefined가 된 경우 처리
      if (!paragraph) return false;
      return !paragraph.containerId; // containerId가 없는 경우 미할당으로 판단
    });

    console.log('📋 [CONTAINER] 할당되지 않은 단락 조회 완료 (Zustand):', {
      unassignedCount: unassignedParagraphs.length, // 미할당 단락 수 로깅
      // ✨ [개선] 의미있는 변수명 사용: p → paragraph
      unassignedIds: unassignedParagraphs.map(
        (paragraph) => paragraph?.id || 'unknown'
      ), // ID 목록 로깅
    });

    return unassignedParagraphs;
  }
}

/**
 * 특정 컨테이너에 속한 단락들을 조회하는 함수 (오버로드)
 *
 * 함수의 목적: 지정된 컨테이너 ID에 속한 단락들을 순서대로 정렬하여 반환
 * 사용 목적: 컨테이너별로 그룹화된 단락들을 order 순으로 정렬하여 조회
 * 비즈니스 의미: 특정 컨테이너 ID로 필터링하고 순서대로 정렬한 단락 목록 제공
 */

// 오버로드 1: targetContainerId만 받아 Zustand에서 조회
export function getLocalParagraphsByContainer(
  targetContainerId: string
): LocalParagraph[];
// 오버로드 2: targetContainerId와 availableParagraphs 배열을 받아 Context 방식으로 조회
export function getLocalParagraphsByContainer(
  targetContainerId: string,
  availableParagraphs: LocalParagraph[]
): LocalParagraph[];
// 실제 구현부: 매개변수 개수에 따라 다른 방식으로 조회
export function getLocalParagraphsByContainer(
  targetContainerId: string, // 조회할 컨테이너의 고유 ID (어떤 컨테이너의 단락을 찾을지 지정)
  availableParagraphs?: LocalParagraph[] // 조회할 단락 배열 (선택적 매개변수로 Context 방식과 Zustand 방식 구분)
): LocalParagraph[] {
  // fallback: targetContainerId가 없거나 빈 문자열인 경우 처리
  if (!targetContainerId || typeof targetContainerId !== 'string') {
    console.warn(
      '⚠️ [CONTAINER] 유효하지 않은 targetContainerId:',
      targetContainerId
    );
    return []; // 빈 배열 반환하여 에러 방지
  }

  if (availableParagraphs) {
    // ✅ 기존 방식 (context): 매개변수로 받은 배열에서 조회
    console.log('📋 [CONTAINER] 컨테이너별 단락 조회 시작:', {
      targetContainerId, // 조회 대상 컨테이너 ID
      totalParagraphs: availableParagraphs.length, // 전체 단락 수 로깅
    });

    // fallback: availableParagraphs가 배열이 아닌 경우 처리
    const safeParagraphs = Array.isArray(availableParagraphs)
      ? availableParagraphs
      : [];

    // 특정 컨테이너에 속한 단락들만 필터링하고 order 순으로 정렬
    const containerParagraphs = safeParagraphs
      .filter((paragraph) => {
        // ✨ [개선] 의미있는 변수명 사용: p → paragraph
        // fallback: paragraph가 null이나 undefined인 경우 처리
        if (!paragraph) return false;
        return paragraph.containerId === targetContainerId; // 해당 컨테이너 ID와 일치하는 단락만 필터링
      })
      .sort((firstParagraph, secondParagraph) => {
        // ✨ [개선] 의미있는 변수명 사용: a, b → firstParagraph, secondParagraph (정렬 비교 대상 명확화)
        // fallback: order가 없는 경우 0으로 처리하여 정렬
        const orderA = firstParagraph?.order || 0;
        const orderB = secondParagraph?.order || 0;
        return orderA - orderB; // 오름차순 정렬로 순서 배치
      });

    console.log('📋 [CONTAINER] 컨테이너별 단락 조회 완료:', {
      targetContainerId, // 조회한 컨테이너 ID
      paragraphCount: containerParagraphs.length, // 조회된 단락 수 로깅
      // ✨ [개선] 의미있는 변수명 사용: p → paragraph
      paragraphIds: containerParagraphs.map(
        (paragraph) => paragraph?.id || 'unknown'
      ), // 단락 ID 목록 로깅
      orders: containerParagraphs.map((paragraph) => paragraph?.order || 0), // 단락 순서 목록 로깅
    });

    return containerParagraphs;
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand): 스토어에서 직접 조회

    // fallback: 스토어 접근 시 에러 처리
    let zustandParagraphs;
    try {
      zustandParagraphs = useEditorCoreStore.getState().paragraphs || []; // 스토어에서 단락 배열 조회
    } catch (error) {
      console.error('⚠️ [CONTAINER] Zustand 스토어 접근 실패:', error);
      return []; // 에러 시 빈 배열 반환
    }

    // Zustand 타입을 Local 타입으로 변환
    const convertedParagraphs = zustandParagraphs.map(
      convertFromZustandParagraph
    );

    console.log('📋 [CONTAINER] 컨테이너별 단락 조회 시작 (Zustand):', {
      targetContainerId, // 조회 대상 컨테이너 ID
      totalParagraphs: convertedParagraphs.length, // 변환된 전체 단락 수 로깅
    });

    // 특정 컨테이너에 속한 단락들만 필터링하고 order 순으로 정렬
    const containerParagraphs = convertedParagraphs
      .filter((paragraph) => {
        // ✨ [개선] 의미있는 변수명 사용: p → paragraph
        // fallback: 변환 과정에서 paragraph가 null이나 undefined가 된 경우 처리
        if (!paragraph) return false;
        return paragraph.containerId === targetContainerId; // 해당 컨테이너 ID와 일치하는 단락만 필터링
      })
      .sort((firstParagraph, secondParagraph) => {
        // ✨ [개선] 의미있는 변수명 사용: a, b → firstParagraph, secondParagraph
        // fallback: order가 없는 경우 0으로 처리
        const orderA = firstParagraph?.order || 0;
        const orderB = secondParagraph?.order || 0;
        return orderA - orderB; // 오름차순 정렬
      });

    console.log('📋 [CONTAINER] 컨테이너별 단락 조회 완료 (Zustand):', {
      targetContainerId, // 조회한 컨테이너 ID
      paragraphCount: containerParagraphs.length, // 조회된 단락 수 로깅
      // ✨ [개선] 의미있는 변수명 사용: p → paragraph
      paragraphIds: containerParagraphs.map(
        (paragraph) => paragraph?.id || 'unknown'
      ), // 단락 ID 목록 로깅
      orders: containerParagraphs.map((paragraph) => paragraph?.order || 0), // 단락 순서 목록 로깅
    });

    return containerParagraphs;
  }
}
