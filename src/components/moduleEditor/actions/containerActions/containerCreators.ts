// 📁 actions/containerActions/containerCreators.ts

import { Container } from '../../types/container';

/**
 * 단일 컨테이너를 생성하는 함수
 * 왜 사용하는가: 사용자 입력을 받아 새로운 컨테이너 객체를 생성하여 시스템에 추가
 * 어떤 의미인가: 컨테이너 팩토리 함수로 고유 ID와 순서를 가진 Container 객체 생성
 */
export const createContainer = (
  containerName: string,
  containerIndex: number
): Container => {
  console.log('🏗️ [CONTAINER] 새 컨테이너 생성:', {
    containerName,
    containerIndex,
  });

  // fallback: containerName이 없거나 유효하지 않은 경우 처리
  const safeName =
    containerName && typeof containerName === 'string'
      ? containerName.trim()
      : '새 컨테이너';
  if (!safeName) {
    console.warn(
      '⚠️ [CONTAINER] 빈 이름으로 컨테이너 생성 시도, 기본 이름 사용'
    );
  }

  // fallback: containerIndex가 숫자가 아니거나 음수인 경우 처리
  const safeIndex =
    typeof containerIndex === 'number' && containerIndex >= 0
      ? containerIndex
      : 0;
  if (safeIndex !== containerIndex) {
    console.warn(
      '⚠️ [CONTAINER] 유효하지 않은 containerIndex:',
      containerIndex,
      '-> 0으로 설정'
    );
  }

  // 고유한 ID 생성: timestamp + index + random string 조합으로 중복 방지
  const timestamp = Date.now(); // 현재 시간을 밀리초로 변환하여 시간 기반 고유성 확보
  const randomStr = Math.random() // 0~1 사이 난수 생성
    .toString(36) // 36진법으로 변환하여 영숫자 조합 생성
    .substr(2, 9); // 앞의 '0.' 부분 제거하고 9자리 문자열 추출

  const container: Container = {
    id: `container-${timestamp}-${safeIndex}-${randomStr}`, // 복합 ID로 고유성 보장
    name: safeName, // 정제된 이름 사용 (공백 제거됨)
    order: safeIndex, // 정제된 순서 값 사용
  };

  console.log('✅ [CONTAINER] 컨테이너 생성 완료:', {
    id: container.id, // 생성된 고유 ID 로깅
    name: container.name, // 최종 이름 로깅
    order: container.order, // 최종 순서 로깅
  });

  return container;
};

/**
 * 여러 입력값으로부터 다중 컨테이너를 생성하는 함수
 * 왜 사용하는가: 사용자가 여러 컨테이너를 한번에 생성하고자 할 때 일괄 처리
 * 어떤 의미인가: 문자열 배열을 받아 각각을 Container 객체로 변환하는 배치 생성 함수
 */
export const createContainersFromInputs = (
  validInputs: string[] // 유효성 검증된 입력 문자열 배열
): Container[] => {
  console.log('🏗️ [CONTAINER] 다중 컨테이너 생성 시작:', {
    inputCount: validInputs.length, // 입력된 개수 로깅
    inputs: validInputs, // 입력 내용 로깅
  });

  // fallback: validInputs가 배열이 아니거나 빈 배열인 경우 처리
  if (!Array.isArray(validInputs)) {
    console.error('⚠️ [CONTAINER] validInputs가 배열이 아닙니다:', validInputs);
    return []; // 빈 배열 반환하여 에러 방지
  }

  if (validInputs.length === 0) {
    console.warn('⚠️ [CONTAINER] 빈 입력 배열로 컨테이너 생성 시도');
    return []; // 빈 배열 반환
  }

  // 각 입력값을 Container 객체로 변환
  // ✨ [개선] 의미있는 변수명 사용: name, index → inputName, inputIndex
  const containers = validInputs.map((inputName, inputIndex) => {
    // fallback: inputName이 유효하지 않은 경우 처리
    if (!inputName || typeof inputName !== 'string') {
      console.warn(
        `⚠️ [CONTAINER] 유효하지 않은 입력 [${inputIndex}]:`,
        inputName
      );
      return createContainer(`컨테이너 ${inputIndex + 1}`, inputIndex); // 기본 이름으로 생성
    }

    // createContainer 함수를 사용하여 개별 컨테이너 생성
    // inputIndex를 매개변수로 전달하여 각 컨테이너의 order 설정
    return createContainer(inputName, inputIndex);
  });

  // fallback: 생성 과정에서 null이나 undefined가 생긴 경우 필터링
  // ✨ [개선] 의미있는 변수명 사용: container → createdContainer
  const validContainers = containers.filter((createdContainer) => {
    if (!createdContainer || !createdContainer.id) {
      console.warn(
        '⚠️ [CONTAINER] 유효하지 않은 컨테이너가 생성됨:',
        createdContainer
      );
      return false; // 유효하지 않은 컨테이너 제외
    }
    return true; // 유효한 컨테이너만 포함
  });

  console.log('✅ [CONTAINER] 다중 컨테이너 생성 완료:', {
    createdCount: validContainers.length, // 실제 생성된 개수 로깅
    // ✨ [개선] 의미있는 변수명 사용: c → validContainer
    containerIds: validContainers.map(
      (validContainer) => validContainer?.id || 'unknown'
    ), // 생성된 컨테이너 ID 목록 로깅
    containerNames: validContainers.map(
      (validContainer) => validContainer?.name || 'unknown'
    ), // 생성된 컨테이너 이름 목록 로깅
  });

  return validContainers;
};
