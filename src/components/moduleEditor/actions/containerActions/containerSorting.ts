// 📁 actions/containerActions/containerSorting.ts

import { Container } from '../../types/container';
import { useEditorCoreStore } from '../../../../store/editorCore/editorCoreStore';
import { convertFromZustandContainer } from './containerTypeConverters';

/**
 * 컨테이너들을 order 속성으로 정렬하는 함수 (오버로드)
 *
 * 함수의 목적: 컨테이너 배열을 order 속성 기준으로 오름차순 정렬하여 반환
 * 사용 목적: 컨테이너들의 표시 순서를 일관되게 유지하기 위해
 * 비즈니스 의미: order 속성을 기준으로 오름차순 정렬하여 UI에서 순서대로 표시
 */

// 오버로드 1: 매개변수 없이 호출 시 Zustand에서 데이터 조회 후 정렬
export function sortContainersByOrder(): Container[];
// 오버로드 2: 매개변수로 unsortedContainers 배열을 받아 Context 방식으로 정렬
export function sortContainersByOrder(
  unsortedContainers: Container[]
): Container[];
// 실제 구현부: 매개변수 유무에 따라 다른 방식으로 정렬
export function sortContainersByOrder(
  unsortedContainers?: Container[]
): Container[] {
  if (unsortedContainers) {
    // ✅ 기존 방식 (context): 매개변수로 받은 배열을 정렬
    console.log('🔄 [CONTAINER] 컨테이너 정렬 시작:', {
      containerCount: unsortedContainers.length, // 정렬할 컨테이너 개수 로깅
    });

    // fallback: unsortedContainers가 배열이 아닌 경우 처리
    if (!Array.isArray(unsortedContainers)) {
      console.error(
        '⚠️ [CONTAINER] unsortedContainers가 배열이 아닙니다:',
        unsortedContainers
      );
      return []; // 빈 배열 반환하여 에러 방지
    }

    // 원본 배열 보호를 위해 스프레드 연산자로 복사본 생성
    // 왜 복사본을 만드는가: 원본 배열을 변경하지 않고 순수함수로 동작하기 위해
    const sortedContainers = [...unsortedContainers]
      .filter((containerToFilter) => {
        // ✨ [개선] 의미있는 변수명 사용: container → containerToFilter (필터링 대상 컨테이너)
        // fallback: null이나 undefined인 컨테이너 제거
        if (!containerToFilter) {
          console.warn(
            '⚠️ [CONTAINER] null 또는 undefined 컨테이너 발견, 제외'
          );
          return false;
        }
        return true;
      })
      .sort((firstContainer, secondContainer) => {
        // ✨ [개선] 의미있는 변수명 사용: a, b → firstContainer, secondContainer (정렬 비교 대상 명확화)
        // fallback: order가 없는 경우 0으로 처리하여 정렬
        const orderA =
          typeof firstContainer.order === 'number' ? firstContainer.order : 0;
        const orderB =
          typeof secondContainer.order === 'number' ? secondContainer.order : 0;

        // 오름차순 정렬: order가 작은 것부터 큰 것 순으로 배치
        // firstContainer.order - secondContainer.order가 음수면 firstContainer가 앞에, 양수면 secondContainer가 앞에 위치
        return orderA - orderB;
      });

    console.log('✅ [CONTAINER] 컨테이너 정렬 완료:', {
      // ✨ [개선] 의미있는 변수명 사용: c → sortedContainer (정렬된 컨테이너)
      sortedOrder: sortedContainers.map((sortedContainer) => ({
        id: sortedContainer?.id || 'unknown', // ID 로깅 (fallback 포함)
        name: sortedContainer?.name || 'unknown', // 이름 로깅 (fallback 포함)
        order: sortedContainer?.order || 0, // 순서 로깅 (fallback 포함)
      })),
    });

    return sortedContainers;
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand): 스토어에서 조회 후 정렬

    // fallback: 스토어 접근 시 에러 처리
    let zustandContainers;
    try {
      zustandContainers = useEditorCoreStore.getState().containers || []; // 스토어에서 컨테이너 배열 조회
    } catch (error) {
      console.error('⚠️ [CONTAINER] Zustand 스토어 접근 실패:', error);
      return []; // 에러 시 빈 배열 반환하여 애플리케이션 중단 방지
    }

    // Zustand 타입을 Local 타입으로 변환하여 기존 시스템과 호환
    const convertedContainers = zustandContainers
      .map(convertFromZustandContainer)
      .filter((convertedContainer) => {
        // ✨ [개선] 의미있는 변수명 사용: container → convertedContainer (변환된 컨테이너)
        // fallback: 변환 과정에서 null이나 undefined가 된 경우 제거
        if (!convertedContainer) {
          console.warn('⚠️ [CONTAINER] 변환 실패한 컨테이너 발견, 제외');
          return false;
        }
        return true;
      });

    console.log('🔄 [CONTAINER] 컨테이너 정렬 시작 (Zustand):', {
      containerCount: convertedContainers.length, // 변환된 컨테이너 개수 로깅
    });

    // 원본 배열 보호를 위해 복사본 생성 후 order 기준으로 정렬
    const sortedContainers = [...convertedContainers].sort(
      (firstContainer, secondContainer) => {
        // ✨ [개선] 의미있는 변수명 사용: a, b → firstContainer, secondContainer
        // fallback: order가 없는 경우 0으로 처리
        const orderA =
          typeof firstContainer.order === 'number' ? firstContainer.order : 0;
        const orderB =
          typeof secondContainer.order === 'number' ? secondContainer.order : 0;

        // 오름차순 정렬로 순서 배치
        return orderA - orderB;
      }
    );

    console.log('✅ [CONTAINER] 컨테이너 정렬 완료 (Zustand):', {
      // ✨ [개선] 의미있는 변수명 사용: c → sortedContainer
      sortedOrder: sortedContainers.map((sortedContainer) => ({
        id: sortedContainer?.id || 'unknown', // ID 로깅
        name: sortedContainer?.name || 'unknown', // 이름 로깅
        order: sortedContainer?.order || 0, // 순서 로깅
      })),
    });

    return sortedContainers;
  }
}
