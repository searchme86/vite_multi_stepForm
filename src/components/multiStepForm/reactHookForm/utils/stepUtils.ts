import {
  StepNumber,
  getTotalSteps, // ✅ TOTAL_STEPS 대신 함수 사용
  getMinStep, // ✅ MIN_STEP 대신 함수 사용
  isValidStepNumber, // ✅ 안전성을 위해 추가
} from '../../types/stepTypes';

// stepCalculations import (일관성을 위해 권장)
import { stepCalculations } from '../../store/multiStepForm/initialMultiStepFormState';

/**
 * 현재 스텝을 기반으로 진행률을 계산하는 함수
 *
 * 변경사항:
 * - TOTAL_STEPS, MIN_STEP 상수 → getTotalSteps(), getMinStep() 함수 사용
 * - 안전한 유효성 검사 추가
 * - stepCalculations와 일관된 로직 사용
 * - 더 강화된 에러 처리와 fallback 로직
 *
 * @param currentStep 현재 스텝 번호
 * @param totalSteps 전체 스텝 수 (선택사항, 미제공시 자동 계산)
 * @returns 0-100 사이의 진행률
 */
export const calculateProgress = (
  currentStep: StepNumber,
  totalSteps?: number // optional로 변경하여 자동 계산 가능
): number => {
  console.log('📊 calculateProgress: 진행률 계산 시작', {
    currentStep,
    totalSteps,
  });

  try {
    // 현재 스텝 유효성 검사
    if (!isValidStepNumber(currentStep)) {
      console.error(
        '❌ calculateProgress: 유효하지 않은 현재 스텝:',
        currentStep
      );
      return 0; // fallback: 0% 반환
    }

    // stepCalculations 사용을 권장 (일관성 보장)
    // 이유: initialMultiStepFormState와 동일한 로직 사용
    if (!totalSteps) {
      console.log('📊 stepCalculations 사용하여 일관된 계산 수행');
      const progress = stepCalculations.calculateProgressWidth(currentStep);
      console.log('📊 calculateProgress 결과 (stepCalculations):', progress);
      return progress;
    }

    // 커스텀 totalSteps가 제공된 경우의 계산
    console.log('📊 커스텀 totalSteps로 진행률 계산:', totalSteps);

    // 안전하게 minStep 계산
    const minStep = getMinStep();
    console.log('📊 계산에 사용되는 값들:', {
      currentStep,
      minStep,
      totalSteps,
    });

    // 유효성 검사
    if (totalSteps <= 1) {
      console.warn('⚠️ totalSteps가 1 이하입니다. 100% 반환');
      return 100;
    }

    if (currentStep < minStep) {
      console.warn('⚠️ currentStep이 minStep보다 작습니다:', {
        currentStep,
        minStep,
      });
      return 0;
    }

    // 진행률 계산: (현재스텝 - 최소스텝) / (전체스텝 - 1) * 100
    const progress = ((currentStep - minStep) / (totalSteps - 1)) * 100;

    // 0-100 범위로 제한
    const safeProgress = Math.max(0, Math.min(100, progress));

    console.log('📊 calculateProgress 결과 (커스텀):', safeProgress);
    return safeProgress;
  } catch (error) {
    console.error('❌ calculateProgress 오류 발생:', error);

    // 최종 fallback: stepCalculations 사용
    try {
      console.log('🔄 fallback으로 stepCalculations 사용');
      const fallbackProgress =
        stepCalculations.calculateProgressWidth(currentStep);
      console.log('📊 fallback 진행률:', fallbackProgress);
      return fallbackProgress;
    } catch (fallbackError) {
      console.error('❌ fallback도 실패:', fallbackError);

      // 최종 최종 fallback: 기본 계산
      try {
        const minStep = getMinStep();
        const totalStepsFromConfig = getTotalSteps();
        const basicProgress =
          totalStepsFromConfig <= 1
            ? 100
            : ((currentStep - minStep) / (totalStepsFromConfig - 1)) * 100;
        const safeBasicProgress = Math.max(0, Math.min(100, basicProgress));

        console.log('📊 기본 계산 fallback 결과:', safeBasicProgress);
        return safeBasicProgress;
      } catch (finalError) {
        console.error('❌ 모든 계산 방법 실패, 기본값 0 반환:', finalError);
        return 0;
      }
    }
  }
};

/**
 * stepCalculations를 직접 사용하는 권장 함수
 * 이유: 다른 파일들과 완전히 동일한 로직 보장
 *
 * @param currentStep 현재 스텝 번호
 * @returns 0-100 사이의 진행률
 */
export const calculateProgressRecommended = (
  currentStep: StepNumber
): number => {
  console.log(
    '📊 calculateProgressRecommended: stepCalculations 사용',
    currentStep
  );

  try {
    const progress = stepCalculations.calculateProgressWidth(currentStep);
    console.log('📊 calculateProgressRecommended 결과:', progress);
    return progress;
  } catch (error) {
    console.error('❌ calculateProgressRecommended 실패:', error);
    return 0;
  }
};

/**
 * 진행률과 함께 추가 정보를 반환하는 함수
 * 이유: UI에서 더 많은 정보가 필요한 경우 활용
 *
 * @param currentStep 현재 스텝 번호
 * @returns 진행률과 스텝 정보 객체
 */
export const getProgressInfo = (currentStep: StepNumber) => {
  console.log('📊 getProgressInfo 호출됨:', currentStep);

  try {
    const minStep = getMinStep();
    const totalSteps = getTotalSteps();
    const progress = calculateProgressRecommended(currentStep);

    const info = {
      currentStep,
      minStep,
      totalSteps,
      progress,
      progressText: `${progress.toFixed(1)}%`,
      stepText: `${currentStep}/${totalSteps}`,
      isFirst: currentStep === minStep,
      isLast: currentStep === totalSteps, // 일반적으로 maxStep = totalSteps
      stepsRemaining: totalSteps - currentStep,
      stepsCompleted: currentStep - minStep,
    };

    console.log('📊 getProgressInfo 결과:', info);
    return info;
  } catch (error) {
    console.error('❌ getProgressInfo 실패:', error);
    return {
      currentStep,
      minStep: 1,
      totalSteps: 5,
      progress: 0,
      progressText: '0%',
      stepText: `${currentStep}/5`,
      isFirst: currentStep === 1,
      isLast: false,
      stepsRemaining: 5,
      stepsCompleted: 0,
    };
  }
};

/**
 * 진행률 맵 타입 정의 - 타입단언 제거를 위한 구체적 타입
 * 이유: Record 타입을 사용하되 타입단언 없이 안전하게 초기화
 */
type ProgressMap = {
  [K in StepNumber]: number;
};

/**
 * 빈 진행률 맵을 생성하는 헬퍼 함수
 * 이유: 타입단언 없이 안전하게 빈 객체를 ProgressMap 타입으로 생성
 * 수정사항: 타입 에러 해결을 위한 구체적 객체 생성
 *
 * @returns 빈 진행률 맵 객체
 */
const createEmptyProgressMap = (): ProgressMap => {
  // 타입 에러 해결: 모든 StepNumber 키를 명시적으로 정의하여 생성
  // 이유: TypeScript가 모든 필수 속성이 존재함을 확인할 수 있도록 함
  const progressMap: ProgressMap = {
    1: 0, // StepNumber 1에 대한 초기 진행률 0%
    2: 0, // StepNumber 2에 대한 초기 진행률 0%
    3: 0, // StepNumber 3에 대한 초기 진행률 0%
    4: 0, // StepNumber 4에 대한 초기 진행률 0%
    5: 0, // StepNumber 5에 대한 초기 진행률 0%
  };

  // 모든 키가 명시적으로 정의되었으므로 타입단언 없이 안전하게 반환
  // 이유: ProgressMap 타입의 모든 요구사항을 충족하는 완전한 객체
  return progressMap;
};

/**
 * 여러 스텝의 진행률을 한 번에 계산하는 유틸리티 함수
 * 이유: 스텝 목록이나 네비게이션에서 활용
 * 변경사항: 타입단언 as 제거, 구체적 타입 사용
 *
 * @param steps 계산할 스텝 번호들의 배열
 * @returns 각 스텝의 진행률 매핑 객체
 */
export const calculateMultipleProgress = (steps: StepNumber[]): ProgressMap => {
  console.log('📊 calculateMultipleProgress 호출됨:', steps);

  // 타입단언 대신 헬퍼 함수를 사용하여 안전하게 초기화
  const progressMap: ProgressMap = createEmptyProgressMap();

  steps.forEach((step: StepNumber) => {
    try {
      // progressMap[step]은 이제 타입 오류 없이 할당 가능
      progressMap[step] = calculateProgressRecommended(step);
    } catch (error) {
      console.error(`❌ 스텝 ${step} 진행률 계산 실패:`, error);
      progressMap[step] = 0;
    }
  });

  console.log('📊 calculateMultipleProgress 결과:', progressMap);
  return progressMap;
};

/**
 * 특정 스텝들만 포함한 진행률 맵을 생성하는 함수 (대안 구현)
 * 이유: 더 간단하고 직접적인 방법으로 타입단언 없이 구현
 * 수정사항: reduce 타입 에러 해결
 *
 * @param steps 계산할 스텝 번호들의 배열
 * @returns 요청된 스텝들의 진행률 매핑 객체
 */
export const calculateSpecificProgress = (
  steps: StepNumber[]
): Record<StepNumber, number> => {
  console.log('📊 calculateSpecificProgress 호출됨:', steps);

  // 타입 에러 해결: 명시적 초기값 타입 지정과 올바른 reduce 사용
  const progressMap = steps.reduce<Record<StepNumber, number>>(
    (acc, step) => {
      try {
        // acc 객체에 step 키로 진행률 값을 할당
        // 이유: Record<StepNumber, number> 타입에서 StepNumber 키로 number 값 접근
        acc[step] = calculateProgressRecommended(step);
      } catch (error) {
        console.error(`❌ 스텝 ${step} 진행률 계산 실패:`, error);
        // fallback: 에러 발생 시 0으로 설정하여 애플리케이션 중단 방지
        acc[step] = 0;
      }
      // acc 객체를 반환하여 다음 iteration에서 사용할 수 있도록 함
      return acc;
    },
    // 초기값을 빈 객체로 설정하되 제네릭으로 타입 명시
    // 이유: TypeScript가 올바른 타입을 추론할 수 있도록 도움
    Object.create(null) // 프로토타입 체인이 없는 순수 객체 생성
  );

  console.log('📊 calculateSpecificProgress 결과:', progressMap);
  return progressMap;
};

/**
 * 진행률이 변경되었는지 확인하는 함수
 * 이유: 불필요한 리렌더링 방지
 *
 * @param oldStep 이전 스텝
 * @param newStep 새로운 스텝
 * @returns 진행률 변경 여부와 변경값
 */
export const getProgressChange = (oldStep: StepNumber, newStep: StepNumber) => {
  console.log('📊 getProgressChange 호출됨:', { oldStep, newStep });

  try {
    const oldProgress = calculateProgressRecommended(oldStep);
    const newProgress = calculateProgressRecommended(newStep);
    const hasChanged = oldProgress !== newProgress;
    const difference = newProgress - oldProgress;

    const result = {
      hasChanged,
      oldProgress,
      newProgress,
      difference,
      percentageChange: difference.toFixed(1),
    };

    console.log('📊 getProgressChange 결과:', result);
    return result;
  } catch (error) {
    console.error('❌ getProgressChange 실패:', error);
    return {
      hasChanged: true, // 안전을 위해 변경된 것으로 가정
      oldProgress: 0,
      newProgress: 0,
      difference: 0,
      percentageChange: '0.0',
    };
  }
};
