// src/types/userInfoTypes.ts

export interface EmailDomain {
  readonly label: string;
  readonly value: string;
}

export interface ImageUploadState {
  readonly imageSrc: string;
  readonly showCropper: boolean;
  readonly cropData: string | null;
}

export interface UserInfoFields {
  readonly nickname: string;
  readonly emailPrefix: string;
  readonly emailDomain: string;
  readonly bio: string;
  readonly userImage: string;
}

export type ToastColor =
  | 'success'
  | 'danger'
  | 'warning'
  | 'primary'
  | 'default';

const isStringRecord = (obj: object): obj is Record<string, unknown> => {
  return typeof obj === 'object' && obj !== null;
};

const hasStringPropertyInternal = (obj: object, key: string): boolean => {
  if (!isStringRecord(obj)) {
    return false;
  }

  return key in obj && typeof obj[key] === 'string';
};

const getStringProperty = (obj: object, key: string): string | undefined => {
  if (hasStringPropertyInternal(obj, key) && isStringRecord(obj)) {
    const value = obj[key];
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
};

export const isValidEmailDomain = (domain: unknown): domain is EmailDomain => {
  console.log('🔍 isValidEmailDomain: 이메일 도메인 검증 시작', { domain });

  if (typeof domain !== 'object' || domain === null) {
    console.log('❌ isValidEmailDomain: 유효하지 않은 객체 타입');
    return false;
  }

  if (!('label' in domain) || !('value' in domain)) {
    console.log('❌ isValidEmailDomain: 필수 속성 누락');
    return false;
  }

  const labelValue = getStringProperty(domain, 'label');
  const valueValue = getStringProperty(domain, 'value');

  if (labelValue === undefined || valueValue === undefined) {
    console.log('❌ isValidEmailDomain: 속성값이 문자열이 아님');
    return false;
  }

  if (labelValue.trim().length === 0 || valueValue.trim().length === 0) {
    console.log('❌ isValidEmailDomain: 빈 문자열 감지');
    return false;
  }

  console.log('✅ isValidEmailDomain: 검증 통과');
  return true;
};

export const isValidImageFile = (file: unknown): file is File => {
  console.log('🔍 isValidImageFile: 이미지 파일 검증 시작', { file });

  if (!(file instanceof File)) {
    console.log('❌ isValidImageFile: File 인스턴스가 아님');
    return false;
  }

  const { type: fileType } = file;
  const isImageType = fileType.startsWith('image/');

  if (!isImageType) {
    console.log('❌ isValidImageFile: 이미지 타입이 아님', { fileType });
    return false;
  }

  console.log('✅ isValidImageFile: 검증 통과', { fileType });
  return true;
};

export const isNonEmptyString = (value: unknown): value is string => {
  console.log('🔍 isNonEmptyString: 비어있지 않은 문자열 검증', { value });

  if (typeof value !== 'string') {
    console.log('❌ isNonEmptyString: 문자열 타입이 아님');
    return false;
  }

  const trimmedValue = value.trim();
  const isNonEmpty = trimmedValue.length > 0;

  if (!isNonEmpty) {
    console.log('❌ isNonEmptyString: 빈 문자열');
    return false;
  }

  console.log('✅ isNonEmptyString: 검증 통과');
  return true;
};

const isValidColorValue = (color: string): color is ToastColor => {
  const validColors: readonly string[] = [
    'success',
    'danger',
    'warning',
    'primary',
    'default',
  ];

  return validColors.includes(color);
};

export const isValidToastColor = (color: unknown): color is ToastColor => {
  console.log('🔍 isValidToastColor: 토스트 색상 검증', { color });

  if (typeof color !== 'string') {
    console.log('❌ isValidToastColor: 문자열 타입이 아님');
    return false;
  }

  const isValidColor = isValidColorValue(color);

  if (!isValidColor) {
    console.log('❌ isValidToastColor: 유효하지 않은 색상값');
    return false;
  }

  console.log('✅ isValidToastColor: 검증 통과');
  return true;
};

export const isStringValue = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const ensureStringValue = (value: unknown, fallback = ''): string => {
  if (isStringValue(value)) {
    return value;
  }

  console.log('⚠️ ensureStringValue: fallback 값 사용', {
    originalValue: value,
    fallback,
  });
  return fallback;
};

const getAccurateType = (value: unknown): string => {
  console.log('🔍 getAccurateType: 정확한 타입 감지 시작', { value });

  if (value === null) {
    console.log('✅ getAccurateType: null 타입 감지');
    return 'null';
  }

  if (Array.isArray(value)) {
    console.log('✅ getAccurateType: array 타입 감지');
    return 'array';
  }

  if (value instanceof Date) {
    console.log('✅ getAccurateType: date 타입 감지');
    return 'date';
  }

  if (value instanceof File) {
    console.log('✅ getAccurateType: file 타입 감지');
    return 'file';
  }

  if (typeof value === 'function') {
    console.log('✅ getAccurateType: function 타입 감지');
    return 'function';
  }

  const basicType = typeof value;

  if (basicType === 'object') {
    if (
      value &&
      (value.constructor === Object ||
        Object.getPrototypeOf(value) === Object.prototype)
    ) {
      console.log('✅ getAccurateType: object 타입 감지');
      return 'object';
    }
    console.log('✅ getAccurateType: object 타입 감지 (기타 객체)');
    return 'object';
  }

  console.log('✅ getAccurateType: 기본 타입 감지', { basicType });
  return basicType;
};

const getValuePreview = (value: unknown): string => {
  try {
    if (Array.isArray(value)) {
      const { length: arrayLength } = value;
      return `Array(${arrayLength})`;
    }

    if (typeof value === 'object' && value !== null) {
      const keys = Object.keys(value);
      const { length: keysLength } = keys;
      const previewKeys = keys.slice(0, 3).join(', ');
      const hasMoreKeys = keysLength > 3 ? '...' : '';
      return `Object{${previewKeys}${hasMoreKeys}}`;
    }

    if (typeof value === 'string') {
      const { length: stringLength } = value;
      const preview = value.slice(0, 20);
      const hasMoreChars = stringLength > 20 ? '...' : '';
      return `"${preview}${hasMoreChars}"`;
    }

    return String(value);
  } catch (error) {
    console.log('⚠️ getValuePreview: 값 미리보기 생성 실패', { error });
    return '[복잡한 객체]';
  }
};

export const debugTypeCheck = (value: unknown, expectedType: string): void => {
  console.log('🔧 debugTypeCheck: 타입 검증 시작', { value, expectedType });

  if (value === null || value === undefined) {
    const actualType = value === null ? 'null' : 'undefined';

    if (expectedType !== 'null' && expectedType !== 'undefined') {
      console.warn(
        `⚠️ 타입 불일치 감지: {value: ${value}, expectedType: '${expectedType}', actualType: '${actualType}', suggestion: 'null/undefined 값을 확인하세요.'}`
      );
    }
    return;
  }

  const actualType = getAccurateType(value);
  const expectedTypeLower = expectedType.toLowerCase();
  const actualTypeLower = actualType.toLowerCase();

  console.log('🔧 debugTypeCheck: 타입 비교', {
    expectedTypeLower,
    actualTypeLower,
  });

  if (
    expectedTypeLower === 'array' &&
    (actualTypeLower === 'array' || actualTypeLower === 'object')
  ) {
    console.log('✅ debugTypeCheck: Array 타입 허용');
    return;
  }

  if (expectedTypeLower === 'object' && actualTypeLower === 'array') {
    const valuePreview = getValuePreview(value);
    console.warn(
      `⚠️ 타입 불일치 감지: {value: ${valuePreview}, expectedType: '${expectedType}', actualType: '${actualType}', suggestion: '순수 객체가 필요하지만 배열이 전달되었습니다.'}`
    );
    return;
  }

  if (expectedTypeLower !== actualTypeLower) {
    const valuePreview = getValuePreview(value);
    console.warn(
      `⚠️ 타입 불일치 감지: {value: ${valuePreview}, expectedType: '${expectedType}', actualType: '${actualType}', suggestion: '값을 ${expectedType} 타입으로 변환하거나 타입 검증을 추가하세요.'}`
    );
    return;
  }

  console.log('✅ debugTypeCheck: 타입 검증 통과');
};

export const isObject = (value: unknown): value is object => {
  return typeof value === 'object' && value !== null;
};

export const isNonNullObject = <T extends object>(
  value: unknown
): value is T => {
  return isObject(value);
};

export const hasProperty = <K extends string>(
  obj: object,
  key: K
): obj is object & Record<K, unknown> => {
  return key in obj;
};

export const hasStringProperty = <K extends string>(
  obj: object,
  key: K
): obj is object & Record<K, string> => {
  if (!hasProperty(obj, key)) {
    return false;
  }

  if (!isStringRecord(obj)) {
    return false;
  }

  const value = obj[key];
  return typeof value === 'string';
};

export const ensureValidToastColor = (color: unknown): ToastColor => {
  if (isValidToastColor(color)) {
    return color;
  }

  const fallbackColor: ToastColor = 'default';
  console.log('⚠️ ensureValidToastColor: 기본 색상 사용', {
    originalColor: color,
    fallbackColor,
  });
  return fallbackColor;
};
