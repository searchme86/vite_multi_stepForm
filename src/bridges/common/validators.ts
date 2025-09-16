// bridges/common/validators.ts

import {
  isValidString,
  isValidObject,
  isValidArray,
  isStringArray,
  hasValidNumberProperty,
  hasValidBooleanProperty,
} from './typeGuards';

/**
 * 🔧 통합 검증 모듈
 * 5개 UI 컴포넌트에 중복되어 있던 검증 로직들을 하나로 통합
 * Phase 5 - Task 5.1: 공통 검증 로직 제거
 */

// 🔧 검증 상태 인터페이스 정의
export interface StandardValidationStatus {
  readonly containerCount: number;
  readonly paragraphCount: number;
  readonly assignedParagraphCount: number;
  readonly unassignedParagraphCount: number;
  readonly totalContentLength: number;
  readonly validationErrors: string[];
  readonly validationWarnings: string[];
  readonly isReadyForTransfer: boolean;
}

// 🔧 브릿지 설정 인터페이스 정의
export interface StandardBridgeConfiguration {
  readonly enableValidation: boolean;
  readonly enableErrorRecovery: boolean;
  readonly debugMode: boolean;
}

// 🔧 버튼용 검증 상태 인터페이스 정의
export interface ButtonValidationStatus {
  readonly containerCount: number;
  readonly paragraphCount: number;
  readonly assignedParagraphCount: number;
  readonly unassignedParagraphCount: number;
  readonly totalContentLength: number;
  readonly validationErrors: string[];
  readonly validationWarnings: string[];
  readonly isReadyForTransfer: boolean;
}

// 🔧 기본 검증 상태 생성 함수 (통합)
export function createStandardValidationStatus(): StandardValidationStatus {
  console.log('🔍 [VALIDATORS] 표준 검증 상태 기본값 생성');

  return {
    containerCount: 0,
    paragraphCount: 0,
    assignedParagraphCount: 0,
    unassignedParagraphCount: 0,
    totalContentLength: 0,
    validationErrors: [],
    validationWarnings: [],
    isReadyForTransfer: false,
  };
}

// 🔧 버튼용 검증 상태 생성 함수
export function createButtonValidationStatus(): ButtonValidationStatus {
  console.log('🔍 [VALIDATORS] 버튼용 검증 상태 기본값 생성');

  return {
    containerCount: 0,
    paragraphCount: 0,
    assignedParagraphCount: 0,
    unassignedParagraphCount: 0,
    totalContentLength: 0,
    validationErrors: [],
    validationWarnings: [],
    isReadyForTransfer: false,
  };
}

// 🔧 기본 브릿지 설정 생성 함수
export function createStandardBridgeConfiguration(): StandardBridgeConfiguration {
  console.log('🔍 [VALIDATORS] 표준 브릿지 설정 기본값 생성');

  return {
    enableValidation: false,
    enableErrorRecovery: false,
    debugMode: false,
  };
}

// 🔧 표준 검증 상태 유효성 검사 함수 (통합)
export function isValidStandardValidationStatus(
  candidateStatus: unknown
): candidateStatus is StandardValidationStatus {
  console.log('🔍 [VALIDATORS] 표준 검증 상태 유효성 검사');

  // Early Return: null이나 undefined인 경우
  const isNullishValue =
    candidateStatus === null || candidateStatus === undefined;
  if (isNullishValue) {
    console.log('🔍 [VALIDATORS] 검증 상태가 null 또는 undefined');
    return false;
  }

  // Early Return: 객체가 아닌 경우
  const isValidObjectType = isValidObject(candidateStatus);
  if (!isValidObjectType) {
    console.log('🔍 [VALIDATORS] 검증 상태가 유효한 객체가 아님');
    return false;
  }

  const statusObject = candidateStatus;

  const requiredNumberProperties = [
    'containerCount',
    'paragraphCount',
    'assignedParagraphCount',
    'unassignedParagraphCount',
    'totalContentLength',
  ];

  const requiredArrayProperties = ['validationErrors', 'validationWarnings'];

  const requiredBooleanProperties = ['isReadyForTransfer'];

  // 숫자 속성 검증
  const hasValidNumberProperties = requiredNumberProperties.every(
    (propertyName) => hasValidNumberProperty(statusObject, propertyName)
  );

  // Early Return: 필수 숫자 속성이 없는 경우
  if (!hasValidNumberProperties) {
    console.log('🔍 [VALIDATORS] 필수 숫자 속성 누락');
    return false;
  }

  // 배열 속성 검증
  const hasValidArrayProperties = requiredArrayProperties.every(
    (propertyName) => {
      // Early Return: 속성이 없는 경우
      const hasProperty = propertyName in statusObject;
      if (!hasProperty) {
        return false;
      }

      const propertyValue = Reflect.get(statusObject, propertyName);
      const isValidArrayValue = isValidArray(propertyValue);

      // Early Return: 배열이 아닌 경우
      if (!isValidArrayValue) {
        return false;
      }

      const arrayValue = propertyValue;
      const isStringArrayValue = isStringArray(arrayValue);

      return isStringArrayValue;
    }
  );

  // Early Return: 필수 배열 속성이 유효하지 않은 경우
  if (!hasValidArrayProperties) {
    console.log('🔍 [VALIDATORS] 필수 배열 속성이 유효하지 않음');
    return false;
  }

  // 불린 속성 검증
  const hasValidBooleanProperties = requiredBooleanProperties.every(
    (propertyName) => hasValidBooleanProperty(statusObject, propertyName)
  );

  // Early Return: 필수 불린 속성이 없는 경우
  if (!hasValidBooleanProperties) {
    console.log('🔍 [VALIDATORS] 필수 불린 속성 누락');
    return false;
  }

  console.log('🔍 [VALIDATORS] 표준 검증 상태 유효성 검사 통과');
  return true;
}

// 🔧 버튼용 검증 상태 유효성 검사 함수
export function isValidButtonValidationStatus(
  candidateStatus: unknown
): candidateStatus is ButtonValidationStatus {
  console.log('🔍 [VALIDATORS] 버튼용 검증 상태 유효성 검사');

  // Early Return: null이나 undefined인 경우
  const isNullishValue =
    candidateStatus === null || candidateStatus === undefined;
  if (isNullishValue) {
    console.log('🔍 [VALIDATORS] 버튼용 검증 상태가 null 또는 undefined');
    return false;
  }

  // Early Return: 객체가 아닌 경우
  const isValidObjectType = isValidObject(candidateStatus);
  if (!isValidObjectType) {
    console.log('🔍 [VALIDATORS] 버튼용 검증 상태가 유효한 객체가 아님');
    return false;
  }

  const statusObject = candidateStatus;

  const requiredProperties = new Set([
    'containerCount',
    'paragraphCount',
    'assignedParagraphCount',
    'unassignedParagraphCount',
    'totalContentLength',
    'validationErrors',
    'validationWarnings',
    'isReadyForTransfer',
  ]);

  const hasAllRequiredProperties = Array.from(requiredProperties).every(
    (propertyName) => propertyName in statusObject
  );

  // Early Return: 필수 속성이 없는 경우
  if (!hasAllRequiredProperties) {
    console.log('🔍 [VALIDATORS] 버튼용 검증 상태 필수 속성 누락');
    return false;
  }

  console.log('🔍 [VALIDATORS] 버튼용 검증 상태 유효성 검사 통과');
  return true;
}

// 🔧 브릿지 설정 유효성 검사 함수
export function isValidStandardBridgeConfiguration(
  candidateConfig: unknown
): candidateConfig is StandardBridgeConfiguration {
  console.log('🔍 [VALIDATORS] 표준 브릿지 설정 유효성 검사');

  // Early Return: null이나 undefined인 경우
  const isNullishValue =
    candidateConfig === null || candidateConfig === undefined;
  if (isNullishValue) {
    console.log('🔍 [VALIDATORS] 브릿지 설정이 null 또는 undefined');
    return false;
  }

  // Early Return: 객체가 아닌 경우
  const isValidObjectType = isValidObject(candidateConfig);
  if (!isValidObjectType) {
    console.log('🔍 [VALIDATORS] 브릿지 설정이 유효한 객체가 아님');
    return false;
  }

  const configObject = candidateConfig;

  const optionalBooleanProperties = [
    'enableValidation',
    'enableErrorRecovery',
    'debugMode',
  ];

  const hasSomeValidProperties = optionalBooleanProperties.some(
    (propertyName) => {
      // 속성이 없으면 false 반환 (선택적 속성이므로)
      const hasProperty = propertyName in configObject;
      const hasValidBooleanPropertyValue = hasProperty
        ? hasValidBooleanProperty(configObject, propertyName)
        : false;

      return hasValidBooleanPropertyValue;
    }
  );

  // Early Return: 유효한 속성이 하나도 없는 경우
  if (!hasSomeValidProperties) {
    console.log('🔍 [VALIDATORS] 브릿지 설정에 유효한 속성이 없음');
    return false;
  }

  console.log('🔍 [VALIDATORS] 표준 브릿지 설정 유효성 검사 통과');
  return true;
}

// 🔧 안전한 에러 메시지 추출 함수
export function extractSafeErrorMessage(unknownError: unknown): string {
  console.log('🔍 [VALIDATORS] 안전한 에러 메시지 추출 시작');

  // Early Return: Error 인스턴스인 경우
  const isErrorInstance = unknownError instanceof Error;
  if (isErrorInstance) {
    const errorInstance = unknownError;
    const { message: errorMessage } = errorInstance;

    console.log(
      '🔍 [VALIDATORS] Error 인스턴스에서 메시지 추출:',
      errorMessage
    );
    return errorMessage;
  }

  // Early Return: 문자열인 경우
  const isStringValue = isValidString(unknownError);
  if (isStringValue) {
    const stringValue = unknownError;
    console.log('🔍 [VALIDATORS] 문자열 에러 메시지:', stringValue);
    return stringValue;
  }

  // 기타 타입 안전 변환 시도
  try {
    const convertedString = String(unknownError);
    console.log('🔍 [VALIDATORS] 타입 변환된 에러 메시지:', convertedString);
    return convertedString;
  } catch (conversionError) {
    console.warn('⚠️ [VALIDATORS] 에러 메시지 변환 실패:', conversionError);
    return 'Unknown error occurred';
  }
}

// 🔧 문자열 배열 검증 함수 (typeGuards와 중복 방지용)
export function validateStringArray(
  candidateArray: unknown
): candidateArray is string[] {
  console.log('🔍 [VALIDATORS] 문자열 배열 검증');

  // typeGuards.ts의 isStringArray 함수 재사용
  return isStringArray(candidateArray);
}

// 🔧 검증 상태 안전 변환 함수
export function ensureSafeValidationStatus(
  rawValidationStatus: unknown
): StandardValidationStatus {
  console.log('🔍 [VALIDATORS] 검증 상태 안전 변환');

  // Early Return: 유효한 검증 상태인 경우 그대로 반환
  const isValidStatus = isValidStandardValidationStatus(rawValidationStatus);
  if (isValidStatus) {
    const validStatus = rawValidationStatus;
    console.log('🔍 [VALIDATORS] 유효한 검증 상태 확인됨');
    return validStatus;
  }

  // 유효하지 않은 경우 기본값 반환
  console.warn('⚠️ [VALIDATORS] 유효하지 않은 검증 상태, 기본값 사용');
  return createStandardValidationStatus();
}

// 🔧 브릿지 설정 안전 변환 함수
export function ensureSafeBridgeConfiguration(
  rawBridgeConfiguration: unknown
): StandardBridgeConfiguration {
  console.log('🔍 [VALIDATORS] 브릿지 설정 안전 변환');

  // Early Return: 유효한 브릿지 설정인 경우 그대로 반환
  const isValidConfig = isValidStandardBridgeConfiguration(
    rawBridgeConfiguration
  );
  if (isValidConfig) {
    const validConfig = rawBridgeConfiguration;
    console.log('🔍 [VALIDATORS] 유효한 브릿지 설정 확인됨');
    return validConfig;
  }

  // 유효하지 않은 경우 기본값 반환
  console.warn('⚠️ [VALIDATORS] 유효하지 않은 브릿지 설정, 기본값 사용');
  return createStandardBridgeConfiguration();
}

// 🔧 버튼용 검증 상태 안전 변환 함수
export function ensureSafeButtonValidationStatus(
  rawValidationStatus: unknown
): ButtonValidationStatus {
  console.log('🔍 [VALIDATORS] 버튼용 검증 상태 안전 변환');

  // Early Return: 유효한 검증 상태인 경우 그대로 반환
  const isValidStatus = isValidButtonValidationStatus(rawValidationStatus);
  if (isValidStatus) {
    const validStatus = rawValidationStatus;
    console.log('🔍 [VALIDATORS] 유효한 버튼용 검증 상태 확인됨');
    return validStatus;
  }

  // 유효하지 않은 경우 기본값 반환
  console.warn('⚠️ [VALIDATORS] 유효하지 않은 버튼용 검증 상태, 기본값 사용');
  return createButtonValidationStatus();
}

// 🔧 검증 통계 계산 함수
export function calculateValidationStatistics(
  validationStatus: StandardValidationStatus | ButtonValidationStatus
): {
  readonly progressPercentage: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly hasErrors: boolean;
  readonly hasWarnings: boolean;
  readonly isComplete: boolean;
} {
  console.log('🔍 [VALIDATORS] 검증 통계 계산');

  const {
    paragraphCount,
    assignedParagraphCount,
    validationErrors,
    validationWarnings,
    isReadyForTransfer,
  } = validationStatus;

  // 진행률 계산
  const progressPercentage =
    paragraphCount === 0
      ? 0
      : Math.round((assignedParagraphCount / paragraphCount) * 100);

  // 에러 및 경고 개수
  const errorCount = validateStringArray(validationErrors)
    ? validationErrors.length
    : 0;
  const warningCount = validateStringArray(validationWarnings)
    ? validationWarnings.length
    : 0;

  // 상태 플래그
  const hasErrors = errorCount > 0;
  const hasWarnings = warningCount > 0;
  const isComplete = isReadyForTransfer && !hasErrors;

  console.log('🔍 [VALIDATORS] 계산된 검증 통계:', {
    progressPercentage,
    errorCount,
    warningCount,
    hasErrors,
    hasWarnings,
    isComplete,
  });

  return {
    progressPercentage,
    errorCount,
    warningCount,
    hasErrors,
    hasWarnings,
    isComplete,
  };
}

// 🔧 export default 통합 검증 모듈
const validatorModule = {
  // 인터페이스는 타입이므로 export 불가

  // 기본값 생성 함수들
  createStandardValidationStatus,
  createButtonValidationStatus,
  createStandardBridgeConfiguration,

  // 유효성 검사 함수들
  isValidStandardValidationStatus,
  isValidButtonValidationStatus,
  isValidStandardBridgeConfiguration,

  // 안전 변환 함수들
  ensureSafeValidationStatus,
  ensureSafeBridgeConfiguration,
  ensureSafeButtonValidationStatus,

  // 유틸리티 함수들
  extractSafeErrorMessage,
  validateStringArray,
  calculateValidationStatistics,
};

export default validatorModule;
