//====여기부터 수정됨====
// 📁 store/editorUI/initialEditorUIState.ts

// 에디터 단계를 나타내는 타입
// 1. 'structure': 구조 설정 단계 - 섹션 이름 입력
// 2. 'writing': 글 작성 단계 - 실제 내용 작성
export type SubStep = 'structure' | 'writing';

// EditorUIState 인터페이스 정의
// 1. 에디터 사용자 인터페이스 상태를 관리
// 2. persist 미들웨어로 sessionStorage에 저장됨
export interface EditorUIState {
  // 1. 현재 에디터 단계 - 구조 설정 또는 글 작성
  // 2. 화면에 표시할 컴포넌트 결정
  currentSubStep: SubStep;

  // 1. 단계 전환 애니메이션 진행 중 여부
  // 2. 전환 중일 때 사용자 입력 차단
  isTransitioning: boolean;

  // 1. 현재 활성화된 단락의 ID
  // 2. 편집 중인 단락을 강조 표시
  activeParagraphId: string | null;

  // 1. 미리보기 패널 열림 상태
  // 2. 사용자가 결과물을 실시간으로 확인 가능
  isPreviewOpen: boolean;

  // 1. 선택된 단락들의 ID 목록
  // 2. 다중 선택을 통한 일괄 작업 지원
  selectedParagraphIds: string[];

  // 1. 드래그 앤 드롭 대상 컨테이너 ID
  // 2. 단락을 어느 컨테이너에 넣을지 결정
  targetContainerId: string;
}

// 초기 UI 상태 정의
// 1. 사용자가 에디터를 처음 열었을 때의 상태
// 2. 깨끗하고 직관적인 시작 환경 제공
export const initialEditorUIState: EditorUIState = {
  currentSubStep: 'structure', // 1. 구조 설정부터 시작 2. 논리적인 작업 순서
  isTransitioning: false, // 1. 전환 애니메이션 없음 2. 즉시 사용 가능한 상태
  activeParagraphId: null, // 1. 활성 단락 없음 2. 사용자가 선택할 때까지 대기
  isPreviewOpen: true, // 1. 미리보기 열림 2. 결과를 바로 확인 가능
  selectedParagraphIds: [], // 1. 선택된 단락 없음 2. 깔끔한 시작 상태
  targetContainerId: '', // 1. 드롭 대상 없음 2. 사용자 선택 대기
};

// UI 상태 검증 함수
// 1. UI 상태가 올바른 형태인지 확인
// 2. 타입 안전성과 사용자 경험 보장
export const validateInitialEditorUIState = (
  state: Partial<EditorUIState>
): boolean => {
  try {
    // 1. 필수 속성들이 모두 존재하는지 확인
    const requiredKeys: (keyof EditorUIState)[] = [
      'currentSubStep',
      'isTransitioning',
      'activeParagraphId',
      'isPreviewOpen',
      'selectedParagraphIds',
      'targetContainerId',
    ];

    for (const key of requiredKeys) {
      if (!(key in state)) {
        console.error(`❌ [UI_STATE] 필수 속성 누락: ${key}`);
        return false;
      }
    }

    // 2. currentSubStep 유효성 검증
    const validSubSteps: SubStep[] = ['structure', 'writing'];
    if (!validSubSteps.includes(state.currentSubStep as SubStep)) {
      console.error(
        '❌ [UI_STATE] currentSubStep은 structure 또는 writing이어야 합니다'
      );
      return false;
    }

    // 3. 불린 타입 검증
    if (typeof state.isTransitioning !== 'boolean') {
      console.error('❌ [UI_STATE] isTransitioning은 불린값이어야 합니다');
      return false;
    }

    if (typeof state.isPreviewOpen !== 'boolean') {
      console.error('❌ [UI_STATE] isPreviewOpen은 불린값이어야 합니다');
      return false;
    }

    // 4. 배열 타입 검증
    if (!Array.isArray(state.selectedParagraphIds)) {
      console.error('❌ [UI_STATE] selectedParagraphIds는 배열이어야 합니다');
      return false;
    }

    // 5. 문자열 타입 검증 (null 허용)
    if (
      state.activeParagraphId !== null &&
      typeof state.activeParagraphId !== 'string'
    ) {
      console.error(
        '❌ [UI_STATE] activeParagraphId는 문자열 또는 null이어야 합니다'
      );
      return false;
    }

    if (typeof state.targetContainerId !== 'string') {
      console.error('❌ [UI_STATE] targetContainerId는 문자열이어야 합니다');
      return false;
    }

    console.log('✅ [UI_STATE] UI 상태 검증 통과');
    return true;
  } catch (error) {
    console.error('❌ [UI_STATE] UI 상태 검증 중 오류:', error);
    return false;
  }
};

// 안전한 초기 UI 상태 생성 함수
// 1. 검증을 거친 안전한 초기 상태 반환
// 2. 오류 발생 시 하드코딩된 안전한 값 제공
export const createSafeInitialEditorUIState = (): EditorUIState => {
  try {
    // 1. 기본 초기 상태가 유효한지 검증
    if (validateInitialEditorUIState(initialEditorUIState)) {
      console.log('✅ [UI_STATE] 기본 초기 UI 상태 사용');
      return { ...initialEditorUIState };
    }

    // 2. 검증 실패 시 하드코딩된 안전한 값 사용
    console.warn('⚠️ [UI_STATE] 기본 초기 UI 상태 검증 실패, 안전한 값 사용');
    return {
      currentSubStep: 'structure',
      isTransitioning: false,
      activeParagraphId: null,
      isPreviewOpen: true,
      selectedParagraphIds: [],
      targetContainerId: '',
    };
  } catch (error) {
    console.error('❌ [UI_STATE] 안전한 초기 UI 상태 생성 중 오류:', error);

    // 3. 모든 것이 실패할 경우 최후의 안전장치
    return {
      currentSubStep: 'structure',
      isTransitioning: false,
      activeParagraphId: null,
      isPreviewOpen: true,
      selectedParagraphIds: [],
      targetContainerId: '',
    };
  }
};

// UI 상태 복원 함수
// 1. 현재 UI 상태를 완전히 초기 상태로 되돌림
// 2. 에디터 UI 완전 리셋이 필요할 때 사용
export const resetToInitialEditorUIState = (): EditorUIState => {
  console.log('🔄 [UI_STATE] 초기 UI 상태로 완전 복원');

  try {
    const freshInitialState = createSafeInitialEditorUIState();

    // 1. 새로운 객체로 생성하여 참조 분리
    const resetState: EditorUIState = {
      currentSubStep: freshInitialState.currentSubStep,
      isTransitioning: freshInitialState.isTransitioning,
      activeParagraphId: freshInitialState.activeParagraphId,
      isPreviewOpen: freshInitialState.isPreviewOpen,
      selectedParagraphIds: [...freshInitialState.selectedParagraphIds], // 새로운 배열 생성
      targetContainerId: freshInitialState.targetContainerId,
    };

    console.log('✅ [UI_STATE] 초기 UI 상태 복원 완료');
    return resetState;
  } catch (error) {
    console.error('❌ [UI_STATE] 초기 UI 상태 복원 중 오류:', error);

    // 오류 시 하드코딩된 값 반환
    return {
      currentSubStep: 'structure',
      isTransitioning: false,
      activeParagraphId: null,
      isPreviewOpen: true,
      selectedParagraphIds: [],
      targetContainerId: '',
    };
  }
};

// 특정 단계로 UI 상태를 초기화하는 함수
// 1. 구조 설정 또는 글 작성 단계로 직접 이동
// 2. 해당 단계에 맞는 초기 상태로 설정
export const createInitialUIStateForStep = (
  targetStep: SubStep
): EditorUIState => {
  console.log(`🎯 [UI_STATE] ${targetStep} 단계 초기 상태 생성`);

  try {
    const baseState = createSafeInitialEditorUIState();

    // 1. 대상 단계에 따른 상태 조정
    const stepSpecificState: EditorUIState = {
      ...baseState,
      currentSubStep: targetStep,
      isTransitioning: false, // 즉시 사용 가능한 상태
      activeParagraphId: null, // 단계 전환 시 활성 단락 해제
      selectedParagraphIds: [], // 단계 전환 시 선택 해제
      targetContainerId: '', // 단계 전환 시 드롭 대상 해제
      isPreviewOpen: targetStep === 'writing', // 글 작성 단계에서만 미리보기 열기
    };

    console.log(`✅ [UI_STATE] ${targetStep} 단계 초기 상태 생성 완료`);
    return stepSpecificState;
  } catch (error) {
    console.error(
      `❌ [UI_STATE] ${targetStep} 단계 초기 상태 생성 중 오류:`,
      error
    );

    // 오류 시 기본 초기 상태 반환
    return createSafeInitialEditorUIState();
  }
};
//====여기까지 수정됨====
