// 📁 store/shared/utilityFunctions.ts

import type {
  Container,
  ParagraphBlock,
  EditorState,
  ImageViewConfig,
} from './commonTypes';

/**
 * 새로운 Container 객체를 생성하는 팩토리 함수
 * 1. 고유한 ID를 생성하여 컨테이너 식별자로 사용
 * 2. 입력받은 이름의 공백을 제거하여 정리
 * 3. 현재 시간을 생성 시점으로 기록
 */
export const createContainer = (
  containerName: string = '', // fallback: 빈 문자열
  containerOrder: number = 0 // fallback: 0
): Container => {
  // 1. 현재 시간과 랜덤 문자열을 조합하여 고유 ID 생성
  // 2. 중복 가능성을 최소화하기 위한 ID 생성 전략
  const currentTimestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 9);
  const uniqueContainerId = `container-${currentTimestamp}-${randomString}`;

  // 1. 입력받은 컨테이너 이름의 앞뒤 공백 제거
  // 2. 사용자 입력 데이터 정제를 통한 데이터 품질 향상
  // 3. fallback: containerName이 undefined/null인 경우 빈 문자열 사용
  const safeContainerName = containerName || '';
  const cleanedContainerName = safeContainerName.trim();

  // 1. 현재 시점을 컨테이너 생성 시간으로 기록
  // 2. 추후 컨테이너 생성 순서 추적 및 정렬에 활용
  const containerCreationTime = new Date();

  return {
    id: uniqueContainerId,
    name: cleanedContainerName,
    order: containerOrder,
    createdAt: containerCreationTime,
  };
};

/**
 * 새로운 ParagraphBlock 객체를 생성하는 팩토리 함수
 * 1. 고유한 ID를 생성하여 단락 식별자로 사용
 * 2. 입력받은 내용의 공백을 제거하여 정리
 * 3. 초기 상태에서는 어떤 컨테이너에도 할당되지 않은 상태로 설정
 */
export const createParagraphBlock = (
  paragraphContent: string = '' // fallback: 빈 문자열
): ParagraphBlock => {
  // 1. 현재 시간과 랜덤 문자열을 조합하여 고유 ID 생성
  // 2. 단락 간 중복 방지를 위한 고유 식별자 생성
  const currentTimestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 9);
  const uniqueParagraphId = `paragraph-${currentTimestamp}-${randomString}`;

  // 1. 입력받은 단락 내용의 앞뒤 공백 제거
  // 2. 마크다운 콘텐츠의 품질 향상을 위한 데이터 정제
  // 3. fallback: paragraphContent가 undefined/null인 경우 빈 문자열 사용
  const safeParagraphContent = paragraphContent || '';
  const cleanedParagraphContent = safeParagraphContent.trim();

  // 1. 현재 시점을 단락 생성 및 수정 시간으로 기록
  // 2. 생성 시점과 수정 시점을 동일하게 설정
  const paragraphCreationTime = new Date();
  const paragraphUpdateTime = new Date();

  return {
    id: uniqueParagraphId,
    content: cleanedParagraphContent,
    containerId: null, // 초기 생성 시에는 컨테이너에 할당되지 않음
    order: 0, // 초기 순서는 0으로 설정
    createdAt: paragraphCreationTime,
    updatedAt: paragraphUpdateTime,
  };
};

/**
 * 컨테이너 배열을 순서대로 정렬하는 함수
 * 1. 원본 배열을 변경하지 않고 새로운 정렬된 배열을 반환
 * 2. order 속성을 기준으로 오름차순 정렬
 */
export const sortContainers = (
  containerList: Container[] = [] // fallback: 빈 배열
): Container[] => {
  // 1. 입력 검증: containerList가 유효한 배열인지 확인
  // 2. fallback: 유효하지 않은 경우 빈 배열 사용
  const safeContainerList = Array.isArray(containerList) ? containerList : [];

  // 1. 스프레드 연산자를 사용하여 원본 배열의 불변성 보장
  // 2. order 속성을 기준으로 컨테이너들을 오름차순 정렬
  return [...safeContainerList].sort((firstContainer, secondContainer) => {
    // 구조분해할당으로 order 속성 추출 (fallback 포함)
    const { order: firstOrder = 0 } = firstContainer || {};
    const { order: secondOrder = 0 } = secondContainer || {};

    return firstOrder - secondOrder;
  });
};

/**
 * 특정 컨테이너에 속한 단락들을 순서대로 반환하는 함수
 * 1. 지정된 컨테이너 ID에 할당된 단락들만 필터링
 * 2. 필터링된 단락들을 order 속성 기준으로 정렬
 */
export const getParagraphsByContainer = (
  allParagraphs: ParagraphBlock[] = [], // fallback: 빈 배열
  targetContainerId: string = '' // fallback: 빈 문자열
): ParagraphBlock[] => {
  // 1. 입력 검증: allParagraphs가 유효한 배열인지 확인
  // 2. fallback: 유효하지 않은 경우 빈 배열 사용
  const safeParagraphList = Array.isArray(allParagraphs) ? allParagraphs : [];
  const safeTargetContainerId = targetContainerId || '';

  // 1. 전체 단락 목록에서 특정 컨테이너에 속한 단락들만 필터링
  // 2. containerId가 목표 컨테이너 ID와 일치하는 단락들만 선별
  const paragraphsInTargetContainer = safeParagraphList.filter(
    (singleParagraph) => {
      // 구조분해할당으로 containerId 속성 추출 (fallback 포함)
      const { containerId = null } = singleParagraph || {};
      return containerId === safeTargetContainerId;
    }
  );

  // 1. 필터링된 단락들을 order 속성 기준으로 오름차순 정렬
  // 2. 컨테이너 내에서 단락들의 순서를 보장
  const sortedParagraphsInContainer = paragraphsInTargetContainer.sort(
    (firstParagraph, secondParagraph) => {
      // 구조분해할당으로 order 속성 추출 (fallback 포함)
      const { order: firstOrder = 0 } = firstParagraph || {};
      const { order: secondOrder = 0 } = secondParagraph || {};

      return firstOrder - secondOrder;
    }
  );

  return sortedParagraphsInContainer;
};

/**
 * 할당되지 않은 단락들을 반환하는 함수
 * 1. 어떤 컨테이너에도 할당되지 않은 단락들만 필터링
 * 2. 생성 시간 기준으로 오름차순 정렬하여 반환
 */
export const getUnassignedParagraphs = (
  allParagraphs: ParagraphBlock[] = [] // fallback: 빈 배열
): ParagraphBlock[] => {
  // 1. 입력 검증: allParagraphs가 유효한 배열인지 확인
  // 2. fallback: 유효하지 않은 경우 빈 배열 사용
  const safeParagraphList = Array.isArray(allParagraphs) ? allParagraphs : [];

  // 1. 전체 단락 목록에서 컨테이너에 할당되지 않은 단락들만 필터링
  // 2. containerId가 null인 단락들만 선별
  const unassignedParagraphList = safeParagraphList.filter(
    (singleParagraph) => {
      // 구조분해할당으로 containerId 속성 추출 (fallback 포함)
      const { containerId = null } = singleParagraph || {};
      return containerId === null;
    }
  );

  // 1. 할당되지 않은 단락들을 생성 시간 기준으로 오름차순 정렬
  // 2. 먼저 생성된 단락이 앞에 오도록 정렬
  const sortedUnassignedParagraphs = unassignedParagraphList.sort(
    (firstParagraph, secondParagraph) => {
      // 구조분해할당으로 createdAt 속성 추출 (fallback 포함)
      const { createdAt: firstCreatedAt = new Date(0) } = firstParagraph || {};
      const { createdAt: secondCreatedAt = new Date(0) } =
        secondParagraph || {};

      // Date 객체의 getTime() 메서드 안전하게 호출
      const firstTimestamp =
        firstCreatedAt instanceof Date ? firstCreatedAt.getTime() : 0;
      const secondTimestamp =
        secondCreatedAt instanceof Date ? secondCreatedAt.getTime() : 0;

      return firstTimestamp - secondTimestamp;
    }
  );

  return sortedUnassignedParagraphs;
};

/**
 * 전체 컨테이너와 단락을 하나의 완성된 마크다운 텍스트로 변환하는 함수
 * 1. 컨테이너들을 순서대로 정렬
 * 2. 각 컨테이너에 속한 단락들을 순서대로 결합
 * 3. 모든 섹션을 하나의 완성된 마크다운으로 통합
 */
export const generateCompletedContent = (
  containerList: Container[] = [], // fallback: 빈 배열
  paragraphList: ParagraphBlock[] = [] // fallback: 빈 배열
): string => {
  // 1. 입력 검증: 배열들이 유효한지 확인
  // 2. fallback: 유효하지 않은 경우 빈 배열 사용
  const safeContainerList = Array.isArray(containerList) ? containerList : [];
  const safeParagraphList = Array.isArray(paragraphList) ? paragraphList : [];

  // 1. 컨테이너들을 order 속성 기준으로 정렬
  // 2. 최종 마크다운에서 컨테이너들이 올바른 순서로 나타나도록 보장
  const orderedContainerList = sortContainers(safeContainerList);

  // 1. 각 컨테이너별로 해당하는 단락들을 수집하고 텍스트로 변환
  // 2. 컨테이너 순서에 따라 섹션들을 생성
  const markdownSectionList = orderedContainerList.map((currentContainer) => {
    // 구조분해할당으로 id 속성 추출 (fallback 포함)
    const { id: containerId = '' } = currentContainer || {};

    // 현재 컨테이너에 속한 모든 단락들을 순서대로 가져오기
    const paragraphsInCurrentContainer = getParagraphsByContainer(
      safeParagraphList,
      containerId
    );

    // 컨테이너에 단락이 없는 경우 빈 문자열 반환
    if (
      !Array.isArray(paragraphsInCurrentContainer) ||
      paragraphsInCurrentContainer.length === 0
    ) {
      return '';
    }

    // 1. 컨테이너 내 단락들의 내용을 추출하여 결합
    // 2. 각 단락 사이에 두 줄 개행(\n\n)을 추가하여 마크다운 단락 구분
    const combinedParagraphContent = paragraphsInCurrentContainer
      .map((singleParagraph) => {
        // 구조분해할당으로 content 속성 추출 (fallback 포함)
        const { content = '' } = singleParagraph || {};
        return content;
      })
      .join('\n\n');

    return combinedParagraphContent;
  });

  // 1. 빈 섹션들을 제거하여 불필요한 공백 방지
  // 2. 유효한 섹션들만 남겨서 최종 마크다운 품질 향상
  const validMarkdownSections = markdownSectionList.filter((singleSection) => {
    // fallback: singleSection이 문자열이 아닌 경우 빈 문자열로 처리
    const safeSection = typeof singleSection === 'string' ? singleSection : '';
    const trimmedSection = safeSection.trim();
    return trimmedSection.length > 0;
  });

  // 1. 모든 유효한 섹션들을 두 줄 개행으로 연결
  // 2. 섹션 간 적절한 간격을 두어 가독성 향상
  const finalMarkdownContent = validMarkdownSections.join('\n\n');

  return finalMarkdownContent;
};

/**
 * 에디터 상태 유효성 검사 함수
 * 1. 최소 1개 이상의 컨테이너가 있는지 확인
 * 2. 최소 1개 이상의 단락이 있는지 확인
 * 3. 최소 1개 이상의 할당된 단락이 있는지 확인
 */
export const validateEditorState = (
  editorStateToValidate: Partial<EditorState> = {} // fallback: 빈 객체
): boolean => {
  // 1. 입력 검증: editorStateToValidate가 유효한 객체인지 확인
  // 2. fallback: 유효하지 않은 경우 빈 객체 사용
  const safeEditorState =
    editorStateToValidate && typeof editorStateToValidate === 'object'
      ? editorStateToValidate
      : {};

  // 구조분해할당으로 containers와 paragraphs 속성 추출 (fallback 포함)
  const { containers = [], paragraphs = [] } = safeEditorState;

  // 1. 컨테이너 존재 여부 검사
  // 2. 에디터에 구조(컨테이너)가 정의되어 있는지 확인
  const safeContainers = Array.isArray(containers) ? containers : [];
  const hasValidContainers = safeContainers.length > 0;
  if (!hasValidContainers) {
    return false;
  }

  // 1. 단락 존재 여부 검사
  // 2. 에디터에 실제 내용(단락)이 있는지 확인
  const safeParagraphs = Array.isArray(paragraphs) ? paragraphs : [];
  const hasValidParagraphs = safeParagraphs.length > 0;
  if (!hasValidParagraphs) {
    return false;
  }

  // 1. 할당된 단락 존재 여부 검사
  // 2. 단락들이 실제로 컨테이너에 배치되어 의미있는 글 구조를 형성하는지 확인
  const assignedParagraphList = safeParagraphs.filter((singleParagraph) => {
    // 구조분해할당으로 containerId 속성 추출 (fallback 포함)
    const { containerId = null } = singleParagraph || {};
    return containerId !== null;
  });

  const hasAssignedParagraphs = assignedParagraphList.length > 0;
  if (!hasAssignedParagraphs) {
    return false;
  }

  return true;
};

/**
 * 기본 에디터 상태를 생성하는 함수
 * 1. 빈 컨테이너 배열로 초기화
 * 2. 빈 단락 배열로 초기화
 * 3. 빈 완성된 내용으로 초기화
 * 4. 미완료 상태로 초기화
 */
export const createDefaultEditorState = (): EditorState => {
  return {
    containers: [], // 초기에는 구조가 정의되지 않은 상태
    paragraphs: [], // 초기에는 작성된 내용이 없는 상태
    completedContent: '', // 초기에는 완성된 글이 없는 상태
    isCompleted: false, // 초기에는 에디터 작업이 완료되지 않은 상태
  };
};

/**
 * 기본 ImageViewConfig를 생성하는 함수
 * 1. 빈 클릭 순서 배열로 초기화
 * 2. 빈 선택된 이미지 배열로 초기화
 * 3. 기본 레이아웃 설정으로 초기화
 * 4. 모든 이미지 표시 필터로 초기화
 */
export const createDefaultImageViewConfig = (): ImageViewConfig => {
  return {
    clickOrder: [], // 초기에는 이미지 클릭 순서가 없는 상태
    selectedImages: [], // 초기에는 선택된 이미지가 없는 상태
    layout: {
      columns: 3, // 기본 3열 그리드 레이아웃
      gridType: 'grid', // 기본 그리드 타입 (masonry가 아닌 일반 그리드)
    },
    filter: 'all', // 기본적으로 모든 이미지를 표시
  };
};

//====여기부터 수정됨====
/**
 * 브라우저 저장소를 완전히 초기화하는 유틸리티 함수
 * 1. localStorage에서 에디터 관련 모든 데이터 삭제
 * 2. sessionStorage에서 에디터 관련 모든 데이터 삭제
 * 3. 개발자 도구나 디버깅 목적으로 사용 가능
 */
export const clearAllEditorStorage = (): void => {
  console.log('🧹 [UTILITY] 모든 에디터 저장소 완전 삭제 시작');

  try {
    // 1. localStorage 에디터 데이터 삭제
    if (typeof window !== 'undefined' && window.localStorage) {
      const editorCoreKey = 'editor-core-storage';
      window.localStorage.removeItem(editorCoreKey);
      console.log(`🗑️ [UTILITY] localStorage ${editorCoreKey} 삭제 완료`);

      // 추가로 다른 에디터 관련 키들도 삭제 (있다면)
      const allKeys = Object.keys(window.localStorage);
      const editorKeys = allKeys.filter((key) => key.startsWith('editor-'));
      editorKeys.forEach((key) => {
        window.localStorage.removeItem(key);
        console.log(`🗑️ [UTILITY] localStorage ${key} 추가 삭제`);
      });
    }

    // 2. sessionStorage 에디터 데이터 삭제
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const editorUIKey = 'editor-ui-storage';
      window.sessionStorage.removeItem(editorUIKey);
      console.log(`🗑️ [UTILITY] sessionStorage ${editorUIKey} 삭제 완료`);

      // 추가로 다른 에디터 관련 키들도 삭제 (있다면)
      const allKeys = Object.keys(window.sessionStorage);
      const editorKeys = allKeys.filter((key) => key.startsWith('editor-'));
      editorKeys.forEach((key) => {
        window.sessionStorage.removeItem(key);
        console.log(`🗑️ [UTILITY] sessionStorage ${key} 추가 삭제`);
      });
    }

    console.log('✅ [UTILITY] 모든 에디터 저장소 완전 삭제 완료');

    // 3. 페이지 새로고침 권장 알림 (선택적)
    if (typeof window !== 'undefined' && window.confirm) {
      const shouldReload = window.confirm(
        '에디터 저장소가 완전히 초기화되었습니다. 페이지를 새로고침하시겠습니까?'
      );
      if (shouldReload && window.location) {
        window.location.reload();
      }
    }
  } catch (error) {
    console.error('❌ [UTILITY] 저장소 삭제 중 오류:', error);
  }
};

/**
 * 개발자 도구용: 현재 저장소 상태를 확인하는 함수
 * 1. localStorage에 저장된 에디터 데이터 출력
 * 2. sessionStorage에 저장된 에디터 데이터 출력
 * 3. 저장소 크기 및 키 목록 표시
 */
export const inspectEditorStorage = (): void => {
  console.group('🔍 [UTILITY] 에디터 저장소 상태 검사');

  try {
    // 1. localStorage 검사
    if (typeof window !== 'undefined' && window.localStorage) {
      console.group('💾 localStorage 상태');

      const editorCoreData = window.localStorage.getItem('editor-core-storage');
      if (editorCoreData) {
        console.log('📊 editor-core-storage:', JSON.parse(editorCoreData));
        console.log('📏 크기:', new Blob([editorCoreData]).size, 'bytes');
      } else {
        console.log('❌ editor-core-storage: 데이터 없음');
      }

      // 다른 에디터 관련 키들 검사
      const allLocalKeys = Object.keys(window.localStorage);
      const editorLocalKeys = allLocalKeys.filter((key) =>
        key.startsWith('editor-')
      );
      console.log('🔑 에디터 관련 키들:', editorLocalKeys);

      console.groupEnd();
    }

    // 2. sessionStorage 검사
    if (typeof window !== 'undefined' && window.sessionStorage) {
      console.group('🗂️ sessionStorage 상태');

      const editorUIData = window.sessionStorage.getItem('editor-ui-storage');
      if (editorUIData) {
        console.log('📊 editor-ui-storage:', JSON.parse(editorUIData));
        console.log('📏 크기:', new Blob([editorUIData]).size, 'bytes');
      } else {
        console.log('❌ editor-ui-storage: 데이터 없음');
      }

      // 다른 에디터 관련 키들 검사
      const allSessionKeys = Object.keys(window.sessionStorage);
      const editorSessionKeys = allSessionKeys.filter((key) =>
        key.startsWith('editor-')
      );
      console.log('🔑 에디터 관련 키들:', editorSessionKeys);

      console.groupEnd();
    }
  } catch (error) {
    console.error('❌ [UTILITY] 저장소 검사 중 오류:', error);
  }

  console.groupEnd();
};

/**
 * 브라우저 콘솔에서 사용할 수 있는 전역 디버그 함수들을 등록
 * 1. window.clearEditorStorage: 완전 초기화 함수
 * 2. window.inspectEditorStorage: 저장소 상태 검사 함수
 * 3. 개발 및 디버깅 목적으로 사용
 */
export const registerEditorDebugFunctions = (): void => {
  if (typeof window !== 'undefined') {
    // @ts-ignore - 전역 디버그 함수는 타입 체크 무시
    window.clearEditorStorage = clearAllEditorStorage;
    // @ts-ignore - 전역 디버그 함수는 타입 체크 무시
    window.inspectEditorStorage = inspectEditorStorage;

    console.log('🛠️ [UTILITY] 에디터 디버그 함수 등록 완료');
    console.log('💡 [UTILITY] 사용법:');
    console.log('   - window.clearEditorStorage(): 모든 에디터 데이터 삭제');
    console.log('   - window.inspectEditorStorage(): 현재 저장소 상태 확인');
  }
};
//====여기까지 수정됨====
