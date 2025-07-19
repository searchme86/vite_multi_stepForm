// 📁 store/editorCore/initialEditorCoreState.ts
import type {
  Container,
  ParagraphBlock,
  ContainerMoveHistory,
} from '../shared/commonTypes';

// EditorCoreState 인터페이스 정의
export interface EditorCoreState {
  containers: Container[];
  paragraphs: ParagraphBlock[];
  completedContent: string;
  isCompleted: boolean;
  sectionInputs: string[];
  containerMoveHistory: ContainerMoveHistory;
}

// 🔧 템플릿 데이터 생성 함수 (분리됨 - 필요시에만 사용)
function createTemplateDataForDemonstration(): {
  containers: Container[];
  paragraphs: ParagraphBlock[];
  completedContent: string;
} {
  const currentTimestamp = new Date();

  console.log('📝 [TEMPLATE] 데모용 템플릿 데이터 생성 (초기 상태와 분리됨)');

  const templateContainers: Container[] = [
    {
      id: 'demo-intro',
      name: '소개 (데모)',
      order: 1,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    },
    {
      id: 'demo-content',
      name: '주요 내용 (데모)',
      order: 2,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    },
    {
      id: 'demo-conclusion',
      name: '결론 (데모)',
      order: 3,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    },
  ];

  const templateParagraphs: ParagraphBlock[] = [
    {
      id: 'demo-intro-paragraph-1',
      content: '이곳에 소개 내용을 작성해주세요. (데모용 텍스트)',
      containerId: 'demo-intro',
      order: 1,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    },
    {
      id: 'demo-content-paragraph-1',
      content: '주요 내용의 첫 번째 문단입니다. (데모용 텍스트)',
      containerId: 'demo-content',
      order: 1,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    },
    {
      id: 'demo-conclusion-paragraph-1',
      content: '결론 부분입니다. (데모용 텍스트)',
      containerId: 'demo-conclusion',
      order: 1,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    },
  ];

  const completedContent = `# 소개 (데모)

이곳에 소개 내용을 작성해주세요. (데모용 텍스트)

# 주요 내용 (데모)

주요 내용의 첫 번째 문단입니다. (데모용 텍스트)

# 결론 (데모)

결론 부분입니다. (데모용 텍스트)`;

  console.log('✅ [TEMPLATE] 데모용 템플릿 데이터 생성 완료:', {
    containerCount: templateContainers.length,
    paragraphCount: templateParagraphs.length,
    contentLength: completedContent.length,
  });

  return {
    containers: templateContainers,
    paragraphs: templateParagraphs,
    completedContent,
  };
}

// ✅ 수정된 초기 상태 - 에러 방지를 위해 완전히 빈 상태로 설정
export const initialEditorCoreState: EditorCoreState = (() => {
  console.log('🔧 [INITIAL_STATE] 에러 방지 초기 상태 생성 시작');

  const cleanInitialState: EditorCoreState = {
    containers: [], // ✅ 빈 배열 - 템플릿 데이터 없음
    paragraphs: [], // ✅ 빈 배열 - 템플릿 데이터 없음
    completedContent: '', // ✅ 빈 문자열
    isCompleted: false, // ✅ 미완료 상태
    sectionInputs: ['', '', '', ''], // ✅ 빈 입력 필드 4개
    containerMoveHistory: [], // ✅ 빈 이동 이력
  };

  console.log('✅ [INITIAL_STATE] 에러 방지 초기 상태 생성 완료:', {
    containerCount: cleanInitialState.containers.length,
    paragraphCount: cleanInitialState.paragraphs.length,
    hasContent: cleanInitialState.completedContent.length > 0,
    isCompleted: cleanInitialState.isCompleted,
    sectionInputCount: cleanInitialState.sectionInputs.length,
    moveHistoryCount: cleanInitialState.containerMoveHistory.length,
    isCleanState: true,
  });

  return cleanInitialState;
})();

// 🆕 템플릿 데이터가 필요한 경우를 위한 별도 함수
export const createInitialStateWithTemplate = (): EditorCoreState => {
  console.log('📝 [TEMPLATE_STATE] 템플릿 포함 초기 상태 생성');

  const templateData = createTemplateDataForDemonstration();

  const templateInitialState: EditorCoreState = {
    containers: templateData.containers,
    paragraphs: templateData.paragraphs,
    completedContent: templateData.completedContent,
    isCompleted: false,
    sectionInputs: ['소개', '주요 내용', '결론', ''],
    containerMoveHistory: [],
  };

  console.log('✅ [TEMPLATE_STATE] 템플릿 포함 초기 상태 생성 완료');

  return templateInitialState;
};

// 초기 상태 검증 함수 (강화됨)
export const validateInitialEditorCoreState = (
  state: Partial<EditorCoreState>
): boolean => {
  try {
    console.log('🔍 [CORE_STATE] 초기 상태 검증 시작:', state);

    const requiredKeys: (keyof EditorCoreState)[] = [
      'containers',
      'paragraphs',
      'completedContent',
      'isCompleted',
      'sectionInputs',
      'containerMoveHistory',
    ];

    // 필수 속성 존재 여부 확인
    for (const key of requiredKeys) {
      if (!(key in state)) {
        console.error(`❌ [CORE_STATE] 필수 속성 누락: ${key}`);
        return false;
      }
    }

    // 배열 타입 검증
    const arrayKeys: (keyof EditorCoreState)[] = [
      'containers',
      'paragraphs',
      'sectionInputs',
      'containerMoveHistory',
    ];

    for (const key of arrayKeys) {
      if (!Array.isArray(state[key])) {
        console.error(
          `❌ [CORE_STATE] ${key}는 배열이어야 합니다:`,
          typeof state[key]
        );
        return false;
      }
    }

    // 문자열 타입 검증
    if (typeof state.completedContent !== 'string') {
      console.error(
        '❌ [CORE_STATE] completedContent는 문자열이어야 합니다:',
        typeof state.completedContent
      );
      return false;
    }

    // 불린 타입 검증
    if (typeof state.isCompleted !== 'boolean') {
      console.error(
        '❌ [CORE_STATE] isCompleted는 불린값이어야 합니다:',
        typeof state.isCompleted
      );
      return false;
    }

    // 각 배열 요소 유효성 검증 (옵션)
    const { containers, paragraphs, sectionInputs } = state;

    // 컨테이너 검증
    if (Array.isArray(containers)) {
      const invalidContainers = containers.filter((container) => {
        return !(
          container &&
          typeof container === 'object' &&
          typeof container.id === 'string' &&
          typeof container.name === 'string' &&
          typeof container.order === 'number'
        );
      });

      if (invalidContainers.length > 0) {
        console.warn(
          '⚠️ [CORE_STATE] 유효하지 않은 컨테이너 발견:',
          invalidContainers.length
        );
      }
    }

    // 단락 검증
    if (Array.isArray(paragraphs)) {
      const invalidParagraphs = paragraphs.filter((paragraph) => {
        return !(
          paragraph &&
          typeof paragraph === 'object' &&
          typeof paragraph.id === 'string' &&
          typeof paragraph.content === 'string'
        );
      });

      if (invalidParagraphs.length > 0) {
        console.warn(
          '⚠️ [CORE_STATE] 유효하지 않은 단락 발견:',
          invalidParagraphs.length
        );
      }
    }

    // 섹션 입력 검증
    if (Array.isArray(sectionInputs)) {
      const invalidInputs = sectionInputs.filter(
        (input) => typeof input !== 'string'
      );

      if (invalidInputs.length > 0) {
        console.warn(
          '⚠️ [CORE_STATE] 유효하지 않은 섹션 입력 발견:',
          invalidInputs.length
        );
      }
    }

    console.log('✅ [CORE_STATE] 초기 상태 검증 통과');
    return true;
  } catch (error) {
    console.error('❌ [CORE_STATE] 초기 상태 검증 중 오류:', error);
    return false;
  }
};

// 안전한 초기 상태 생성 함수 (강화됨)
export const createSafeInitialEditorCoreState = (): EditorCoreState => {
  try {
    console.log('🛡️ [CORE_STATE] 안전한 초기 상태 생성 시작');

    // 기본 초기 상태 검증
    if (validateInitialEditorCoreState(initialEditorCoreState)) {
      console.log('✅ [CORE_STATE] 기본 초기 상태 사용');
      return { ...initialEditorCoreState };
    }

    console.warn(
      '⚠️ [CORE_STATE] 기본 초기 상태 검증 실패, 하드코딩된 안전한 값 사용'
    );

    // 하드코딩된 안전한 상태
    const safeState: EditorCoreState = {
      containers: [],
      paragraphs: [],
      completedContent: '',
      isCompleted: false,
      sectionInputs: ['', '', '', ''],
      containerMoveHistory: [],
    };

    console.log('✅ [CORE_STATE] 하드코딩된 안전한 상태 생성 완료');
    return safeState;
  } catch (error) {
    console.error('❌ [CORE_STATE] 안전한 초기 상태 생성 중 오류:', error);

    // 최후의 안전장치
    return {
      containers: [],
      paragraphs: [],
      completedContent: '',
      isCompleted: false,
      sectionInputs: ['', '', '', ''],
      containerMoveHistory: [],
    };
  }
};

// 초기 상태 복원 함수 (강화됨)
export const resetToInitialEditorCoreState = (): EditorCoreState => {
  console.log('🔄 [CORE_STATE] 초기 상태로 완전 복원');

  try {
    const freshInitialState = createSafeInitialEditorCoreState();

    // 새로운 객체로 생성하여 참조 분리
    const resetState: EditorCoreState = {
      containers: [...freshInitialState.containers],
      paragraphs: [...freshInitialState.paragraphs],
      completedContent: freshInitialState.completedContent,
      isCompleted: freshInitialState.isCompleted,
      sectionInputs: [...freshInitialState.sectionInputs],
      containerMoveHistory: [...freshInitialState.containerMoveHistory],
    };

    console.log('✅ [CORE_STATE] 초기 상태 복원 완료:', {
      containerCount: resetState.containers.length,
      paragraphCount: resetState.paragraphs.length,
      sectionInputCount: resetState.sectionInputs.length,
    });

    return resetState;
  } catch (error) {
    console.error('❌ [CORE_STATE] 초기 상태 복원 중 오류:', error);

    // 오류 시 하드코딩된 값 반환
    return {
      containers: [],
      paragraphs: [],
      completedContent: '',
      isCompleted: false,
      sectionInputs: ['', '', '', ''],
      containerMoveHistory: [],
    };
  }
};

// 🆕 완전히 비운 상태 생성 함수 (resetEditorState에서 사용)
export const createEmptyEditorCoreState = (): EditorCoreState => {
  console.log('🧹 [CORE_STATE] 완전히 빈 에디터 상태 생성');

  const emptyState: EditorCoreState = {
    containers: [], // 완전히 빈 배열
    paragraphs: [], // 완전히 빈 배열
    completedContent: '', // 빈 문자열
    isCompleted: false, // 미완료
    sectionInputs: ['', '', '', ''], // 빈 입력 필드만 유지
    containerMoveHistory: [], // 빈 이동 이력
  };

  console.log('✅ [CORE_STATE] 완전히 빈 에디터 상태 생성 완료:', {
    isAllEmpty:
      emptyState.containers.length === 0 &&
      emptyState.paragraphs.length === 0 &&
      emptyState.completedContent === '' &&
      emptyState.containerMoveHistory.length === 0,
    sectionInputCount: emptyState.sectionInputs.length,
  });

  return emptyState;
};

// 🆕 특정 섹션 입력으로 빈 상태 생성 함수
export const createEmptyStateWithSectionInputs = (
  sectionInputs: string[]
): EditorCoreState => {
  const validSectionInputs = Array.isArray(sectionInputs)
    ? sectionInputs.map((input) => (typeof input === 'string' ? input : ''))
    : ['', '', '', ''];

  console.log('🧹 [CORE_STATE] 섹션 입력 보존하여 빈 상태 생성:', {
    sectionInputs: validSectionInputs,
  });

  const emptyStateWithInputs: EditorCoreState = {
    containers: [], // 완전히 빈 배열
    paragraphs: [], // 완전히 빈 배열
    completedContent: '', // 빈 문자열
    isCompleted: false, // 미완료
    sectionInputs: validSectionInputs, // 전달받은 입력 보존
    containerMoveHistory: [], // 빈 이동 이력
  };

  console.log('✅ [CORE_STATE] 섹션 입력 보존 빈 상태 생성 완료');

  return emptyStateWithInputs;
};

// 🆕 상태 유형 확인 함수
export const getStateType = (state: EditorCoreState): string => {
  const hasContainers = state.containers.length > 0;
  const hasParagraphs = state.paragraphs.length > 0;
  const hasContent = state.completedContent.length > 0;
  const hasSectionInputs = state.sectionInputs.some(
    (input) => input.trim().length > 0
  );

  if (!hasContainers && !hasParagraphs && !hasContent) {
    return hasSectionInputs ? 'empty-with-inputs' : 'completely-empty';
  }

  if (hasContainers && hasParagraphs && hasContent) {
    return 'full-with-content';
  }

  return 'partial-state';
};

// 🆕 상태 디버깅 정보 함수
export const getStateDebugInfo = (state: EditorCoreState) => {
  return {
    type: getStateType(state),
    containerCount: state.containers.length,
    paragraphCount: state.paragraphs.length,
    contentLength: state.completedContent.length,
    sectionInputCount: state.sectionInputs.length,
    moveHistoryCount: state.containerMoveHistory.length,
    validSectionInputs: state.sectionInputs.filter(
      (input) => input.trim().length > 0
    ),
    isCompleted: state.isCompleted,
    timestamp: new Date().toISOString(),
  };
};
