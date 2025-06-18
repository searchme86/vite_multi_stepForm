// userInfoTypes.ts

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
  if (typeof domain !== 'object' || domain === null) {
    return false;
  }

  if (!('label' in domain) || !('value' in domain)) {
    return false;
  }

  const labelValue = getStringProperty(domain, 'label');
  const valueValue = getStringProperty(domain, 'value');

  if (labelValue === undefined || valueValue === undefined) {
    return false;
  }

  if (labelValue.trim().length === 0 || valueValue.trim().length === 0) {
    return false;
  }

  return true;
};

export const isValidImageFile = (file: unknown): file is File => {
  if (!(file instanceof File)) {
    return false;
  }

  const isImageType = file.type.startsWith('image/');
  if (!isImageType) {
    return false;
  }

  return true;
};

export const isNonEmptyString = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }

  const isNonEmpty = value.trim().length > 0;
  if (!isNonEmpty) {
    return false;
  }

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
  if (typeof color !== 'string') {
    return false;
  }

  const isValidColor = isValidColorValue(color);

  if (!isValidColor) {
    return false;
  }

  return true;
};

export const isStringValue = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const ensureStringValue = (value: unknown, fallback = ''): string => {
  if (isStringValue(value)) {
    return value;
  }

  return fallback;
};

const getAccurateType = (value: unknown): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  if (typeof value === 'function') return 'function';

  const basicType = typeof value;
  if (basicType === 'object') {
    if (
      value &&
      (value.constructor === Object ||
        Object.getPrototypeOf(value) === Object.prototype)
    ) {
      return 'object';
    }
    return 'object';
  }

  return basicType;
};

const getValuePreview = (value: unknown): string => {
  try {
    if (Array.isArray(value)) {
      return `Array(${value.length})`;
    }

    if (typeof value === 'object' && value !== null) {
      const keys = Object.keys(value);
      return `Object{${keys.slice(0, 3).join(', ')}${
        keys.length > 3 ? '...' : ''
      }}`;
    }

    if (typeof value === 'string') {
      return `"${value.slice(0, 20)}${value.length > 20 ? '...' : ''}"`;
    }

    return String(value);
  } catch {
    return '[복잡한 객체]';
  }
};

export const debugTypeCheck = (value: unknown, expectedType: string): void => {
  if (value === null || value === undefined) {
    if (expectedType !== 'null' && expectedType !== 'undefined') {
      console.warn(
        `⚠️ 타입 불일치 감지: {value: ${value}, expectedType: '${expectedType}', actualType: '${
          value === null ? 'null' : 'undefined'
        }', suggestion: 'null/undefined 값을 확인하세요.'}`
      );
    }
    return;
  }

  const actualType = getAccurateType(value);
  const expectedTypeLower = expectedType.toLowerCase();
  const actualTypeLower = actualType.toLowerCase();

  if (
    expectedTypeLower === 'array' &&
    (actualTypeLower === 'array' || actualTypeLower === 'object')
  ) {
    return;
  }

  if (expectedTypeLower === 'object' && actualTypeLower === 'array') {
    console.warn(
      `⚠️ 타입 불일치 감지: {value: ${getValuePreview(
        value
      )}, expectedType: '${expectedType}', actualType: '${actualType}', suggestion: '순수 객체가 필요하지만 배열이 전달되었습니다.'}`
    );
    return;
  }

  if (expectedTypeLower !== actualTypeLower) {
    console.warn(
      `⚠️ 타입 불일치 감지: {value: ${getValuePreview(
        value
      )}, expectedType: '${expectedType}', actualType: '${actualType}', suggestion: '값을 ${expectedType} 타입으로 변환하거나 타입 검증을 추가하세요.'}`
    );
  }
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
  return fallbackColor;
};
