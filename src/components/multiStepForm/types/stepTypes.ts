// src/components/multiStepForm/types/stepTypes.ts
// 🆕 완전 동적화된 스텝 관리 시스템 - JSON 설정 기반

// 🆕 동적 스텝 시스템에서 모든 함수들을 re-export
export {
  getMinStep,
  getMaxStep,
  getTotalSteps,
  getStepNumbers,
  getStepTitle,
  isValidStepNumber,
  isFirstStep,
  isLastStep,
  getNextStep,
  getPreviousStep,
  calculateProgressWidth,
  renderStepComponent,
} from '../utils/dynamicStepTypes';

// 🆕 동적 스텝 타입들 - export type 문법 적용
export type { StepNumber } from '../utils/dynamicStepTypes';

// 🆕 동적 스텝 컴포넌트 이름들 (JSON 설정에서 가져옴)
export type StepComponentName =
  | 'UserInfoStepContainer'
  | 'BlogBasicStepContainer'
  | 'ModularBlogEditorContainer'
  | 'BlogMediaStepContainer';

// 🆕 동적 스텝 설정 인터페이스
export interface DynamicStepConfig {
  readonly title: string;
  readonly description: string;
  readonly component: StepComponentName;
  readonly validation: readonly string[];
}

// 🆕 동적 스텝 전체 설정 타입 - StepNumber import 사용
export type DynamicStepConfigMap = Map<
  import('../utils/dynamicStepTypes').StepNumber,
  DynamicStepConfig
>;

// 🆕 개별 스텝 정보 타입
export type StepInfo = DynamicStepConfig;

// 🆕 동적 스텝 네비게이션 Props 인터페이스 - StepNumber import 사용
export interface StepNavigationProps {
  readonly currentStep: import('../utils/dynamicStepTypes').StepNumber;
  readonly totalSteps: number;
  readonly onStepChange: (
    targetStepNumber: import('../utils/dynamicStepTypes').StepNumber
  ) => void;
}

// 🆕 동적 진행률 표시 Props 인터페이스 - StepNumber import 사용
export interface ProgressBarProps {
  readonly currentStep: import('../utils/dynamicStepTypes').StepNumber;
  readonly totalSteps: number;
  readonly progressWidth: number;
}

// 🆕 동적 스텝 유효성 검사 결과 인터페이스
export interface StepValidationResult {
  readonly isValid: boolean;
  readonly errorMessage?: string;
}

// 🆕 동적 스텝 설정 생성 함수
const createDynamicStepConfigMap = (): DynamicStepConfigMap => {
  console.log('🔧 [STEP_TYPES] 동적 스텝 설정 맵 생성 시작');

  // StepNumber를 import로 사용
  type StepNumberType = import('../utils/dynamicStepTypes').StepNumber;
  const stepConfigMap = new Map<StepNumberType, DynamicStepConfig>();

  // JSON 설정을 기반으로 한 동적 스텝 구성 (stepConfig.json과 동기화)
  const dynamicStepConfigs: Array<[StepNumberType, DynamicStepConfig]> = [
    [
      1,
      {
        title: '유저 정보 입력',
        description: '기본 사용자 정보를 입력합니다',
        component: 'UserInfoStepContainer',
        validation: ['nickname', 'emailPrefix', 'emailDomain'],
      },
    ],
    [
      2,
      {
        title: '블로그 기본 정보',
        description: '블로그 제목과 설명을 입력합니다',
        component: 'BlogBasicStepContainer',
        validation: ['title', 'description'],
      },
    ],
    [
      3,
      {
        title: '모듈화 에디터',
        description: '고급 에디터로 내용을 편집합니다',
        component: 'ModularBlogEditorContainer',
        validation: ['editorCompleted'],
      },
    ],
    [
      4,
      {
        title: '블로그 미디어',
        description: '이미지와 미디어를 추가합니다',
        component: 'BlogMediaStepContainer',
        validation: [],
      },
    ],
  ];

  for (const [stepNumber, stepConfig] of dynamicStepConfigs) {
    stepConfigMap.set(stepNumber, stepConfig);
  }

  console.log('✅ [STEP_TYPES] 동적 스텝 설정 맵 생성 완료:', {
    stepCount: stepConfigMap.size,
    steps: Array.from(stepConfigMap.keys()),
    timestamp: new Date().toISOString(),
  });

  return stepConfigMap;
};

// 🆕 동적 스텝 설정 맵 인스턴스
const DYNAMIC_STEP_CONFIG_MAP = createDynamicStepConfigMap();

// 🆕 동적 스텝 설정 조회 함수들
export const getDynamicStepConfig = (
  targetStepNumber: import('../utils/dynamicStepTypes').StepNumber
): StepInfo | null => {
  console.log(`🔧 [STEP_TYPES] 동적 스텝 설정 조회 - 스텝 ${targetStepNumber}`);

  const stepConfig = DYNAMIC_STEP_CONFIG_MAP.get(targetStepNumber);

  if (stepConfig) {
    console.log(
      `✅ [STEP_TYPES] 스텝 ${targetStepNumber} 설정 조회 성공:`,
      stepConfig.title
    );
    return stepConfig;
  } else {
    console.warn(
      `⚠️ [STEP_TYPES] 스텝 ${targetStepNumber} 설정을 찾을 수 없음`
    );
    return null;
  }
};

// 🆕 특정 스텝의 설명을 가져오는 함수 (기존 호환성)
export const getStepDescription = (
  targetStepNumber: import('../utils/dynamicStepTypes').StepNumber
): string => {
  console.log(
    `🔧 [STEP_TYPES] getStepDescription 호출 - 스텝 ${targetStepNumber}`
  );

  const stepConfig = DYNAMIC_STEP_CONFIG_MAP.get(targetStepNumber);
  const stepDescription = stepConfig?.description || '';

  console.log(
    `✅ [STEP_TYPES] 스텝 ${targetStepNumber} 설명: ${stepDescription}`
  );
  return stepDescription;
};

// 🆕 특정 스텝의 컴포넌트 이름을 가져오는 함수 (기존 호환성)
export const getStepComponentName = (
  targetStepNumber: import('../utils/dynamicStepTypes').StepNumber
): StepComponentName => {
  console.log(
    `🔧 [STEP_TYPES] getStepComponentName 호출 - 스텝 ${targetStepNumber}`
  );

  const stepConfig = DYNAMIC_STEP_CONFIG_MAP.get(targetStepNumber);
  const componentName = stepConfig?.component || 'UserInfoStepContainer';

  console.log(
    `✅ [STEP_TYPES] 스텝 ${targetStepNumber} 컴포넌트: ${componentName}`
  );
  return componentName;
};

// 🆕 특정 스텝의 유효성 검사 필드 목록을 가져오는 함수 (기존 호환성)
export const getStepValidationFields = (
  targetStepNumber: import('../utils/dynamicStepTypes').StepNumber
): readonly string[] => {
  console.log(
    `🔧 [STEP_TYPES] getStepValidationFields 호출 - 스텝 ${targetStepNumber}`
  );

  const stepConfig = DYNAMIC_STEP_CONFIG_MAP.get(targetStepNumber);
  const validationFields = stepConfig?.validation || [];

  console.log(
    `✅ [STEP_TYPES] 스텝 ${targetStepNumber} 검증 필드:`,
    validationFields
  );
  return validationFields;
};

// 🆕 타입 안전한 스텝 번호 검증 함수
const isValidStepNumberSafe = (
  step: unknown
): step is import('../utils/dynamicStepTypes').StepNumber => {
  const isNumberType = typeof step === 'number';
  if (!isNumberType) {
    return false;
  }

  const isIntegerStep = Number.isInteger(step);
  if (!isIntegerStep) {
    return false;
  }

  const validSteps = [1, 2, 3, 4];
  const isInValidRange = validSteps.includes(step);

  return isInValidRange;
};

// 🆕 동적 스텝 검증 함수
export const validateDynamicStepNumber = (
  step: unknown
): step is import('../utils/dynamicStepTypes').StepNumber => {
  console.log('🔍 [STEP_TYPES] 동적 스텝 검증:', step);

  const isValid = isValidStepNumberSafe(step);

  console.log(
    `${isValid ? '✅' : '❌'} [STEP_TYPES] 동적 스텝 검증 결과: ${isValid}`
  );
  return isValid;
};

// 🆕 모든 동적 스텝 정보 조회 함수
export const getAllDynamicStepConfigs = (): Map<
  import('../utils/dynamicStepTypes').StepNumber,
  StepInfo
> => {
  console.log('🔧 [STEP_TYPES] 모든 동적 스텝 설정 조회');

  const allConfigs = new Map(DYNAMIC_STEP_CONFIG_MAP);

  console.log('✅ [STEP_TYPES] 모든 동적 스텝 설정 조회 완료:', {
    totalSteps: allConfigs.size,
    steps: Array.from(allConfigs.keys()),
  });

  return allConfigs;
};

// 🆕 동적 스텝 통계 정보 함수
export const getDynamicStepStats = (): {
  readonly totalSteps: number;
  readonly stepRange: {
    readonly min: import('../utils/dynamicStepTypes').StepNumber;
    readonly max: import('../utils/dynamicStepTypes').StepNumber;
  };
  readonly componentsUsed: readonly StepComponentName[];
  readonly validationFieldsCount: number;
} => {
  console.log('📊 [STEP_TYPES] 동적 스텝 통계 생성');

  const allSteps = Array.from(DYNAMIC_STEP_CONFIG_MAP.keys());
  const allConfigs = Array.from(DYNAMIC_STEP_CONFIG_MAP.values());

  const componentsUsed = allConfigs.map((config) => config.component);
  const uniqueComponents = [...new Set(componentsUsed)];

  const validationFieldsCount = allConfigs.reduce((total, config) => {
    return total + config.validation.length;
  }, 0);

  // 타입 안전한 최소/최대 스텝 계산
  const minStepNumber = Math.min(...allSteps);
  const maxStepNumber = Math.max(...allSteps);

  // 타입 가드를 통한 안전한 변환
  const safeMinStep: import('../utils/dynamicStepTypes').StepNumber =
    isValidStepNumberSafe(minStepNumber) ? minStepNumber : 1;
  const safeMaxStep: import('../utils/dynamicStepTypes').StepNumber =
    isValidStepNumberSafe(maxStepNumber) ? maxStepNumber : 4;

  const stats = {
    totalSteps: allSteps.length,
    stepRange: { min: safeMinStep, max: safeMaxStep },
    componentsUsed: uniqueComponents,
    validationFieldsCount,
  };

  console.log('📊 [STEP_TYPES] 동적 스텝 통계 완료:', stats);
  return stats;
};

// 🆕 동적 스텝 유효성 전체 검사 함수
export const validateAllDynamicSteps = (): StepValidationResult => {
  console.log('🔍 [STEP_TYPES] 모든 동적 스텝 유효성 검사 시작');

  try {
    const allSteps = Array.from(DYNAMIC_STEP_CONFIG_MAP.keys());
    const hasSteps = allSteps.length > 0;

    if (!hasSteps) {
      return {
        isValid: false,
        errorMessage: '설정된 스텝이 없습니다',
      };
    }

    // 연속된 스텝 번호인지 확인
    const sortedSteps = [...allSteps].sort((a, b) => a - b);
    const minStepNum = sortedSteps[0];
    const maxStepNum = sortedSteps[sortedSteps.length - 1];

    // 타입 가드를 통한 안전한 검사
    if (
      !isValidStepNumberSafe(minStepNum) ||
      !isValidStepNumberSafe(maxStepNum)
    ) {
      return {
        isValid: false,
        errorMessage: '스텝 번호 범위가 유효하지 않습니다',
      };
    }

    for (let stepNum = minStepNum; stepNum <= maxStepNum; stepNum++) {
      // 타입 가드를 통한 안전한 검사
      if (isValidStepNumberSafe(stepNum)) {
        const hasStep = DYNAMIC_STEP_CONFIG_MAP.has(stepNum);
        if (!hasStep) {
          return {
            isValid: false,
            errorMessage: `스텝 ${stepNum}이 누락되었습니다`,
          };
        }
      }
    }

    // 각 스텝의 설정 유효성 확인
    for (const [stepNumber, stepConfig] of DYNAMIC_STEP_CONFIG_MAP) {
      const { title, component, validation } = stepConfig;

      if (!title || typeof title !== 'string') {
        return {
          isValid: false,
          errorMessage: `스텝 ${stepNumber}의 제목이 유효하지 않습니다`,
        };
      }

      if (!component || typeof component !== 'string') {
        return {
          isValid: false,
          errorMessage: `스텝 ${stepNumber}의 컴포넌트가 유효하지 않습니다`,
        };
      }

      if (!Array.isArray(validation)) {
        return {
          isValid: false,
          errorMessage: `스텝 ${stepNumber}의 검증 필드가 배열이 아닙니다`,
        };
      }
    }

    console.log('✅ [STEP_TYPES] 모든 동적 스텝 유효성 검사 통과');
    return { isValid: true };
  } catch (validationError) {
    console.error('❌ [STEP_TYPES] 스텝 유효성 검사 오류:', validationError);
    return {
      isValid: false,
      errorMessage: '스텝 유효성 검사 중 오류가 발생했습니다',
    };
  }
};

// 🆕 동적 스텝 디버그 정보 함수
export const getDynamicStepDebugInfo = (): {
  readonly configMapSize: number;
  readonly configEntries: readonly [
    import('../utils/dynamicStepTypes').StepNumber,
    StepInfo
  ][];
  readonly isValid: boolean;
  readonly stats: ReturnType<typeof getDynamicStepStats>;
  readonly validation: StepValidationResult;
} => {
  console.log('🔍 [STEP_TYPES] 동적 스텝 디버그 정보 생성');

  const configEntries = Array.from(DYNAMIC_STEP_CONFIG_MAP.entries());
  const stats = getDynamicStepStats();
  const validation = validateAllDynamicSteps();

  const debugInfo = {
    configMapSize: DYNAMIC_STEP_CONFIG_MAP.size,
    configEntries: configEntries,
    isValid: validation.isValid,
    stats,
    validation,
  };

  console.log('🔍 [STEP_TYPES] 동적 스텝 디버그 정보 완료:', {
    configMapSize: debugInfo.configMapSize,
    isValid: debugInfo.isValid,
    totalSteps: debugInfo.stats.totalSteps,
  });

  return debugInfo;
};

// 🚨 하위 호환성을 위한 레거시 export들 (기존 코드 호환성)

// 레거시 STEP_CONFIG 호환성 (더 이상 사용하지 않음)
export const STEP_CONFIG = DYNAMIC_STEP_CONFIG_MAP;

// 레거시 StepConfig 타입 호환성
export type StepConfig = typeof DYNAMIC_STEP_CONFIG_MAP;

// 🆕 동적 스텝 시스템 초기화 함수
export const initializeDynamicStepSystem = (): boolean => {
  console.log('🚀 [STEP_TYPES] 동적 스텝 시스템 초기화 시작');

  try {
    const validation = validateAllDynamicSteps();

    if (!validation.isValid) {
      console.error(
        '❌ [STEP_TYPES] 동적 스텝 시스템 초기화 실패:',
        validation.errorMessage
      );
      return false;
    }

    const stats = getDynamicStepStats();

    console.log('✅ [STEP_TYPES] 동적 스텝 시스템 초기화 성공:', {
      totalSteps: stats.totalSteps,
      stepRange: stats.stepRange,
      components: stats.componentsUsed.length,
      validationFields: stats.validationFieldsCount,
    });

    return true;
  } catch (initError) {
    console.error('❌ [STEP_TYPES] 동적 스텝 시스템 초기화 오류:', initError);
    return false;
  }
};

// 🆕 동적 스텝 시스템이 초기화되었는지 확인하는 함수
export const isDynamicStepSystemReady = (): boolean => {
  const hasSteps = DYNAMIC_STEP_CONFIG_MAP.size > 0;
  const validation = validateAllDynamicSteps();
  const isReady = hasSteps && validation.isValid;

  console.log('🔍 [STEP_TYPES] 동적 스텝 시스템 준비 상태:', {
    hasSteps,
    isValid: validation.isValid,
    isReady,
  });

  return isReady;
};

// 모듈 로드 시 자동 초기화
const isSystemInitialized = initializeDynamicStepSystem();

if (isSystemInitialized) {
  console.log(
    '📄 [STEP_TYPES] ✅ 완전 동적화된 stepTypes 모듈 로드 완료 - JSON 설정 기반 시스템 활성화'
  );
} else {
  console.error(
    '📄 [STEP_TYPES] ❌ 동적 stepTypes 모듈 로드 실패 - 시스템 초기화 오류'
  );
}

console.log('🎯 [STEP_TYPES] 주요 수정사항:', {
  duplicateExportsRemoved: '중복 export 완전 제거',
  exportTypeSyntax: 'export type 문법 적용',
  importBasedTypes: 'import 기반 타입 참조',
  noTypeAssertions: '타입 단언(as) 완전 제거',
  noAnyTypes: 'any 타입 완전 제거',
  singleSourcePrinciple: '단일 소스 원칙 준수',
});
