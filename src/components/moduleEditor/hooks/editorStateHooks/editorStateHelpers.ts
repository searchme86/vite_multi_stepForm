import {
  Container,
  ParagraphBlock,
} from '../../../../store/shared/commonTypes';

// ✨ [헬퍼 함수들] 원본과 100% 동일한 로직으로 작성

// ✨ [헬퍼 함수] 컨테이너 생성 함수 - 새로운 섹션 컨테이너를 만들 때 사용
const createContainer = (
  containerNameInput: string, // 1. 컨테이너 이름 입력값 2. 원본 변수명과 일치
  containerSortOrder: number // 1. 컨테이너 정렬 순서 2. 원본 변수명과 일치
): Container => {
  try {
    // 1. 입력받은 컨테이너 이름의 공백 제거 및 빈 문자열 검증
    // 2. 사용자가 실수로 공백만 입력하거나 빈 값을 입력했을 때 기본 이름 제공으로 에러 방지
    const sanitizedContainerName =
      containerNameInput?.trim() || `컨테이너-${Date.now()}`;

    // 1. 정렬 순서가 유효한 숫자이고 0 이상인지 검증
    // 2. 음수나 잘못된 타입이 들어올 경우 0으로 기본값 설정하여 정렬 오류 방지
    const validatedSortOrder =
      typeof containerSortOrder === 'number' && containerSortOrder >= 0
        ? containerSortOrder
        : 0;

    return {
      // 1. 현재 시간과 랜덤 문자열을 조합한 고유 식별자 생성
      // 2. 동시에 여러 컨테이너가 생성되어도 ID 중복을 방지하기 위해 시간+랜덤값 조합 사용
      id: `container-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`,
      name: sanitizedContainerName,
      order: validatedSortOrder,
      createdAt: new Date(), // 컨테이너 생성 시점 기록으로 추후 정렬이나 관리에 활용
    };
  } catch (error) {
    console.error('❌ [HELPER] createContainer 실행 실패:', error);
    // 1. 오류 발생 시 최소한의 동작 가능한 기본 컨테이너 반환
    // 2. 앱이 중단되지 않도록 안전장치 제공
    return {
      id: `container-fallback-${Date.now()}`,
      name: `기본 컨테이너-${Date.now()}`,
      order: 0,
      createdAt: new Date(),
    };
  }
};

// ✨ [헬퍼 함수] 완성된 콘텐츠 생성 함수 - 모든 섹션과 단락을 하나의 텍스트로 합치는 함수
const generateCompletedContent = (
  containerCollectionInput: Container[], // 1. 컨테이너 컬렉션 입력값 2. 원본 변수명과 일치
  paragraphCollectionInput: ParagraphBlock[] // 1. 단락 컬렉션 입력값 2. 원본 변수명과 일치
): string => {
  try {
    // 1. 입력 배열들이 실제 배열인지 검증하고 안전한 배열로 변환
    // 2. null이나 undefined가 들어와도 빈 배열로 처리하여 런타임 에러 방지
    const validatedContainerCollection = Array.isArray(containerCollectionInput)
      ? containerCollectionInput
      : [];
    const validatedParagraphCollection = Array.isArray(paragraphCollectionInput)
      ? paragraphCollectionInput
      : [];

    // 1. 컨테이너들을 order 속성 기준으로 오름차순 정렬
    // 2. 사용자가 설정한 섹션 순서대로 최종 콘텐츠가 구성되도록 보장
    const sortedContainersByOrderValue = [...validatedContainerCollection].sort(
      (firstContainerItem, secondContainerItem) => {
        const firstOrder = firstContainerItem?.order ?? 0;
        const secondOrder = secondContainerItem?.order ?? 0;
        return firstOrder - secondOrder;
      }
    );

    // 1. 각 컨테이너별로 해당하는 문단들을 모아서 하나의 섹션 텍스트로 생성
    // 2. 컨테이너 순서에 따라 문단들을 그룹화하고 각 그룹 내에서도 order로 정렬하여 완전한 구조 생성
    const contentSectionsByContainerGroup = sortedContainersByOrderValue.map(
      (currentContainerItem) => {
        if (!currentContainerItem) return '';

        // 1. 현재 컨테이너에 속한 문단들만 필터링
        // 2. containerId가 일치하는 문단들만 선별하여 해당 섹션의 내용 구성
        const paragraphsInSpecificContainer = validatedParagraphCollection
          .filter((currentParagraphItem) => {
            if (!currentParagraphItem) return false;
            return currentParagraphItem.containerId === currentContainerItem.id;
          })
          .sort((firstParagraphItem, secondParagraphItem) => {
            const firstOrder = firstParagraphItem?.order ?? 0;
            const secondOrder = secondParagraphItem?.order ?? 0;
            return firstOrder - secondOrder;
          });

        // 1. 해당 컨테이너에 문단이 없으면 빈 문자열 반환
        // 2. 빈 섹션은 최종 콘텐츠에서 제외하기 위한 사전 체크
        if (paragraphsInSpecificContainer.length === 0) {
          return '';
        }

        // 1. 문단들의 내용을 두 줄바꿈(\n\n)으로 연결하여 단락 구분
        // 2. 빈 내용의 문단은 제외하고 실제 내용이 있는 문단들만 연결
        return paragraphsInSpecificContainer
          .map((currentParagraphItem) => {
            const content = currentParagraphItem?.content || '';
            return content;
          })
          .filter((contentText) => contentText.trim().length > 0)
          .join('\n\n');
      }
    );

    // 1. 빈 섹션들을 제거하고 실제 내용이 있는 섹션들만 최종 연결
    // 2. 각 섹션 사이를 두 줄바꿈으로 구분하여 읽기 좋은 최종 텍스트 생성
    return contentSectionsByContainerGroup
      .filter((sectionContentText) => sectionContentText.trim().length > 0)
      .join('\n\n');
  } catch (error) {
    console.error('❌ [HELPER] generateCompletedContent 실행 실패:', error);
    // 1. 오류 발생 시 빈 문자열 반환으로 앱이 중단되지 않도록 방지
    // 2. 에러가 발생해도 사용자는 계속 작업할 수 있도록 안전장치 제공
    return '';
  }
};

// 헬퍼 함수들을 export
export { createContainer, generateCompletedContent };
