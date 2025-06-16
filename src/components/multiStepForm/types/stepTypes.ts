// src/types/stepTypes.ts
// 멀티스텝 폼의 스텝 관리를 위한 타입 정의 및 유틸리티 함수들
// 각 스텝의 컴포넌트, 설정, 네비게이션 기능을 제공

import React from 'react';
// 각 스텝별 컴포넌트들을 import - 실제 렌더링될 컴포넌트들
import UserInfoStepContainer from '../steps/stepsSections/userInfoStep/UserInfoStepContainer';
import BlogBasicStepContainer from '../steps/stepsSections/blogBasicStep/BlogBasicStepContainer';
import BlogContentStep from '../steps/blog-content-step';
// import BlogMediaStepContainer from '../steps/blog-media-step';
// import BlogMediaStepContainer from '../steps/blog-media-step';
import ModularBlogEditorContainer from '../../moduleEditor/ModularBlogEditorContainer';
import BlogMediaStepContainer from '../steps/stepsSections/blogMediaStep/BlogMediaStepContainer';

/**
 * 스텝별 컴포넌트들을 매핑하는 객체
 * 목적: 스텝 번호에 따라 동적으로 컴포넌트를 렌더링하기 위함
 * as const: 타입을 리터럴 타입으로 고정하여 타입 안전성 확보
 */
export const STEP_COMPONENTS = {
  UserInfoStepContainer, // 1단계: 사용자 정보 입력 컴포넌트
  BlogBasicStepContainer, // 2단계: 블로그 기본 정보 입력 컴포넌트
  ModularBlogEditorContainer, // 4단계: 고급 에디터 컴포넌트
  BlogMediaStepContainer, // 5단계: 미디어 업로드 컴포넌트
  BlogContentStep, // 3단계: 블로그 콘텐츠 작성 컴포넌트
} as const;

/**
 * 스텝 컴포넌트 이름의 타입
 * keyof typeof를 사용하여 STEP_COMPONENTS의 키들을 타입으로 추출
 */
export type StepComponentName = keyof typeof STEP_COMPONENTS;

/**
 * 스텝 설정 객체를 생성하는 제네릭 헬퍼 함수
 * 목적: 타입 안전성을 보장하면서 스텝 설정 객체를 생성
 * @param stepConfigurationData - 스텝별 설정 데이터 (제목, 설명, 컴포넌트, 유효성 검사 필드)
 * @returns 입력받은 설정 데이터를 그대로 반환 (타입 체크 목적)
 */
const createStepConfig = <
  T extends Record<
    number,
    {
      title: string; // 스텝의 제목
      description: string; // 스텝의 설명
      component: StepComponentName; // 렌더링할 컴포넌트 이름
      validation: readonly string[]; // 유효성 검사할 필드들
    }
  >
>(
  stepConfigurationData: T // 매개변수명을 구체적으로 명시: 스텝 설정 데이터
) => stepConfigurationData; // 타입 체크 후 그대로 반환

/**
 * 전체 스텝들의 설정 정보
 * 목적: 각 스텝별 메타데이터 (제목, 설명, 컴포넌트, 유효성 검사 필드) 정의
 * 숫자 키를 사용하여 스텝 순서를 명확히 함
 */
export const STEP_CONFIG = createStepConfig({
  1: {
    title: '유저 정보 입력', // 1단계 제목
    description: '기본 사용자 정보를 입력합니다', // 1단계 설명 (접근성을 위해 사용)
    component: 'UserInfoStepContainer', // 렌더링할 컴포넌트 이름
    validation: ['nickname', 'emailPrefix', 'emailDomain'] as const, // 유효성 검사 대상 필드들
  },
  2: {
    title: '블로그 기본 정보', // 2단계 제목
    description: '블로그 제목과 설명을 입력합니다', // 2단계 설명
    component: 'BlogBasicStepContainer', // 렌더링할 컴포넌트 이름
    validation: ['title', 'description'] as const, // 블로그 제목과 설명 필드 검사
  },
  3: {
    title: '블로그 컨텐츠', // 3단계 제목
    description: '블로그 내용을 작성합니다', // 3단계 설명
    component: 'BlogContentStep', // 렌더링할 컴포넌트 이름
    validation: ['content'] as const, // 블로그 내용 필드 검사
  },
  4: {
    title: '모듈화 에디터', // 4단계 제목
    description: '고급 에디터로 내용을 편집합니다', // 4단계 설명
    component: 'ModularBlogEditorContainer', // 렌더링할 컴포넌트 이름
    validation: ['editorCompleted'] as const, // 에디터 완료 상태 검사
  },
  5: {
    title: '블로그 미디어', // 5단계 제목
    description: '이미지와 미디어를 추가합니다', // 5단계 설명
    component: 'BlogMediaStepContainer', // 렌더링할 컴포넌트 이름
    validation: [] as const, // 선택 사항이므로 유효성 검사 없음
  },
});

/**
 * 스텝 번호 타입 - STEP_CONFIG의 키들을 타입으로 추출
 * 1 | 2 | 3 | 4 | 5 형태의 유니온 타입이 됨
 */
export type StepNumber = keyof typeof STEP_CONFIG;

/**
 * 스텝 설정 전체의 타입
 */
export type StepConfig = typeof STEP_CONFIG;

/**
 * 개별 스텝 정보의 타입
 */
export type StepInfo = StepConfig[StepNumber];

/**
 * 주어진 숫자가 유효한 스텝 번호인지 확인하는 타입 가드 함수
 * 목적: 런타임에 스텝 번호의 유효성을 검사하고 타입을 좁힘
 * @param targetStepNumber - 검사할 스텝 번호 (any number)
 * @returns 유효한 스텝 번호인지 여부 (타입 가드)
 */
export const isValidStepNumber = (
  targetStepNumber: number
): targetStepNumber is StepNumber => {
  // in 연산자를 사용하여 STEP_CONFIG에 해당 키가 존재하는지 확인
  // 이 방법이 Object.hasOwnProperty보다 간결하고 타입 안전함
  return targetStepNumber in STEP_CONFIG;
};

/**
 * 스텝 컴포넌트 이름으로 실제 컴포넌트를 가져오는 함수
 * 목적: 컴포넌트 이름 문자열을 실제 React 컴포넌트로 변환
 * @param stepComponentName - 가져올 컴포넌트의 이름
 * @returns 해당하는 React 컴포넌트
 */
export const getStepComponent = (stepComponentName: StepComponentName) => {
  // 구조분해할당을 사용하여 STEP_COMPONENTS에서 해당 컴포넌트 추출
  // 점 연산자 대신 구조분해할당을 사용하는 이유: 동적 키 접근과 가독성 향상
  const { [stepComponentName]: selectedComponent } = STEP_COMPONENTS;
  return selectedComponent;
};

/**
 * 스텝 번호에 해당하는 컴포넌트를 렌더링하는 함수
 * 목적: 현재 스텝에 맞는 컴포넌트를 접근성 속성과 함께 렌더링
 * @param currentStepNumber - 렌더링할 스텝 번호
 * @returns 접근성 속성이 포함된 React 엘리먼트
 */
export const renderStepComponent = (currentStepNumber: StepNumber) => {
  // STEP_CONFIG에서 현재 스텝의 컴포넌트 이름 추출
  // 구조분해할당으로 component 속성을 componentName으로 별칭 지정
  const { component: componentName } = STEP_CONFIG[currentStepNumber];

  // STEP_COMPONENTS에서 실제 컴포넌트 추출
  // 동적 키 접근을 위해 계산된 속성명 구문 사용
  const { [componentName]: SelectedComponent } = STEP_COMPONENTS;

  // 웹 접근성을 위한 ARIA 속성들 정의
  // Record<string, unknown> 타입 사용으로 유연한 props 전달 가능
  const accessibilityProps: Record<string, unknown> = {
    'aria-label': `스텝 ${currentStepNumber} 컴포넌트`, // 스크린 리더용 레이블
    role: 'main', // 메인 콘텐츠 영역임을 명시
    'aria-live': 'polite', // 콘텐츠 변경 시 스크린 리더에 알림
    'aria-describedby': `step-${currentStepNumber}-description`, // 스텝 설명과 연결
  };

  // React.createElement를 사용하여 동적으로 컴포넌트 생성
  // JSX 대신 사용하는 이유: 컴포넌트가 런타임에 결정되기 때문
  // Record<string, unknown> 타입으로 안전한 props 전달
  return React.createElement(SelectedComponent, accessibilityProps);
};

/**
 * 특정 스텝의 전체 설정 정보를 가져오는 함수
 * 목적: 스텝의 모든 메타데이터 (제목, 설명, 컴포넌트, 유효성 검사)를 한 번에 조회
 * @param targetStepNumber - 조회할 스텝 번호
 * @returns 해당 스텝의 설정 객체
 */
export const getStepConfig = (targetStepNumber: StepNumber) => {
  // STEP_CONFIG에서 해당 스텝의 설정 정보 추출
  // 변수명을 구체적으로 지정하여 데이터의 의미 명확화
  const stepConfigurationData = STEP_CONFIG[targetStepNumber];
  return stepConfigurationData;
};

/**
 * 특정 스텝의 제목을 가져오는 함수
 * 목적: UI에서 스텝 제목을 표시할 때 사용
 * @param targetStepNumber - 조회할 스텝 번호
 * @returns 해당 스텝의 제목 문자열
 */
export const getStepTitle = (targetStepNumber: StepNumber): string => {
  // 구조분해할당으로 title 속성만 추출하고 별칭 지정
  // 점 연산자 대신 사용하는 이유: 변수명으로 의도 명확화
  const { title: stepTitle } = STEP_CONFIG[targetStepNumber];
  return stepTitle;
};

/**
 * 특정 스텝의 설명을 가져오는 함수
 * 목적: UI에서 스텝 설명을 표시하거나 접근성 속성으로 사용
 * @param targetStepNumber - 조회할 스텝 번호
 * @returns 해당 스텝의 설명 문자열
 */
export const getStepDescription = (targetStepNumber: StepNumber): string => {
  // 구조분해할당으로 description 속성만 추출하고 의미있는 이름으로 별칭
  const { description: stepDescription } = STEP_CONFIG[targetStepNumber];
  return stepDescription;
};

/**
 * 특정 스텝의 컴포넌트 이름을 가져오는 함수
 * 목적: 동적 컴포넌트 로딩이나 라우팅에서 사용
 * @param targetStepNumber - 조회할 스텝 번호
 * @returns 해당 스텝의 컴포넌트 이름
 */
export const getStepComponentName = (
  targetStepNumber: StepNumber
): StepComponentName => {
  // 컴포넌트 속성만 추출하여 명확한 이름으로 별칭
  const { component: componentName } = STEP_CONFIG[targetStepNumber];
  return componentName;
};

/**
 * 특정 스텝의 유효성 검사 필드 목록을 가져오는 함수
 * 목적: 폼 유효성 검사 시 어떤 필드들을 검사해야 하는지 확인
 * @param targetStepNumber - 조회할 스텝 번호
 * @returns 유효성 검사가 필요한 필드명들의 읽기 전용 배열
 */
export const getStepValidationFields = (
  targetStepNumber: StepNumber
): readonly string[] => {
  // validation 속성을 의미있는 이름으로 추출
  const { validation: validationFields } = STEP_CONFIG[targetStepNumber];
  return validationFields;
};

/**
 * 모든 스텝 번호들을 정렬된 배열로 가져오는 함수
 * 목적: 스텝 네비게이션, 진행률 계산 등에서 전체 스텝 목록이 필요할 때 사용
 * @returns 정렬된 스텝 번호 배열
 */
export const getStepNumbers = (): StepNumber[] => {
  // 결과를 담을 배열 초기화 - 의미있는 변수명 사용
  const sortedStepNumbers: StepNumber[] = [];

  // STEP_CONFIG의 모든 키를 순회
  // for...in 루프를 사용하는 이유: 객체의 키를 순회하는 가장 직관적인 방법
  for (const stepKey in STEP_CONFIG) {
    // 문자열 키를 숫자로 변환
    // parseInt(key, 10) 사용 이유: Number()보다 명시적이고 radix 지정으로 안전함
    const numericStepKey = parseInt(stepKey, 10);

    // 유효한 스텝 번호인지 타입 가드로 검증
    // 이 검사를 통과하면 TypeScript가 numericStepKey를 StepNumber 타입으로 인식
    if (isValidStepNumber(numericStepKey)) {
      // 검증된 스텝 번호를 배열에 추가
      sortedStepNumbers.push(numericStepKey);
    }
  }

  // 스텝 번호들을 오름차순으로 정렬
  // (a, b) => a - b: 숫자 오름차순 정렬 함수
  // sort() 기본 정렬은 문자열 기준이므로 명시적 비교 함수 제공
  return sortedStepNumbers.sort(
    (firstStep, secondStep) => firstStep - secondStep
  );
};

/**
 * 가장 작은 스텝 번호 (시작 스텝)를 가져오는 함수
 * 목적: 폼 초기화 시 시작 스텝을 결정하거나 최소 범위 검사에 사용
 * @returns 최소 스텝 번호
 */
export const getMinStep = (): StepNumber => {
  // 모든 스텝 번호를 정렬된 상태로 가져옴
  const availableStepNumbers = getStepNumbers();

  // 배열의 첫 번째 요소가 최소값 (이미 정렬됨)
  // 구조분해할당으로 첫 번째 요소만 추출
  const [firstStepNumber] = availableStepNumbers;

  // 정상적으로 스텝이 존재하는 경우
  if (firstStepNumber !== undefined) {
    return firstStepNumber;
  }

  // fallback: getStepNumbers()가 빈 배열을 반환한 경우 (이론적으로 불가능)
  // STEP_CONFIG에서 직접 첫 번째 키를 찾아 사용
  const configKeys = Object.keys(STEP_CONFIG);
  const [firstConfigKey] = configKeys;

  // 문자열 키를 숫자로 변환
  const firstAvailableStep = parseInt(firstConfigKey, 10);

  // 변환된 값이 유효한 스텝인지 검증
  if (isValidStepNumber(firstAvailableStep)) {
    return firstAvailableStep;
  }

  // 모든 fallback이 실패한 경우 (설정 오류)
  // 명시적 에러를 발생시켜 문제 상황을 개발자에게 알림
  throw new Error('STEP_CONFIG에 유효한 스텝이 없습니다');
};

/**
 * 가장 큰 스텝 번호 (마지막 스텝)를 가져오는 함수
 * 목적: 스텝 완료 여부 확인이나 최대 범위 검사에 사용
 * @returns 최대 스텝 번호
 */
export const getMaxStep = (): StepNumber => {
  // 모든 스텝 번호를 정렬된 상태로 가져옴
  const availableStepNumbers = getStepNumbers();

  // 배열의 길이를 구해서 마지막 인덱스 계산에 사용
  const totalStepsCount = availableStepNumbers.length;

  // 배열의 마지막 요소가 최대값 (이미 정렬됨)
  // length - 1이 마지막 인덱스
  const lastStepNumber = availableStepNumbers[totalStepsCount - 1];

  // 정상적으로 스텝이 존재하는 경우
  if (lastStepNumber !== undefined) {
    return lastStepNumber;
  }

  // fallback: getStepNumbers()가 빈 배열을 반환한 경우
  // STEP_CONFIG에서 직접 마지막 키를 찾아 사용
  const configKeys = Object.keys(STEP_CONFIG);
  const totalConfigKeys = configKeys.length;
  const lastConfigKey = configKeys[totalConfigKeys - 1];

  // 문자열 키를 숫자로 변환
  const lastAvailableStep = parseInt(lastConfigKey, 10);

  // 변환된 값이 유효한 스텝인지 검증
  if (isValidStepNumber(lastAvailableStep)) {
    return lastAvailableStep;
  }

  // 모든 fallback이 실패한 경우
  throw new Error('STEP_CONFIG에 유효한 스텝이 없습니다');
};

/**
 * 전체 스텝 개수를 가져오는 함수
 * 목적: 진행률 계산이나 UI에서 "n개 중 m번째" 같은 표시에 사용
 * @returns 총 스텝 개수
 */
export const getTotalSteps = (): number => {
  // 모든 스텝 번호 배열을 가져옴
  const availableStepNumbers = getStepNumbers();

  // 배열의 길이가 곧 스텝 개수
  // 구조분해할당으로 length 속성을 의미있는 이름으로 추출
  const { length: totalStepsCount } = availableStepNumbers;
  return totalStepsCount;
};

/**
 * 현재 스텝의 다음 스텝을 가져오는 함수
 * 목적: "다음" 버튼 클릭 시 이동할 스텝 결정
 * @param currentStepNumber - 현재 스텝 번호
 * @returns 다음 스텝 번호 (마지막 스텝인 경우 null)
 */
export const getNextStep = (
  currentStepNumber: StepNumber
): StepNumber | null => {
  // 모든 스텝 번호를 정렬된 배열로 가져옴
  const availableStepNumbers = getStepNumbers();

  // 현재 스텝이 배열에서 몇 번째 위치인지 찾음
  // indexOf 사용 이유: 순서가 중요한 스텝 네비게이션에서 인덱스 기반 접근 필요
  const currentStepIndex = availableStepNumbers.indexOf(currentStepNumber);

  // 다음 스텝의 인덱스 계산
  const nextStepIndex = currentStepIndex + 1;

  // 전체 스텝 개수로 범위 체크
  const { length: totalStepsCount } = availableStepNumbers;

  // 다음 스텝이 존재하는지 확인 후 반환
  // 삼항 연산자 사용: 간단한 조건부 반환에 적합
  return nextStepIndex < totalStepsCount
    ? availableStepNumbers[nextStepIndex]
    : null;
};

/**
 * 현재 스텝의 이전 스텝을 가져오는 함수
 * 목적: "이전" 버튼 클릭 시 이동할 스텝 결정
 * @param currentStepNumber - 현재 스텝 번호
 * @returns 이전 스텝 번호 (첫 번째 스텝인 경우 null)
 */
export const getPreviousStep = (
  currentStepNumber: StepNumber
): StepNumber | null => {
  // 모든 스텝 번호를 정렬된 배열로 가져옴
  const availableStepNumbers = getStepNumbers();

  // 현재 스텝의 배열 내 위치 찾기
  const currentStepIndex = availableStepNumbers.indexOf(currentStepNumber);

  // 이전 스텝의 인덱스 계산
  const previousStepIndex = currentStepIndex - 1;

  // 이전 스텝이 존재하는지 확인 (0 이상이어야 유효한 인덱스)
  return previousStepIndex >= 0
    ? availableStepNumbers[previousStepIndex]
    : null;
};

/**
 * 주어진 스텝이 마지막 스텝인지 확인하는 함수
 * 목적: "완료" 버튼 표시 여부나 최종 제출 로직 판단에 사용
 * @param targetStepNumber - 확인할 스텝 번호
 * @returns 마지막 스텝 여부
 */
export const isLastStep = (targetStepNumber: StepNumber): boolean => {
  // 최대 스텝 번호를 가져와서 비교
  const maximumStepNumber = getMaxStep();

  // 단순 동등 비교로 마지막 스텝 여부 확인
  return targetStepNumber === maximumStepNumber;
};

/**
 * 주어진 스텝이 첫 번째 스텝인지 확인하는 함수
 * 목적: "이전" 버튼 비활성화 여부 판단에 사용
 * @param targetStepNumber - 확인할 스텝 번호
 * @returns 첫 번째 스텝 여부
 */
export const isFirstStep = (targetStepNumber: StepNumber): boolean => {
  // 최소 스텝 번호를 가져와서 비교
  const minimumStepNumber = getMinStep();

  // 단순 동등 비교로 첫 번째 스텝 여부 확인
  return targetStepNumber === minimumStepNumber;
};

/**
 * 스텝 네비게이션 컴포넌트에서 사용할 Props 인터페이스
 * 목적: 스텝 간 이동을 담당하는 컴포넌트의 타입 정의
 */
export interface StepNavigationProps {
  currentStep: StepNumber; // 현재 활성화된 스텝 번호
  totalSteps: number; // 전체 스텝 개수
  onStepChange: (targetStepNumber: StepNumber) => void; // 스텝 변경 콜백 함수
}

/**
 * 진행률 표시 컴포넌트에서 사용할 Props 인터페이스
 * 목적: 진행률 바 컴포넌트의 타입 정의
 */
export interface ProgressBarProps {
  currentStep: StepNumber; // 현재 스텝 번호
  totalSteps: number; // 전체 스텝 개수
  progressWidth: number; // 진행률 퍼센트 (0-100)
}

/**
 * 스텝 유효성 검사 결과 인터페이스
 * 목적: 각 스텝의 유효성 검사 결과를 표준화된 형태로 반환
 */
export interface StepValidationResult {
  isValid: boolean; // 유효성 검사 통과 여부
  errorMessage?: string; // 실패 시 에러 메시지 (선택적)
}
