//====여기부터 수정됨====
// 📁 store/editorCore/initialEditorCoreState.ts
import type { Container, ParagraphBlock } from '../shared/commonTypes';

// EditorCoreState 인터페이스 정의
// 1. 에디터 핵심 데이터를 관리하는 상태 구조
// 2. persist 미들웨어로 localStorage에 저장됨
export interface EditorCoreState {
  // 1. 컨테이너 목록 - 글의 구조(섹션)를 나타냄
  // 2. 각 컨테이너는 고유 ID, 이름, 순서를 가짐
  containers: Container[];

  // 1. 단락 목록 - 실제 글 내용을 담는 블록들
  // 2. 각 단락은 컨테이너에 할당되거나 미할당 상태
  paragraphs: ParagraphBlock[];

  // 1. 완성된 마크다운 콘텐츠 - 최종 출력물
  // 2. 컨테이너와 단락들이 결합되어 생성됨
  completedContent: string;

  // 1. 에디터 완료 여부 - 작업 완료 상태 표시
  // 2. true일 때 브릿지를 통해 다른 시스템으로 전송 가능
  isCompleted: boolean;

  // 1. 섹션 입력 필드들 - 구조 설정 단계에서 사용
  // 2. 사용자가 입력한 섹션명들을 임시 저장
  sectionInputs: string[];
}

// 초기 상태 정의
// 1. 모든 데이터가 깨끗하게 비워진 상태
// 2. 새로운 세션이 시작될 때 사용되는 기본값
export const initialEditorCoreState: EditorCoreState = {
  containers: [], // 1. 빈 컨테이너 배열 2. 구조가 아직 정의되지 않은 상태
  paragraphs: [], // 1. 빈 단락 배열 2. 작성된 내용이 없는 상태
  completedContent: '', // 1. 빈 완성 콘텐츠 2. 아직 글이 완성되지 않은 상태
  isCompleted: false, // 1. 미완료 상태 2. 에디터 작업이 진행 중
  sectionInputs: ['', '', '', ''], // 1. 기본 4개 빈 섹션 입력 필드 2. 구조 설정 단계 초기값
};

// 초기 상태 검증 함수
// 1. 초기 상태가 올바른 형태인지 확인
// 2. 타입 안전성과 데이터 무결성 보장
export const validateInitialEditorCoreState = (
  state: Partial<EditorCoreState>
): boolean => {
  try {
    // 1. 필수 속성들이 모두 존재하는지 확인
    const requiredKeys: (keyof EditorCoreState)[] = [
      'containers',
      'paragraphs',
      'completedContent',
      'isCompleted',
      'sectionInputs',
    ];

    for (const key of requiredKeys) {
      if (!(key in state)) {
        console.error(`❌ [CORE_STATE] 필수 속성 누락: ${key}`);
        return false;
      }
    }

    // 2. 배열 타입 검증
    if (!Array.isArray(state.containers)) {
      console.error('❌ [CORE_STATE] containers는 배열이어야 합니다');
      return false;
    }

    if (!Array.isArray(state.paragraphs)) {
      console.error('❌ [CORE_STATE] paragraphs는 배열이어야 합니다');
      return false;
    }

    if (!Array.isArray(state.sectionInputs)) {
      console.error('❌ [CORE_STATE] sectionInputs는 배열이어야 합니다');
      return false;
    }

    // 3. 기본 타입 검증
    if (typeof state.completedContent !== 'string') {
      console.error('❌ [CORE_STATE] completedContent는 문자열이어야 합니다');
      return false;
    }

    if (typeof state.isCompleted !== 'boolean') {
      console.error('❌ [CORE_STATE] isCompleted는 불린값이어야 합니다');
      return false;
    }

    console.log('✅ [CORE_STATE] 초기 상태 검증 통과');
    return true;
  } catch (error) {
    console.error('❌ [CORE_STATE] 초기 상태 검증 중 오류:', error);
    return false;
  }
};

// 안전한 초기 상태 생성 함수
// 1. 검증을 거친 안전한 초기 상태 반환
// 2. 오류 발생 시 하드코딩된 안전한 값 제공
export const createSafeInitialEditorCoreState = (): EditorCoreState => {
  try {
    // 1. 기본 초기 상태가 유효한지 검증
    if (validateInitialEditorCoreState(initialEditorCoreState)) {
      console.log('✅ [CORE_STATE] 기본 초기 상태 사용');
      return { ...initialEditorCoreState };
    }

    // 2. 검증 실패 시 하드코딩된 안전한 값 사용
    console.warn('⚠️ [CORE_STATE] 기본 초기 상태 검증 실패, 안전한 값 사용');
    return {
      containers: [],
      paragraphs: [],
      completedContent: '',
      isCompleted: false,
      sectionInputs: ['', '', '', ''],
    };
  } catch (error) {
    console.error('❌ [CORE_STATE] 안전한 초기 상태 생성 중 오류:', error);

    // 3. 모든 것이 실패할 경우 최후의 안전장치
    return {
      containers: [],
      paragraphs: [],
      completedContent: '',
      isCompleted: false,
      sectionInputs: ['', '', '', ''],
    };
  }
};

// 초기 상태 복원 함수
// 1. 현재 상태를 완전히 초기 상태로 되돌림
// 2. 에디터 완전 리셋이 필요할 때 사용
export const resetToInitialEditorCoreState = (): EditorCoreState => {
  console.log('🔄 [CORE_STATE] 초기 상태로 완전 복원');

  try {
    const freshInitialState = createSafeInitialEditorCoreState();

    // 1. 새로운 객체로 생성하여 참조 분리
    const resetState: EditorCoreState = {
      containers: [...freshInitialState.containers], // 새로운 배열 생성
      paragraphs: [...freshInitialState.paragraphs], // 새로운 배열 생성
      completedContent: freshInitialState.completedContent,
      isCompleted: freshInitialState.isCompleted,
      sectionInputs: [...freshInitialState.sectionInputs], // 새로운 배열 생성
    };

    console.log('✅ [CORE_STATE] 초기 상태 복원 완료');
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
    };
  }
};
//====여기까지 수정됨====
