// bridges/common/typeGuards.ts

/**
 * 🔧 통합 타입 가드 모듈
 * 22개 파일에 중복되어 있던 타입 가드 함수들을 하나로 통합
 * Phase 1 - Task 1.1: 타입 가드 모듈 통합
 */

// 🔧 기본 원시 타입 가드 함수들
export function isValidString(
  candidateValue: unknown
): candidateValue is string {
  console.log('🔍 [TYPE_GUARD] string 타입 검증:', typeof candidateValue);
  return typeof candidateValue === 'string';
}

export function isValidNumber(
  candidateValue: unknown
): candidateValue is number {
  console.log('🔍 [TYPE_GUARD] number 타입 검증:', typeof candidateValue);
  const isNumberType = typeof candidateValue === 'number';
  const isNotNaN = isNumberType ? !Number.isNaN(candidateValue) : false;
  return isNumberType && isNotNaN;
}

export function isValidBoolean(
  candidateValue: unknown
): candidateValue is boolean {
  console.log('🔍 [TYPE_GUARD] boolean 타입 검증:', typeof candidateValue);
  return typeof candidateValue === 'boolean';
}

export function isValidObject(
  candidateValue: unknown
): candidateValue is Record<string, unknown> {
  console.log('🔍 [TYPE_GUARD] object 타입 검증:', typeof candidateValue);

  // Early Return: null 체크
  const isNullValue = candidateValue === null;
  if (isNullValue) {
    return false;
  }

  // Early Return: undefined 체크
  const isUndefinedValue = candidateValue === undefined;
  if (isUndefinedValue) {
    return false;
  }

  const isObjectType = typeof candidateValue === 'object';
  const isArrayType = Array.isArray(candidateValue);

  return isObjectType && !isArrayType;
}

export function isValidArray(
  candidateValue: unknown
): candidateValue is unknown[] {
  console.log(
    '🔍 [TYPE_GUARD] array 타입 검증:',
    Array.isArray(candidateValue)
  );
  return Array.isArray(candidateValue);
}

export function isValidDate(candidateValue: unknown): candidateValue is Date {
  console.log(
    '🔍 [TYPE_GUARD] Date 타입 검증:',
    candidateValue instanceof Date
  );

  const isDateInstance = candidateValue instanceof Date;

  // Early Return: Date 인스턴스가 아닌 경우
  if (!isDateInstance) {
    return false;
  }

  const dateValue = candidateValue;
  const isValidDateValue = !isNaN(dateValue.getTime());

  return isValidDateValue;
}

export function isValidFunction(
  candidateValue: unknown
): candidateValue is Function {
  console.log('🔍 [TYPE_GUARD] function 타입 검증:', typeof candidateValue);
  return typeof candidateValue === 'function';
}

// 🔧 고급 컬렉션 타입 가드 함수들
export function isValidMap(
  candidateValue: unknown
): candidateValue is Map<string, unknown> {
  console.log('🔍 [TYPE_GUARD] Map 타입 검증:', candidateValue instanceof Map);
  return candidateValue instanceof Map;
}

export function isValidSet(
  candidateValue: unknown
): candidateValue is Set<unknown> {
  console.log('🔍 [TYPE_GUARD] Set 타입 검증:', candidateValue instanceof Set);
  return candidateValue instanceof Set;
}

export function isValidWeakMap(
  candidateValue: unknown
): candidateValue is WeakMap<object, unknown> {
  console.log(
    '🔍 [TYPE_GUARD] WeakMap 타입 검증:',
    candidateValue instanceof WeakMap
  );
  return candidateValue instanceof WeakMap;
}

export function isValidWeakSet(
  candidateValue: unknown
): candidateValue is WeakSet<object> {
  console.log(
    '🔍 [TYPE_GUARD] WeakSet 타입 검증:',
    candidateValue instanceof WeakSet
  );
  return candidateValue instanceof WeakSet;
}

// 🔧 특수 타입 가드 함수들
export function isValidRegExp(
  candidateValue: unknown
): candidateValue is RegExp {
  console.log(
    '🔍 [TYPE_GUARD] RegExp 타입 검증:',
    candidateValue instanceof RegExp
  );
  return candidateValue instanceof RegExp;
}

export function isValidError(candidateValue: unknown): candidateValue is Error {
  console.log(
    '🔍 [TYPE_GUARD] Error 타입 검증:',
    candidateValue instanceof Error
  );
  return candidateValue instanceof Error;
}

export function isValidPromise<T = unknown>(
  candidateValue: unknown
): candidateValue is Promise<T> {
  console.log('🔍 [TYPE_GUARD] Promise 타입 검증');

  // Early Return: null이나 undefined인 경우
  const isNullishValue =
    candidateValue === null || candidateValue === undefined;
  if (isNullishValue) {
    return false;
  }

  const hasValidObject = isValidObject(candidateValue);

  // Early Return: 유효한 객체가 아닌 경우
  if (!hasValidObject) {
    return false;
  }

  const candidateObject = candidateValue;
  const hasThenProperty = 'then' in candidateObject;

  // Early Return: then 속성이 없는 경우
  if (!hasThenProperty) {
    return false;
  }

  const thenValue = Reflect.get(candidateObject, 'then');
  const isThenFunction = isValidFunction(thenValue);

  return isThenFunction;
}

// 🔧 조합 타입 가드 함수들
export function isStringArray(
  candidateValue: unknown
): candidateValue is string[] {
  console.log('🔍 [TYPE_GUARD] string[] 타입 검증');

  const isArray = isValidArray(candidateValue);

  // Early Return: 배열이 아닌 경우
  if (!isArray) {
    return false;
  }

  const arrayValue = candidateValue;
  const allItemsAreStrings = arrayValue.every((arrayItem) =>
    isValidString(arrayItem)
  );

  return allItemsAreStrings;
}

export function isNumberArray(
  candidateValue: unknown
): candidateValue is number[] {
  console.log('🔍 [TYPE_GUARD] number[] 타입 검증');

  const isArray = isValidArray(candidateValue);

  // Early Return: 배열이 아닌 경우
  if (!isArray) {
    return false;
  }

  const arrayValue = candidateValue;
  const allItemsAreNumbers = arrayValue.every((arrayItem) =>
    isValidNumber(arrayItem)
  );

  return allItemsAreNumbers;
}

export function isBooleanArray(
  candidateValue: unknown
): candidateValue is boolean[] {
  console.log('🔍 [TYPE_GUARD] boolean[] 타입 검증');

  const isArray = isValidArray(candidateValue);

  // Early Return: 배열이 아닌 경우
  if (!isArray) {
    return false;
  }

  const arrayValue = candidateValue;
  const allItemsAreBooleans = arrayValue.every((arrayItem) =>
    isValidBoolean(arrayItem)
  );

  return allItemsAreBooleans;
}

// 🔧 nullable 타입 가드 함수들
export function isValidStringOrNull(
  candidateValue: unknown
): candidateValue is string | null {
  console.log('🔍 [TYPE_GUARD] string | null 타입 검증');

  const isNull = candidateValue === null;
  const isString = isValidString(candidateValue);

  return isNull ? true : isString ? true : false;
}

export function isValidStringOrUndefined(
  candidateValue: unknown
): candidateValue is string | undefined {
  console.log('🔍 [TYPE_GUARD] string | undefined 타입 검증');

  const isUndefined = candidateValue === undefined;
  const isString = isValidString(candidateValue);

  return isUndefined ? true : isString ? true : false;
}

export function isValidNumberOrNull(
  candidateValue: unknown
): candidateValue is number | null {
  console.log('🔍 [TYPE_GUARD] number | null 타입 검증');

  const isNull = candidateValue === null;
  const isNumber = isValidNumber(candidateValue);

  return isNull ? true : isNumber ? true : false;
}

// 🔧 특수 문자열 타입 가드 함수들
export function isNonEmptyString(
  candidateValue: unknown
): candidateValue is string {
  console.log('🔍 [TYPE_GUARD] 비어있지 않은 string 타입 검증');

  const isString = isValidString(candidateValue);

  // Early Return: 문자열이 아닌 경우
  if (!isString) {
    return false;
  }

  const stringValue = candidateValue;
  const hasContent = stringValue.trim().length > 0;

  return hasContent;
}

export function isValidEmail(
  candidateValue: unknown
): candidateValue is string {
  console.log('🔍 [TYPE_GUARD] 이메일 형식 검증');

  const isString = isValidString(candidateValue);

  // Early Return: 문자열이 아닌 경우
  if (!isString) {
    return false;
  }

  const emailValue = candidateValue;
  const emailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmailFormat = emailRegexPattern.test(emailValue);

  return isValidEmailFormat;
}

export function isValidUrl(candidateValue: unknown): candidateValue is string {
  console.log('🔍 [TYPE_GUARD] URL 형식 검증');

  const isString = isValidString(candidateValue);

  // Early Return: 문자열이 아닌 경우
  if (!isString) {
    return false;
  }

  const urlValue = candidateValue;

  try {
    const urlObject = new URL(urlValue);
    const hasValidProtocol =
      urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
    return hasValidProtocol;
  } catch (urlParseError) {
    console.log('🔍 [TYPE_GUARD] URL 파싱 실패:', urlParseError);
    return false;
  }
}

// 🔧 숫자 범위 타입 가드 함수들
export function isPositiveNumber(
  candidateValue: unknown
): candidateValue is number {
  console.log('🔍 [TYPE_GUARD] 양수 검증');

  const isNumber = isValidNumber(candidateValue);

  // Early Return: 숫자가 아닌 경우
  if (!isNumber) {
    return false;
  }

  const numberValue = candidateValue;
  const isPositive = numberValue > 0;

  return isPositive;
}

export function isNonNegativeNumber(
  candidateValue: unknown
): candidateValue is number {
  console.log('🔍 [TYPE_GUARD] 0 이상 숫자 검증');

  const isNumber = isValidNumber(candidateValue);

  // Early Return: 숫자가 아닌 경우
  if (!isNumber) {
    return false;
  }

  const numberValue = candidateValue;
  const isNonNegative = numberValue >= 0;

  return isNonNegative;
}

export function isIntegerNumber(
  candidateValue: unknown
): candidateValue is number {
  console.log('🔍 [TYPE_GUARD] 정수 검증');

  const isNumber = isValidNumber(candidateValue);

  // Early Return: 숫자가 아닌 경우
  if (!isNumber) {
    return false;
  }

  const numberValue = candidateValue;
  const isInteger = Number.isInteger(numberValue);

  return isInteger;
}

// 🔧 객체 속성 검증 함수들
export function hasValidStringProperty(
  targetObject: Record<string, unknown>,
  propertyName: string
): boolean {
  console.log('🔍 [TYPE_GUARD] 객체 문자열 속성 검증:', propertyName);

  // Early Return: 속성이 없는 경우
  const hasProperty = propertyName in targetObject;
  if (!hasProperty) {
    return false;
  }

  // Early Return: 자체 속성이 아닌 경우
  const hasOwnProperty = Object.prototype.hasOwnProperty.call(
    targetObject,
    propertyName
  );
  if (!hasOwnProperty) {
    return false;
  }

  const propertyValue = Reflect.get(targetObject, propertyName);
  const isValidStringValue = isValidString(propertyValue);

  // Early Return: 문자열이 아닌 경우
  if (!isValidStringValue) {
    return false;
  }

  const stringValue = propertyValue;
  const hasNonEmptyContent = stringValue.trim().length > 0;

  return hasNonEmptyContent;
}

export function hasValidNumberProperty(
  targetObject: Record<string, unknown>,
  propertyName: string
): boolean {
  console.log('🔍 [TYPE_GUARD] 객체 숫자 속성 검증:', propertyName);

  // Early Return: 속성이 없는 경우
  const hasProperty = propertyName in targetObject;
  if (!hasProperty) {
    return false;
  }

  const propertyValue = Reflect.get(targetObject, propertyName);
  const isValidNumberValue = isValidNumber(propertyValue);

  return isValidNumberValue;
}

export function hasValidBooleanProperty(
  targetObject: Record<string, unknown>,
  propertyName: string
): boolean {
  console.log('🔍 [TYPE_GUARD] 객체 불린 속성 검증:', propertyName);

  // Early Return: 속성이 없는 경우
  const hasProperty = propertyName in targetObject;
  if (!hasProperty) {
    return false;
  }

  const propertyValue = Reflect.get(targetObject, propertyName);
  const isValidBooleanValue = isValidBoolean(propertyValue);

  return isValidBooleanValue;
}

// 🔧 조건부 타입 가드 함수들
export function createStringValidator(minimumLength: number = 1) {
  console.log('🔍 [TYPE_GUARD] 커스텀 문자열 검증기 생성:', minimumLength);

  return function validateStringWithLength(
    candidateValue: unknown
  ): candidateValue is string {
    const isString = isValidString(candidateValue);

    // Early Return: 문자열이 아닌 경우
    if (!isString) {
      return false;
    }

    const stringValue = candidateValue;
    const meetsLengthRequirement = stringValue.length >= minimumLength;

    return meetsLengthRequirement;
  };
}

export function createNumberRangeValidator(
  minimumValue: number,
  maximumValue: number
) {
  console.log('🔍 [TYPE_GUARD] 커스텀 숫자 범위 검증기 생성:', {
    minimumValue,
    maximumValue,
  });

  return function validateNumberInRange(
    candidateValue: unknown
  ): candidateValue is number {
    const isNumber = isValidNumber(candidateValue);

    // Early Return: 숫자가 아닌 경우
    if (!isNumber) {
      return false;
    }

    const numberValue = candidateValue;
    const isWithinRange =
      numberValue >= minimumValue && numberValue <= maximumValue;

    return isWithinRange;
  };
}

export function createArrayValidator<T>(
  itemValidator: (item: unknown) => item is T
) {
  console.log('🔍 [TYPE_GUARD] 커스텀 배열 검증기 생성');

  return function validateArrayWithItems(
    candidateValue: unknown
  ): candidateValue is T[] {
    const isArray = isValidArray(candidateValue);

    // Early Return: 배열이 아닌 경우
    if (!isArray) {
      return false;
    }

    const arrayValue = candidateValue;
    const allItemsValid = arrayValue.every((arrayItem) =>
      itemValidator(arrayItem)
    );

    return allItemsValid;
  };
}

// 🔧 통합 타입 체크 유틸리티
export function getValueType(candidateValue: unknown): string {
  console.log('🔍 [TYPE_GUARD] 값의 타입 분석');

  // Early Return: null 체크
  const isNull = candidateValue === null;
  if (isNull) {
    return 'null';
  }

  // Early Return: undefined 체크
  const isUndefined = candidateValue === undefined;
  if (isUndefined) {
    return 'undefined';
  }

  const basicType = typeof candidateValue;

  // Early Return: 배열 체크
  const isArray = Array.isArray(candidateValue);
  if (isArray) {
    return 'array';
  }

  // Early Return: Date 체크
  const isDate = candidateValue instanceof Date;
  if (isDate) {
    return 'date';
  }

  // Early Return: RegExp 체크
  const isRegExp = candidateValue instanceof RegExp;
  if (isRegExp) {
    return 'regexp';
  }

  // Early Return: Map 체크
  const isMap = candidateValue instanceof Map;
  if (isMap) {
    return 'map';
  }

  // Early Return: Set 체크
  const isSet = candidateValue instanceof Set;
  if (isSet) {
    return 'set';
  }

  return basicType;
}

// 🔧 export default 통합 타입 가드 모듈
const typeGuardModule = {
  // 기본 타입 가드
  isValidString,
  isValidNumber,
  isValidBoolean,
  isValidObject,
  isValidArray,
  isValidDate,
  isValidFunction,

  // 고급 컬렉션 타입 가드
  isValidMap,
  isValidSet,
  isValidWeakMap,
  isValidWeakSet,

  // 특수 타입 가드
  isValidRegExp,
  isValidError,
  isValidPromise,

  // 조합 타입 가드
  isStringArray,
  isNumberArray,
  isBooleanArray,

  // nullable 타입 가드
  isValidStringOrNull,
  isValidStringOrUndefined,
  isValidNumberOrNull,

  // 특수 문자열 타입 가드
  isNonEmptyString,
  isValidEmail,
  isValidUrl,

  // 숫자 범위 타입 가드
  isPositiveNumber,
  isNonNegativeNumber,
  isIntegerNumber,

  // 객체 속성 검증
  hasValidStringProperty,
  hasValidNumberProperty,
  hasValidBooleanProperty,

  // 조건부 타입 가드 생성기
  createStringValidator,
  createNumberRangeValidator,
  createArrayValidator,

  // 유틸리티
  getValueType,
};

export default typeGuardModule;
